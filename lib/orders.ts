import { Temporal } from "@js-temporal/polyfill";
import { nanoid } from "nanoid";
import { z } from "zod";

import { getEnv } from "@/lib/cloudflare";
import { mapDishesById } from "@/lib/dishes";
import { quoteDeliveryForAddress } from "@/lib/distance";
import { getDishRequiredLeadTimeDays } from "@/lib/menu-pricing";
import {
  calculateTaxAmountCents,
  calculateTotalCents,
  type DeliveryPricingRule,
} from "@/lib/pricing";
import {
  getActiveDeliveryPricingRule,
  getActiveTaxRateBps,
  getBlackoutDateSet,
  getOperationalSettings,
} from "@/lib/settings";
import {
  releaseTimeslotCapacity,
  reserveTimeslotCapacity,
} from "@/lib/timeslots";
import type {
  AdminOrderSummary,
  CheckoutEstimateInput,
  CheckoutSubmitInput,
  DeliveryAddress,
  OrderEstimate,
  OrderSummary,
  OrderStatus,
  PickupLocation,
  Timeslot,
} from "@/lib/types";
import { dbAll, requireDb } from "@/lib/db";

const ADVANCE_PAYMENT_THRESHOLD_CENTS = 5_000;

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

const dateLocalSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const pickupLocationSchema = z.enum([
  "long_van_temple",
  "phap_vu_temple",
  "fancy_fruit",
]);

const checkoutEstimateSchema = z.object({
  fulfillmentType: z.enum(["delivery", "pickup"]),
  items: z.array(cartLineSchema).min(1),
  deliveryAddress: deliveryAddressSchema.optional(),
  fulfillmentDateLocal: dateLocalSchema.optional(),
  nonBatchDayRequested: z.boolean().optional(),
  pickupLocation: pickupLocationSchema.optional(),
  pickupTimeLocal: z.string().regex(/^\d{2}:\d{2}$/).optional(),
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
  fulfillmentDateLocal: dateLocalSchema,
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

function getLocalDateDayOfWeek(dateLocal: string): number {
  return Temporal.PlainDate.from(dateLocal).dayOfWeek;
}

function isBatchDay(dateLocal: string): boolean {
  const dayOfWeek = getLocalDateDayOfWeek(dateLocal);
  return dayOfWeek === 6 || dayOfWeek === 7;
}

function formatDateReadable(dateLocal: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${dateLocal}T12:00:00`));
}

function getDaysUntilFulfillment(
  fulfillmentDateLocal: string,
  timezone: string,
): number {
  const today = Temporal.Now.zonedDateTimeISO(timezone).toPlainDate();
  const fulfillmentDate = Temporal.PlainDate.from(fulfillmentDateLocal);
  return today.until(fulfillmentDate, { largestUnit: "days" }).days;
}

function getPickupLocationLabel(location: PickupLocation): string {
  switch (location) {
    case "long_van_temple":
      return "Long Van Temple";
    case "phap_vu_temple":
      return "Phap Vu Temple";
    case "fancy_fruit":
      return "Fancy Fruit in Longwood";
  }
}

function getPickupTimeLabel(location: PickupLocation, timeLocal?: string): string {
  if (location === "fancy_fruit") {
    return "time to be agreed";
  }

  return timeLocal ?? "time not selected";
}

function getFulfillmentStartTime(input: {
  fulfillmentType: "delivery" | "pickup";
  pickupLocation?: PickupLocation;
  pickupTimeLocal?: string;
}): string {
  if (input.fulfillmentType === "delivery") {
    return "12:00";
  }

  if (input.pickupLocation === "fancy_fruit") {
    return "12:00";
  }

  return input.pickupTimeLocal ?? "12:00";
}

function buildFulfillmentDescription(input: {
  fulfillmentType: "delivery" | "pickup";
  fulfillmentDateLocal: string;
  pickupLocation?: PickupLocation;
  pickupTimeLocal?: string;
}): string {
  if (input.fulfillmentType === "delivery") {
    return `${input.fulfillmentDateLocal} delivery`;
  }

  const location = input.pickupLocation ?? "fancy_fruit";
  return `${input.fulfillmentDateLocal} pickup at ${getPickupLocationLabel(location)} (${getPickupTimeLabel(location, input.pickupTimeLocal)})`;
}

function validateFulfillmentDetails(input: {
  fulfillmentType: "delivery" | "pickup";
  fulfillmentDateLocal?: string;
  nonBatchDayRequested?: boolean;
  pickupLocation?: PickupLocation;
  pickupTimeLocal?: string;
  subtotalCents: number;
  blackoutDates?: Set<string>;
}): void {
  if (!input.fulfillmentDateLocal) {
    return;
  }

  if (input.blackoutDates?.has(input.fulfillmentDateLocal)) {
    throw new Error("That date is blocked out and cannot accept pickup or delivery orders.");
  }

  const batchDay = isBatchDay(input.fulfillmentDateLocal);
  if (!batchDay && !input.nonBatchDayRequested) {
    throw new Error("Monday-Friday pickup or delivery needs the weekday request checkbox.");
  }

  if (!batchDay && input.subtotalCents <= ADVANCE_PAYMENT_THRESHOLD_CENTS) {
    throw new Error("Monday-Friday pickup or delivery is only available for orders above $50.");
  }

  if (input.fulfillmentType !== "pickup") {
    return;
  }

  if (!input.pickupLocation) {
    throw new Error("Please choose a pickup location.");
  }

  const dayOfWeek = getLocalDateDayOfWeek(input.fulfillmentDateLocal);
  if (input.pickupLocation === "long_van_temple" && dayOfWeek !== 6) {
    throw new Error("Long Van Temple pickup is available on Saturday.");
  }

  if (input.pickupLocation === "phap_vu_temple") {
    if (dayOfWeek !== 7) {
      throw new Error("Phap Vu Temple pickup is available on Sunday.");
    }

    if (!input.pickupTimeLocal) {
      throw new Error("Please choose a Phap Vu Temple pickup time.");
    }

    const hour = Number(input.pickupTimeLocal.slice(0, 2));
    if (!Number.isFinite(hour) || hour < 9 || hour > 13) {
      throw new Error("Phap Vu Temple pickup must be between 9:00 AM and 1:00 PM.");
    }
  }

  if (input.pickupLocation === "long_van_temple" && !input.pickupTimeLocal) {
    throw new Error("Please choose a Long Van Temple pickup time.");
  }
}

async function ensureCheckoutTimeslot(input: {
  fulfillmentType: "delivery" | "pickup";
  fulfillmentDateLocal: string;
  pickupLocation?: PickupLocation;
  pickupTimeLocal?: string;
  timezone: string;
}): Promise<Timeslot> {
  const db = requireDb();
  const startTimeLocal = getFulfillmentStartTime(input);
  const start = Temporal.PlainDateTime.from(
    `${input.fulfillmentDateLocal}T${startTimeLocal}:00`,
  ).toZonedDateTime(input.timezone);
  const end = start.add({ hours: 1 });
  const endTimeLocal = `${end.hour.toString().padStart(2, "0")}:${end.minute
    .toString()
    .padStart(2, "0")}`;
  const locationKey = input.pickupLocation ?? "delivery";
  const slotId = `checkout_${input.fulfillmentType}_${input.fulfillmentDateLocal}_${locationKey}_${startTimeLocal.replace(":", "")}`;

  await db
    .prepare(
      `INSERT OR IGNORE INTO fulfillment_timeslots (
        id,
        date_local,
        start_time_local,
        end_time_local,
        start_time_utc,
        end_time_utc,
        slot_type,
        capacity_limit,
        reserved_count,
        is_open,
        timezone,
        cutoff_time_local,
        minimum_lead_time_days,
        created_at_utc
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 999, 0, 1, ?, '00:00', 1, CURRENT_TIMESTAMP)`,
    )
    .bind(
      slotId,
      input.fulfillmentDateLocal,
      startTimeLocal,
      endTimeLocal,
      start.toInstant().toString(),
      end.toInstant().toString(),
      input.fulfillmentType,
      input.timezone,
    )
    .run();

  const rows = await dbAll<{
    id: string;
    date_local: string;
    start_time_local: string;
    end_time_local: string;
    start_time_utc: string;
    end_time_utc: string;
    slot_type: "delivery" | "pickup";
    capacity_limit: number;
    reserved_count: number;
    is_open: number;
    timezone: string;
    minimum_lead_time_days: number;
  }>(
    `SELECT
      id,
      date_local,
      start_time_local,
      end_time_local,
      start_time_utc,
      end_time_utc,
      slot_type,
      capacity_limit,
      reserved_count,
      is_open,
      timezone,
      minimum_lead_time_days
    FROM fulfillment_timeslots
    WHERE id = ?
    LIMIT 1`,
    [slotId],
  );

  const row = rows[0];
  if (!row) {
    throw new Error("Could not create fulfillment slot.");
  }

  return {
    id: row.id,
    dateLocal: row.date_local,
    startTimeLocal: row.start_time_local,
    endTimeLocal: row.end_time_local,
    startTimeUtc: row.start_time_utc,
    endTimeUtc: row.end_time_utc,
    slotType: row.slot_type,
    capacityLimit: row.capacity_limit,
    reservedCount: row.reserved_count,
    isOpen: row.is_open === 1,
    timezone: row.timezone,
    minimumLeadTimeDays: row.minimum_lead_time_days,
  };
}

function buildOrderNotes(
  notes: string | undefined,
  fulfillmentNote: string,
  advancePaymentRequired: boolean,
): string | null {
  const lines = [
    fulfillmentNote,
    advancePaymentRequired
      ? "Advance payment required: customer must include order number in Zelle or Venmo memo."
      : "",
    notes?.trim() || "",
  ].filter((line) => line.length > 0);

  if (lines.length === 0) {
    return null;
  }

  return lines.join("\n");
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

function validateDishLeadTimes(input: {
  fulfillmentDateLocal?: string;
  timezone: string;
  items: Array<{ dishName: string; requiredLeadTimeDays: number }>;
}): void {
  if (!input.fulfillmentDateLocal) {
    return;
  }

  const daysUntilFulfillment = getDaysUntilFulfillment(
    input.fulfillmentDateLocal,
    input.timezone,
  );
  const violation = input.items.find(
    (item) =>
      item.requiredLeadTimeDays > 0 &&
      daysUntilFulfillment < item.requiredLeadTimeDays,
  );

  if (!violation) {
    return;
  }

  const earliestDate = Temporal.Now.zonedDateTimeISO(input.timezone)
    .toPlainDate()
    .add({ days: violation.requiredLeadTimeDays })
    .toString();
  throw new Error(
    `${violation.dishName} needs ${violation.requiredLeadTimeDays} day${
      violation.requiredLeadTimeDays === 1 ? "" : "s"
    } lead time. Earliest available date is ${formatDateReadable(earliestDate)}.`,
  );
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
  let maxDishLeadTimeDays = 0;
  const leadTimeItems: Array<{
    dishName: string;
    requiredLeadTimeDays: number;
  }> = [];

  for (const item of parsed.items) {
    const dish = dishMap.get(item.dishId);
    if (!dish || dish.status !== "live") {
      throw new Error("Some dishes are not currently live.");
    }

    const lineSubtotalCents = dish.priceCents * item.quantity;

    subtotalCents += lineSubtotalCents;
    totalItemQuantity += item.quantity;
    const requiredLeadTimeDays = getDishRequiredLeadTimeDays(dish.slug);
    maxDishLeadTimeDays = Math.max(maxDishLeadTimeDays, requiredLeadTimeDays);
    leadTimeItems.push({
      dishName: dish.name,
      requiredLeadTimeDays,
    });
  }

  const operational = await getOperationalSettings();
  const blackoutDates = await getBlackoutDateSet();
  validateFulfillmentDetails({
    fulfillmentType: parsed.fulfillmentType,
    fulfillmentDateLocal: parsed.fulfillmentDateLocal,
    nonBatchDayRequested: parsed.nonBatchDayRequested,
    pickupLocation: parsed.pickupLocation,
    pickupTimeLocal: parsed.pickupTimeLocal,
    subtotalCents,
    blackoutDates,
  });

  validateDishLeadTimes({
    fulfillmentDateLocal: parsed.fulfillmentDateLocal,
    timezone: operational.timezone,
    items: leadTimeItems,
  });

  const leadTimeDays = maxDishLeadTimeDays;
  const bulkDiscountCents = 0;
  const earlyOrderDiscountCents = 0;
  const earlyOrderDiscountPercent = 0;
  const subtotalAfterDiscountCents = subtotalCents;

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
  const advancePaymentRequired = totalCents > ADVANCE_PAYMENT_THRESHOLD_CENTS;

  const notes = [
    parsed.fulfillmentDateLocal
      ? `Fulfillment date: ${parsed.fulfillmentDateLocal}.`
      : "Choose a fulfillment date before submitting.",
    maxDishLeadTimeDays > 0
      ? `Longest item lead time in this cart: ${maxDishLeadTimeDays} day${
          maxDishLeadTimeDays === 1 ? "" : "s"
        }.`
      : "",
    advancePaymentRequired
      ? "Advance payment required for orders above $50."
      : "Payment can be settled at pickup or delivery.",
  ].filter((note) => note.length > 0);

  return {
    currency: "USD",
    totalItemQuantity,
    subtotalCents,
    bulkDiscountCents,
    earlyOrderDiscountCents,
    earlyOrderDiscountPercent,
    subtotalAfterDiscountCents,
    deliveryFeeCents,
    taxRateBps,
    taxAmountCents,
    totalCents,
    advancePaymentRequired,
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
    earlyOrderDiscountCents: estimate.earlyOrderDiscountCents,
    earlyOrderDiscountPercent: estimate.earlyOrderDiscountPercent,
    subtotalAfterDiscountCents: estimate.subtotalAfterDiscountCents,
    deliveryFeeCents: estimate.deliveryFeeCents,
    taxRateBps: estimate.taxRateBps,
    taxAmountCents: estimate.taxAmountCents,
    totalCents: estimate.totalCents,
    advancePaymentRequired: estimate.advancePaymentRequired,
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
  void fulfillmentType;
  void items;
  void daysAhead;
  return [];
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
    estimate.totalCents > ADVANCE_PAYMENT_THRESHOLD_CENTS
  ) {
    throw new Error("Orders above $50 require advance payment with Zelle or Venmo.");
  }

  const db = requireDb();
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

  const operational = await getOperationalSettings();
  const timeslot = await ensureCheckoutTimeslot({
    fulfillmentType: parsed.fulfillmentType,
    fulfillmentDateLocal: parsed.fulfillmentDateLocal,
    pickupLocation: parsed.pickupLocation,
    pickupTimeLocal: parsed.pickupTimeLocal,
    timezone: operational.timezone,
  });

  const reserved = await reserveTimeslotCapacity(timeslot.id);
  if (!reserved) {
    throw new Error("That fulfillment date is full. Please choose another date.");
  }

  const now = Temporal.Now.instant();
  const slotStart = Temporal.Instant.from(timeslot.startTimeUtc);
  const confirmationDeadline = slotStart.subtract({
    hours: operational.manualPaymentBufferHours,
  });

  const orderId = `order_${nanoid(16)}`;
  let orderNumber = "";
  const fulfillmentDescription = buildFulfillmentDescription({
    fulfillmentType: parsed.fulfillmentType,
    fulfillmentDateLocal: parsed.fulfillmentDateLocal,
    pickupLocation: parsed.pickupLocation,
    pickupTimeLocal: parsed.pickupTimeLocal,
  });
  const orderNotes = buildOrderNotes(
    parsed.notes,
    fulfillmentDescription,
    estimate.advancePaymentRequired,
  );

  try {
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
            fulfillmentDescription,
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
            orderNotes,
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
      fulfillmentTimeLocal: fulfillmentDescription,
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
    await releaseTimeslotCapacity(timeslot.id);
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
  fulfillment_time_utc: string;
  created_at_utc: string;
  customer_name: string;
  email: string;
  phone: string;
  payment_method_selected: "cash" | "zelle" | "venmo";
  payment_status: "unpaid" | "paid" | "refunded_partial" | "refunded_full";
  kitchen_group: "cook_now" | "ready_from_prep" | "later";
  notes: string | null;
  delivery_address_line1: string | null;
  delivery_address_line2: string | null;
  delivery_city: string | null;
  delivery_state: string | null;
  delivery_zip: string | null;
  delivery_distance_mi: number | null;
  delivery_fee_cents: number;
  tax_amount_cents: number;
}

interface AdminOrderItemRow {
  id: string;
  order_id: string;
  dish_id: string;
  dish_name_snapshot: string;
  unit_price_snapshot_cents: number;
  quantity: number;
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
      fulfillment_time_utc,
      created_at_utc,
      customer_name,
      email,
      phone,
      payment_method_selected,
      payment_status,
      kitchen_group,
      notes,
      delivery_address_line1,
      delivery_address_line2,
      delivery_city,
      delivery_state,
      delivery_zip,
      delivery_distance_mi,
      delivery_fee_cents,
      tax_amount_cents
    FROM orders
    ORDER BY fulfillment_time_utc ASC, total_after_tax_cents DESC, status ASC
    LIMIT ?`,
    [limit],
  );

  const itemRows =
    rows.length > 0
      ? await dbAll<AdminOrderItemRow>(
          `SELECT
            id,
            order_id,
            dish_id,
            dish_name_snapshot,
            unit_price_snapshot_cents,
            quantity
          FROM order_items
          WHERE order_id IN (${rows.map(() => "?").join(", ")})
          ORDER BY dish_name_snapshot ASC`,
          rows.map((row) => row.id),
        )
      : [];

  const itemsByOrderId = new Map<string, AdminOrderSummary["items"]>();
  for (const item of itemRows) {
    const bucket = itemsByOrderId.get(item.order_id) ?? [];
    bucket.push({
      id: item.id,
      dishId: item.dish_id,
      dishName: item.dish_name_snapshot,
      unitPriceCents: item.unit_price_snapshot_cents,
      quantity: item.quantity,
    });
    itemsByOrderId.set(item.order_id, bucket);
  }

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
    notes: row.notes,
    deliveryAddress:
      row.delivery_address_line1 && row.delivery_city && row.delivery_state && row.delivery_zip
        ? {
            line1: row.delivery_address_line1,
            line2: row.delivery_address_line2 ?? undefined,
            city: row.delivery_city,
            state: row.delivery_state,
            zip: row.delivery_zip,
          }
        : null,
    deliveryDistanceMiles: row.delivery_distance_mi,
    deliveryFeeCents: row.delivery_fee_cents,
    taxAmountCents: row.tax_amount_cents,
    items: itemsByOrderId.get(row.id) ?? [],
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
