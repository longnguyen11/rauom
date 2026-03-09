import { Temporal } from "@js-temporal/polyfill";
import { nanoid } from "nanoid";
import { z } from "zod";

import { getEnv } from "@/lib/cloudflare";
import { mapDishesById } from "@/lib/dishes";
import { quoteDeliveryForAddress } from "@/lib/distance";
import {
  calculateTaxAmountCents,
  calculateTotalCents,
  type DeliveryPricingRule,
} from "@/lib/pricing";
import {
  getActiveDeliveryPricingRule,
  getActiveTaxRateBps,
  getOperationalSettings,
} from "@/lib/settings";
import {
  getTimeslotById,
  listAvailableTimeslots,
  releaseTimeslotCapacity,
  reserveTimeslotCapacity,
} from "@/lib/timeslots";
import type {
  AdminOrderSummary,
  CheckoutEstimateInput,
  CheckoutSubmitInput,
  DeliveryAddress,
  DishBulkDiscountTier,
  OrderEstimate,
  OrderSummary,
  OrderStatus,
} from "@/lib/types";
import { dbAll, requireDb } from "@/lib/db";
import { isUtcSlotEligible } from "@/lib/time";

const cartLineSchema = z.object({
  dishId: z.string().min(1),
  quantity: z.number().int().positive().max(25),
});

const deliveryAddressSchema = z.object({
  line1: z.string().min(3).max(120),
  line2: z.string().max(120).optional(),
  city: z.string().min(2).max(120),
  state: z.string().min(2).max(2),
  zip: z.string().regex(/^\d{5}(?:-\d{4})?$/, "ZIP code must be valid"),
});

const checkoutEstimateSchema = z.object({
  fulfillmentType: z.enum(["delivery", "pickup"]),
  items: z.array(cartLineSchema).min(1),
  deliveryAddress: deliveryAddressSchema.optional(),
});

const checkoutSubmitSchema = checkoutEstimateSchema.extend({
  customerName: z.string().min(2).max(120),
  email: z.string().trim().max(200).email().optional().or(z.literal("")),
  phone: z
    .string()
    .min(10)
    .max(25)
    .regex(/^[\d\s()+-]{10,25}$/),
  notes: z.string().max(1000).optional(),
  paymentMethod: z.enum(["cash", "zelle", "venmo"]),
  timeslotId: z.string().min(3),
  turnstileToken: z.string().optional(),
  idempotencyKey: z.string().min(8).max(128),
});

function assertDeliveryAddress(
  fulfillmentType: "delivery" | "pickup",
  deliveryAddress?: DeliveryAddress,
): DeliveryAddress | undefined {
  if (fulfillmentType === "pickup") {
    return undefined;
  }

  if (!deliveryAddress) {
    throw new Error("Delivery address is required for delivery orders.");
  }

  return deliveryAddressSchema.parse(deliveryAddress);
}

function createOrderNumber(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const first = alphabet[Math.floor(Math.random() * alphabet.length)];
  const second = alphabet[Math.floor(Math.random() * alphabet.length)];
  const digits = Math.floor(Math.random() * 10_000)
    .toString()
    .padStart(4, "0");

  return `${first}${second}${digits}`;
}

function isOrderNumberUniqueConstraintError(error: unknown): boolean {
  if (!error) {
    return false;
  }

  const rawMessage =
    typeof error === "object" && "message" in error
      ? String((error as { message?: unknown }).message ?? "")
      : String(error);

  const message = rawMessage.toLowerCase();
  return message.includes("unique") && message.includes("order_number");
}

function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function getBulkDiscountPercentForQuantity(
  quantity: number,
  tiers: DishBulkDiscountTier[],
): number {
  let discountPercent = 0;
  for (const tier of tiers) {
    if (quantity >= tier.minQuantity) {
      discountPercent = Math.max(discountPercent, tier.discountPercent);
    }
  }
  return discountPercent;
}

function getBulkDiscountRuleLabel(tiers: DishBulkDiscountTier[]): string {
  if (tiers.length === 0) {
    return "No bulk discount configured";
  }

  return tiers.map((tier) => {
    return `${tier.minQuantity}+ servings: ${tier.discountPercent}% off`;
  }).join("; ");
}

function maskEmail(email: string): string {
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain || localPart.length < 3) {
    return email;
  }

  return `${localPart.slice(0, 2)}***@${domain}`;
}

async function verifyTurnstileToken(
  token: string | undefined,
  ipAddress: string | null,
): Promise<void> {
  const env = getEnv();
  if (!env.TURNSTILE_SECRET_KEY) {
    return;
  }

  if (!token) {
    throw new Error("Turnstile validation is required.");
  }

  const formData = new FormData();
  formData.append("secret", env.TURNSTILE_SECRET_KEY);
  formData.append("response", token);
  if (ipAddress) {
    formData.append("remoteip", ipAddress);
  }

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    throw new Error("Turnstile verification failed.");
  }

  const result = (await response.json()) as { success?: boolean };
  if (!result.success) {
    throw new Error("Turnstile verification failed.");
  }
}

interface InternalEstimateResult extends OrderEstimate {
  pricingRule: DeliveryPricingRule;
  validatedItems: Array<{ dishId: string; quantity: number }>;
  deliveryAddress?: DeliveryAddress;
}

async function computeEstimate(
  input: CheckoutEstimateInput,
): Promise<InternalEstimateResult> {
  const parsed = checkoutEstimateSchema.parse(input);

  const dishMap = await mapDishesById(parsed.items.map((item) => item.dishId));
  if (dishMap.size !== parsed.items.length) {
    throw new Error("Some dishes are no longer available.");
  }

  let subtotalCents = 0;
  let totalItemQuantity = 0;
  let bulkDiscountCents = 0;
  let maxDishLeadTimeDays = 1;
  const bulkPolicyLines = new Set<string>();

  for (const item of parsed.items) {
    const dish = dishMap.get(item.dishId);
    if (!dish || dish.status !== "live") {
      throw new Error("Some dishes are not currently live.");
    }

    const lineSubtotalCents = dish.priceCents * item.quantity;
    const lineDiscountPercent = getBulkDiscountPercentForQuantity(
      item.quantity,
      dish.bulkDiscountTiers,
    );
    const lineDiscountCents =
      lineDiscountPercent > 0
        ? Math.round((lineSubtotalCents * lineDiscountPercent) / 100)
        : 0;

    subtotalCents += lineSubtotalCents;
    totalItemQuantity += item.quantity;
    bulkDiscountCents += lineDiscountCents;
    maxDishLeadTimeDays = Math.max(maxDishLeadTimeDays, dish.leadTimeDays);

    bulkPolicyLines.add(`${dish.name}: ${getBulkDiscountRuleLabel(dish.bulkDiscountTiers)}`);
  }

  const subtotalAfterDiscountCents = Math.max(0, subtotalCents - bulkDiscountCents);

  const operational = await getOperationalSettings();
  const leadTimeDays = Math.max(maxDishLeadTimeDays, operational.minLeadDaysDefault);

  const pricingRule = await getActiveDeliveryPricingRule();

  let quote: OrderEstimate["quote"];
  let deliveryFeeCents = 0;
  let deliveryAddress: DeliveryAddress | undefined;

  if (parsed.fulfillmentType === "delivery") {
    deliveryAddress = assertDeliveryAddress(parsed.fulfillmentType, parsed.deliveryAddress);
    if (!deliveryAddress) {
      throw new Error("Delivery address is required for delivery orders.");
    }
    quote = await quoteDeliveryForAddress(deliveryAddress, pricingRule);
    deliveryFeeCents = quote.deliveryFeeCents;

    if (quote.distanceMiles > pricingRule.maxDistanceMiles) {
      throw new Error(
        "Delivery not available for this address. Pickup is still available.",
      );
    }

    if (
      pricingRule.minimumOrderEnabled &&
      pricingRule.minimumOrderAmountDeliveryCents !== null &&
      subtotalAfterDiscountCents < pricingRule.minimumOrderAmountDeliveryCents
    ) {
      throw new Error(
        `Delivery minimum is $${(pricingRule.minimumOrderAmountDeliveryCents / 100).toFixed(2)}.`,
      );
    }
  } else if (
    pricingRule.minimumOrderEnabled &&
    pricingRule.minimumOrderAmountPickupCents !== null &&
    subtotalAfterDiscountCents < pricingRule.minimumOrderAmountPickupCents
  ) {
    throw new Error(
      `Pickup minimum is $${(pricingRule.minimumOrderAmountPickupCents / 100).toFixed(2)}.`,
    );
  }

  const taxRateBps = await getActiveTaxRateBps();
  const taxAmountCents = calculateTaxAmountCents(subtotalAfterDiscountCents, taxRateBps);
  const totalCents = calculateTotalCents(
    subtotalAfterDiscountCents,
    deliveryFeeCents,
    taxAmountCents,
  );

  const notes = [
    `Lead time requirement: ${leadTimeDays} day(s) based on selected dishes.`,
    `Manual payment confirmation must happen at least ${operational.manualPaymentBufferHours} hours before fulfillment.`,
    ...[...bulkPolicyLines].map((line) => `Bulk policy - ${line}`),
  ];

  if (bulkDiscountCents > 0) {
    notes.unshift(`Bulk discount applied: -${formatUsd(bulkDiscountCents)}.`);
  }

  return {
    currency: "USD",
    totalItemQuantity,
    subtotalCents,
    bulkDiscountCents,
    subtotalAfterDiscountCents,
    deliveryFeeCents,
    taxRateBps,
    taxAmountCents,
    totalCents,
    leadTimeDays,
    maxDishLeadTimeDays,
    notes,
    quote,
    pricingRule,
    validatedItems: parsed.items,
    deliveryAddress,
  };
}

export async function estimateOrder(
  input: CheckoutEstimateInput,
): Promise<OrderEstimate> {
  const estimate = await computeEstimate(input);

  return {
    currency: estimate.currency,
    totalItemQuantity: estimate.totalItemQuantity,
    subtotalCents: estimate.subtotalCents,
    bulkDiscountCents: estimate.bulkDiscountCents,
    subtotalAfterDiscountCents: estimate.subtotalAfterDiscountCents,
    deliveryFeeCents: estimate.deliveryFeeCents,
    taxRateBps: estimate.taxRateBps,
    taxAmountCents: estimate.taxAmountCents,
    totalCents: estimate.totalCents,
    leadTimeDays: estimate.leadTimeDays,
    maxDishLeadTimeDays: estimate.maxDishLeadTimeDays,
    notes: estimate.notes,
    quote: estimate.quote,
  };
}

async function sendOrderEmails(order: {
  orderNumber: string;
  customerName: string;
  email?: string;
  totalCents: number;
  fulfillmentTimeLocal: string;
  status: OrderStatus;
}): Promise<void> {
  const env = getEnv();
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL || !env.RESEND_OWNER_EMAIL) {
    return;
  }

  const formattedTotal = `$${(order.totalCents / 100).toFixed(2)}`;
  const customerEmailDisplay = order.email
    ? maskEmail(order.email)
    : "no email provided";

  const requests: Promise<Response>[] = [
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.RESEND_FROM_EMAIL,
        to: env.RESEND_OWNER_EMAIL,
        subject: `New Rau Om order ${order.orderNumber}`,
        html: `<p>New order received.</p><p>Order: <strong>${order.orderNumber}</strong></p><p>Customer: ${order.customerName} (${customerEmailDisplay})</p><p>Total: ${formattedTotal}</p><p>Fulfillment: ${order.fulfillmentTimeLocal}</p>`,
      }),
    }),
  ];

  if (order.email) {
    requests.push(
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: env.RESEND_FROM_EMAIL,
          to: order.email,
          subject: `Rau Om order received (${order.orderNumber})`,
          html: `<p>Thanks for ordering from Rau Om.</p><p>We received your order <strong>${order.orderNumber}</strong> and it is currently <strong>${order.status}</strong>.</p><p>Total: ${formattedTotal}</p><p>Fulfillment: ${order.fulfillmentTimeLocal}</p>`,
        }),
      }),
    );
  }

  await Promise.all(requests);
}

export async function listTimeslotsForCart(
  fulfillmentType: "delivery" | "pickup",
  items: Array<{ dishId: string; quantity: number }>,
  daysAhead = 60,
) {
  const dishMap = await mapDishesById(items.map((item) => item.dishId));
  const maxLeadDays = Math.max(
    1,
    ...items.map((item) => dishMap.get(item.dishId)?.leadTimeDays ?? 1),
  );

  return listAvailableTimeslots(fulfillmentType, maxLeadDays, daysAhead);
}

export async function createOrder(
  input: CheckoutSubmitInput,
  ipAddress: string | null,
): Promise<OrderSummary> {
  const parsed = checkoutSubmitSchema.parse(input);
  const normalizedEmail = parsed.email?.trim().toLowerCase() ?? "";
  await verifyTurnstileToken(parsed.turnstileToken, ipAddress);

  const estimate = await computeEstimate(parsed);
  if (
    parsed.paymentMethod === "cash" &&
    (estimate.subtotalCents > 10_000 || estimate.totalCents > 10_000)
  ) {
    throw new Error("Orders above $100 must be paid with Zelle or Venmo.");
  }

  const operational = await getOperationalSettings();

  const timeslot = await getTimeslotById(parsed.timeslotId);
  if (!timeslot) {
    throw new Error("Selected timeslot no longer exists.");
  }

  if (timeslot.slotType !== parsed.fulfillmentType) {
    throw new Error("Selected timeslot does not match fulfillment type.");
  }

  if (
    !isUtcSlotEligible(
      timeslot.startTimeUtc,
      estimate.leadTimeDays,
      operational.manualPaymentBufferHours,
      operational.timezone,
    )
  ) {
    throw new Error(
      "Selected slot no longer satisfies lead-time and confirmation rules. Please choose a later slot.",
    );
  }

  const reserved = await reserveTimeslotCapacity(parsed.timeslotId);
  if (!reserved) {
    throw new Error("That slot is full. Please choose another slot.");
  }

  const db = requireDb();

  const now = Temporal.Now.instant();
  const slotStart = Temporal.Instant.from(timeslot.startTimeUtc);
  const confirmationDeadline = slotStart.subtract({
    hours: operational.manualPaymentBufferHours,
  });

  const orderId = `order_${nanoid(16)}`;
  let orderNumber = "";

  try {
    const existingOrder = await dbAll<{
      id: string;
      order_number: string;
      status: OrderStatus;
      total_after_tax_cents: number;
      currency: string;
      fulfillment_type: "delivery" | "pickup";
      fulfillment_time_local: string;
      created_at_utc: string;
    }>(
      `SELECT id, order_number, status, total_after_tax_cents, currency, fulfillment_type, fulfillment_time_local, created_at_utc
       FROM orders
       WHERE idempotency_key = ?
       LIMIT 1`,
      [parsed.idempotencyKey],
    );

    if (existingOrder[0]) {
      return {
        id: existingOrder[0].id,
        orderNumber: existingOrder[0].order_number,
        status: existingOrder[0].status,
        totalCents: existingOrder[0].total_after_tax_cents,
        currency: existingOrder[0].currency,
        fulfillmentType: existingOrder[0].fulfillment_type,
        fulfillmentTimeLocal: existingOrder[0].fulfillment_time_local,
        createdAtUtc: existingOrder[0].created_at_utc,
      };
    }

    let inserted = false;
    for (let attempt = 0; attempt < 25; attempt += 1) {
      orderNumber = createOrderNumber();
      try {
        const insertOrder = await db
          .prepare(
            `INSERT INTO orders (
              id,
              order_number,
              customer_name,
              email,
              phone,
              fulfillment_type,
              fulfillment_time_local,
              fulfillment_time_utc,
              timeslot_id,
              delivery_address_line1,
              delivery_address_line2,
              delivery_city,
              delivery_state,
              delivery_zip,
              delivery_lat,
              delivery_lng,
              delivery_distance_mi,
              subtotal_before_tax_cents,
              tax_rate_snapshot_bps,
              tax_amount_cents,
              delivery_fee_cents,
              total_after_tax_cents,
              currency,
              notes,
              payment_method_selected,
              payment_status,
              payment_due_at_utc,
              confirmation_deadline_utc,
              status,
              distance_source,
              delivery_fee_rule_snapshot_json,
              kitchen_priority_score,
              kitchen_group,
              idempotency_key,
              created_at_utc,
              updated_at_utc
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'USD', ?, ?, 'unpaid', ?, ?, 'pending_confirmation', ?, ?, 0, 'cook_now', ?, ?, ?)`,
          )
          .bind(
            orderId,
            orderNumber,
            parsed.customerName,
            normalizedEmail,
            parsed.phone,
            parsed.fulfillmentType,
            `${timeslot.dateLocal} ${timeslot.startTimeLocal}`,
            timeslot.startTimeUtc,
            timeslot.id,
            estimate.deliveryAddress?.line1 ?? null,
            estimate.deliveryAddress?.line2 ?? null,
            estimate.deliveryAddress?.city ?? null,
            estimate.deliveryAddress?.state ?? null,
            estimate.deliveryAddress?.zip ?? null,
            estimate.quote?.destinationLat ?? null,
            estimate.quote?.destinationLng ?? null,
            estimate.quote?.distanceMiles ?? null,
            estimate.subtotalAfterDiscountCents,
            estimate.taxRateBps,
            estimate.taxAmountCents,
            estimate.deliveryFeeCents,
            estimate.totalCents,
            parsed.notes ?? null,
            parsed.paymentMethod,
            confirmationDeadline.toString(),
            confirmationDeadline.toString(),
            estimate.quote?.distanceSource ?? null,
            JSON.stringify(estimate.pricingRule),
            parsed.idempotencyKey,
            now.toString(),
            now.toString(),
          )
          .run();

        if ((insertOrder.meta.changes ?? 0) === 1) {
          inserted = true;
          break;
        }
      } catch (error) {
        if (isOrderNumberUniqueConstraintError(error)) {
          continue;
        }
        throw error;
      }
    }

    if (!inserted) {
      throw new Error("Could not allocate a unique order number. Please retry.");
    }

    const dishMap = await mapDishesById(parsed.items.map((item) => item.dishId));

    for (const item of parsed.items) {
      const dish = dishMap.get(item.dishId);
      if (!dish) {
        throw new Error("Dish lookup failed during order creation.");
      }

      await db
        .prepare(
          `INSERT INTO order_items (
            id,
            order_id,
            dish_id,
            dish_name_snapshot,
            unit_price_snapshot_cents,
            quantity,
            qty_reserved_from_prep,
            qty_to_cook,
            item_fulfillment_status
          ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, 'cook_required')`,
        )
        .bind(
          `oi_${nanoid(16)}`,
          orderId,
          dish.id,
          dish.name,
          dish.priceCents,
          item.quantity,
          item.quantity,
        )
        .run();
    }

    await db
      .prepare(
        `INSERT INTO order_audit_log (
          id,
          order_id,
          event_type,
          old_status,
          new_status,
          actor_admin_id,
          event_at_utc,
          notes
        ) VALUES (?, ?, 'status_change', NULL, 'pending_confirmation', NULL, ?, 'Order created by checkout')`,
      )
      .bind(`log_${nanoid(12)}`, orderId, now.toString())
      .run();

    const summary: OrderSummary = {
      id: orderId,
      orderNumber,
      status: "pending_confirmation",
      totalCents: estimate.totalCents,
      currency: "USD",
      fulfillmentType: parsed.fulfillmentType,
      fulfillmentTimeLocal: `${timeslot.dateLocal} ${timeslot.startTimeLocal}`,
      createdAtUtc: now.toString(),
    };

    await sendOrderEmails({
      orderNumber: summary.orderNumber,
      customerName: parsed.customerName,
      email: normalizedEmail || undefined,
      totalCents: summary.totalCents,
      fulfillmentTimeLocal: summary.fulfillmentTimeLocal,
      status: summary.status,
    });

    return summary;
  } catch (error) {
    await releaseTimeslotCapacity(parsed.timeslotId);
    throw error;
  }
}

interface AdminOrderRow {
  id: string;
  order_number: string;
  status: OrderStatus;
  total_after_tax_cents: number;
  currency: string;
  fulfillment_type: "delivery" | "pickup";
  fulfillment_time_local: string;
  created_at_utc: string;
  customer_name: string;
  email: string;
  phone: string;
  payment_method_selected: "cash" | "zelle" | "venmo";
  payment_status: "unpaid" | "paid" | "refunded_partial" | "refunded_full";
  kitchen_group: "cook_now" | "ready_from_prep" | "later";
}

interface AdminShoppingRow {
  order_id: string;
  order_number: string;
  order_status: OrderStatus;
  order_item_id: string;
  dish_id: string;
  dish_name_snapshot: string;
  quantity: number;
  ingredient_name: string | null;
  ingredient_is_allergen: number | null;
}

export interface AdminShoppingDishTotal {
  dishId: string;
  dishName: string;
  totalQuantity: number;
}

export interface AdminShoppingIngredientTotal {
  name: string;
  isAllergen: boolean;
  requiredUnits: number;
  usedByDishes: string[];
}

export interface AdminShoppingListSummary {
  statuses: OrderStatus[];
  orderCount: number;
  lineItemCount: number;
  dishes: AdminShoppingDishTotal[];
  ingredients: AdminShoppingIngredientTotal[];
}

const SHOPPING_ELIGIBLE_STATUSES: OrderStatus[] = [
  "pending_confirmation",
  "confirmed",
  "preparing",
];

function normalizeShoppingStatuses(
  statuses?: OrderStatus[],
): OrderStatus[] {
  const source =
    statuses && statuses.length > 0
      ? statuses
      : (["pending_confirmation", "confirmed"] as OrderStatus[]);

  const seen = new Set<OrderStatus>();
  const result: OrderStatus[] = [];

  for (const status of source) {
    if (!SHOPPING_ELIGIBLE_STATUSES.includes(status) || seen.has(status)) {
      continue;
    }
    seen.add(status);
    result.push(status);
  }

  if (result.length === 0) {
    return ["pending_confirmation", "confirmed"];
  }

  return result;
}

export async function getAdminShoppingList(
  statuses?: OrderStatus[],
): Promise<AdminShoppingListSummary> {
  const normalizedStatuses = normalizeShoppingStatuses(statuses);
  const placeholders = normalizedStatuses.map(() => "?").join(", ");

  const rows = await dbAll<AdminShoppingRow>(
    `SELECT
      o.id AS order_id,
      o.order_number,
      o.status AS order_status,
      oi.id AS order_item_id,
      oi.dish_id,
      oi.dish_name_snapshot,
      oi.quantity,
      i.name AS ingredient_name,
      i.is_allergen AS ingredient_is_allergen
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    LEFT JOIN ingredients i ON i.dish_id = oi.dish_id
    WHERE o.status IN (${placeholders})
    ORDER BY o.created_at_utc DESC, o.id, oi.id`,
    normalizedStatuses,
  );

  const orderIds = new Set<string>();
  const lineIds = new Set<string>();

  const dishTotals = new Map<string, AdminShoppingDishTotal>();
  const seenDishPerLine = new Set<string>();

  const ingredientTotals = new Map<
    string,
    {
      name: string;
      isAllergen: boolean;
      requiredUnits: number;
      usedByDishes: Set<string>;
    }
  >();
  const seenIngredientPerLine = new Set<string>();

  for (const row of rows) {
    orderIds.add(row.order_id);
    lineIds.add(row.order_item_id);

    if (!seenDishPerLine.has(row.order_item_id)) {
      seenDishPerLine.add(row.order_item_id);
      const existingDish = dishTotals.get(row.dish_id);
      if (existingDish) {
        existingDish.totalQuantity += row.quantity;
      } else {
        dishTotals.set(row.dish_id, {
          dishId: row.dish_id,
          dishName: row.dish_name_snapshot,
          totalQuantity: row.quantity,
        });
      }
    }

    const ingredientName = row.ingredient_name?.trim();
    if (!ingredientName) {
      continue;
    }

    const ingredientKey = ingredientName.toLowerCase();
    const lineIngredientKey = `${row.order_item_id}::${ingredientKey}`;
    if (seenIngredientPerLine.has(lineIngredientKey)) {
      continue;
    }
    seenIngredientPerLine.add(lineIngredientKey);

    const existingIngredient = ingredientTotals.get(ingredientKey);
    if (existingIngredient) {
      existingIngredient.requiredUnits += row.quantity;
      existingIngredient.isAllergen =
        existingIngredient.isAllergen || row.ingredient_is_allergen === 1;
      existingIngredient.usedByDishes.add(row.dish_name_snapshot);
    } else {
      ingredientTotals.set(ingredientKey, {
        name: ingredientName,
        isAllergen: row.ingredient_is_allergen === 1,
        requiredUnits: row.quantity,
        usedByDishes: new Set([row.dish_name_snapshot]),
      });
    }
  }

  const dishes = [...dishTotals.values()].sort((a, b) =>
    b.totalQuantity - a.totalQuantity || a.dishName.localeCompare(b.dishName),
  );

  const ingredients = [...ingredientTotals.values()]
    .map((ingredient) => ({
      name: ingredient.name,
      isAllergen: ingredient.isAllergen,
      requiredUnits: ingredient.requiredUnits,
      usedByDishes: [...ingredient.usedByDishes].sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => b.requiredUnits - a.requiredUnits || a.name.localeCompare(b.name));

  return {
    statuses: normalizedStatuses,
    orderCount: orderIds.size,
    lineItemCount: lineIds.size,
    dishes,
    ingredients,
  };
}

export async function listAdminOrders(limit = 100): Promise<AdminOrderSummary[]> {
  const rows = await dbAll<AdminOrderRow>(
    `SELECT
      id,
      order_number,
      status,
      total_after_tax_cents,
      currency,
      fulfillment_type,
      fulfillment_time_local,
      created_at_utc,
      customer_name,
      email,
      phone,
      payment_method_selected,
      payment_status,
      kitchen_group
    FROM orders
    ORDER BY created_at_utc DESC
    LIMIT ?`,
    [limit],
  );

  return rows.map((row) => ({
    id: row.id,
    orderNumber: row.order_number,
    status: row.status,
    totalCents: row.total_after_tax_cents,
    currency: row.currency,
    fulfillmentType: row.fulfillment_type,
    fulfillmentTimeLocal: row.fulfillment_time_local,
    createdAtUtc: row.created_at_utc,
    customerName: row.customer_name,
    email: row.email,
    phone: row.phone,
    paymentMethodSelected: row.payment_method_selected,
    paymentStatus: row.payment_status,
    kitchenGroup: row.kitchen_group,
  }));
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  adminActor = "admin",
  notes?: string,
): Promise<void> {
  const db = requireDb();

  const existing = await dbAll<{ status: OrderStatus; timeslot_id: string }>(
    `SELECT status, timeslot_id FROM orders WHERE id = ? LIMIT 1`,
    [orderId],
  );

  const row = existing[0];
  if (!row) {
    throw new Error("Order not found.");
  }

  await db
    .prepare(
      `UPDATE orders
       SET status = ?,
           updated_at_utc = CURRENT_TIMESTAMP,
           cancelled_at_utc = CASE WHEN ? = 'cancelled' THEN CURRENT_TIMESTAMP ELSE cancelled_at_utc END
       WHERE id = ?`,
    )
    .bind(newStatus, newStatus, orderId)
    .run();

  await db
    .prepare(
      `INSERT INTO order_audit_log (
        id,
        order_id,
        event_type,
        old_status,
        new_status,
        actor_admin_id,
        notes
      ) VALUES (?, ?, 'status_change', ?, ?, ?, ?)`,
    )
    .bind(`log_${nanoid(12)}`, orderId, row.status, newStatus, adminActor, notes ?? null)
    .run();

  if (newStatus === "cancelled" && row.status !== "cancelled") {
    await releaseTimeslotCapacity(row.timeslot_id);
  }
}

export async function getOrderByIdempotencyKey(
  idempotencyKey: string,
): Promise<OrderSummary | null> {
  const rows = await dbAll<{
    id: string;
    order_number: string;
    status: OrderStatus;
    total_after_tax_cents: number;
    currency: string;
    fulfillment_type: "delivery" | "pickup";
    fulfillment_time_local: string;
    created_at_utc: string;
  }>(
    `SELECT id, order_number, status, total_after_tax_cents, currency, fulfillment_type, fulfillment_time_local, created_at_utc
     FROM orders
     WHERE idempotency_key = ?
     LIMIT 1`,
    [idempotencyKey],
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    orderNumber: row.order_number,
    status: row.status,
    totalCents: row.total_after_tax_cents,
    currency: row.currency,
    fulfillmentType: row.fulfillment_type,
    fulfillmentTimeLocal: row.fulfillment_time_local,
    createdAtUtc: row.created_at_utc,
  };
}
