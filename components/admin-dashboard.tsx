"use client";

import { useEffect, useMemo, useState } from "react";

import { formatCurrency } from "@/lib/format";
import type { AdminOrderSummary, Dish } from "@/lib/types";

interface AdminDashboardProps {
  initialOrders: AdminOrderSummary[];
  initialDishes: Dish[];
}

type AdminTab = "workflow" | "current_dishes" | "dish_editor" | "shopping_list";

type DishStatusFilter = "available" | Dish["status"] | "all";
type ShoppingOrderStatus = "pending_confirmation" | "confirmed" | "preparing";

interface ShoppingSummary {
  statuses: ShoppingOrderStatus[];
  orderCount: number;
  lineItemCount: number;
  dishes: Array<{
    dishId: string;
    dishName: string;
    totalQuantity: number;
  }>;
  ingredients: Array<{
    name: string;
    isAllergen: boolean;
    requiredUnits: number;
    usedByDishes: string[];
  }>;
}

interface DishFormState {
  id?: string;
  slug: string;
  name: string;
  nameVi: string;
  shortDescription: string;
  shortDescriptionVi: string;
  longDescription: string;
  longDescriptionVi: string;
  imageUrl: string;
  imageAltText: string;
  priceCents: number;
  leadTimeDays: 1 | 2 | 3;
  status: Dish["status"];
  bulkDiscountTiersCsv: string;
  ingredientsCsv: string;
  allergensCsv: string;
}

const EMPTY_DISH_FORM: DishFormState = {
  slug: "",
  name: "",
  nameVi: "",
  shortDescription: "",
  shortDescriptionVi: "",
  longDescription: "",
  longDescriptionVi: "",
  imageUrl: "",
  imageAltText: "",
  priceCents: 0,
  leadTimeDays: 1,
  status: "draft",
  bulkDiscountTiersCsv: "",
  ingredientsCsv: "",
  allergensCsv: "",
};

const STATUS_OPTIONS = [
  "draft",
  "scheduled",
  "live",
  "archived",
  "sold_out",
] as const satisfies readonly Dish["status"][];

const ORDER_STATUS_OPTIONS = [
  "pending_confirmation",
  "confirmed",
  "preparing",
  "completed",
  "cancelled",
] as const;

const SHOPPING_ORDER_STATUS_OPTIONS: ShoppingOrderStatus[] = [
  "pending_confirmation",
  "confirmed",
  "preparing",
];

function parseCsvList(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseBulkDiscountTiersInput(
  value: string,
): Array<{ minQuantity: number; discountPercent: number }> {
  const rows = value
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);

  const parsed: Array<{ minQuantity: number; discountPercent: number }> = [];
  for (const row of rows) {
    const [quantityPart, percentPart] = row.split(":").map((part) => part?.trim());
    const minQuantity = Number(quantityPart);
    const discountPercent = Number(percentPart);

    if (!Number.isFinite(minQuantity) || !Number.isFinite(discountPercent)) {
      continue;
    }

    parsed.push({
      minQuantity: Math.max(2, Math.floor(minQuantity)),
      discountPercent: Math.max(1, Math.min(90, Math.floor(discountPercent))),
    });
  }

  return parsed.sort((a, b) => a.minQuantity - b.minQuantity);
}

function formatBulkDiscountTiersInput(
  tiers: Array<{ minQuantity: number; discountPercent: number }>,
): string {
  if (tiers.length === 0) {
    return "";
  }

  return tiers
    .slice()
    .sort((a, b) => a.minQuantity - b.minQuantity)
    .map((tier) => `${tier.minQuantity}:${tier.discountPercent}`)
    .join("\n");
}

function buildIngredients(
  ingredientsCsv: string,
  allergensCsv: string,
): Array<{ name: string; isAllergen: boolean }> {
  const ingredientNames = parseCsvList(ingredientsCsv);
  const allergenNames = parseCsvList(allergensCsv);
  const allergenSet = new Set(allergenNames.map((name) => name.toLowerCase()));
  const merged = new Map<string, string>();

  for (const name of ingredientNames) {
    merged.set(name.toLowerCase(), name);
  }

  for (const name of allergenNames) {
    if (!merged.has(name.toLowerCase())) {
      merged.set(name.toLowerCase(), name);
    }
  }

  return [...merged.entries()].map(([lowerName, name]) => ({
    name,
    isAllergen: allergenSet.has(lowerName),
  }));
}

function toDishFormState(dish: Dish): DishFormState {
  const ingredients = dish.ingredients.map((ingredient) => ingredient.name).join(", ");
  const allergens = dish.ingredients
    .filter((ingredient) => ingredient.isAllergen)
    .map((ingredient) => ingredient.name)
    .join(", ");

  return {
    id: dish.id,
    slug: dish.slug,
    name: dish.name,
    nameVi: dish.nameVi ?? "",
    shortDescription: dish.shortDescription,
    shortDescriptionVi: dish.shortDescriptionVi ?? "",
    longDescription: dish.longDescription,
    longDescriptionVi: dish.longDescriptionVi ?? "",
    imageUrl: dish.images[0]?.url ?? "",
    imageAltText: dish.images[0]?.altText ?? dish.name,
    priceCents: dish.priceCents,
    leadTimeDays: dish.leadTimeDays as 1 | 2 | 3,
    status: dish.status,
    bulkDiscountTiersCsv: formatBulkDiscountTiersInput(dish.bulkDiscountTiers),
    ingredientsCsv: ingredients,
    allergensCsv: allergens,
  };
}

export function AdminDashboard({
  initialOrders,
  initialDishes,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("workflow");
  const [orders, setOrders] = useState(initialOrders);
  const [dishes, setDishes] = useState(initialDishes);
  const [dishStatusFilter, setDishStatusFilter] = useState<DishStatusFilter>("available");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dishForm, setDishForm] = useState<DishFormState>(EMPTY_DISH_FORM);
  const [priceDrafts, setPriceDrafts] = useState<Record<string, number>>(
    Object.fromEntries(initialDishes.map((dish) => [dish.id, dish.priceCents])),
  );
  const [shoppingOrderStatuses, setShoppingOrderStatuses] = useState<
    Record<ShoppingOrderStatus, boolean>
  >({
    pending_confirmation: true,
    confirmed: true,
    preparing: false,
  });
  const [shoppingSummary, setShoppingSummary] = useState<ShoppingSummary | null>(null);
  const [isShoppingLoading, setIsShoppingLoading] = useState(false);

  async function saveDish(payload: {
    id?: string;
    slug: string;
    name: string;
    nameVi?: string;
    shortDescription: string;
    shortDescriptionVi?: string;
    longDescription: string;
    longDescriptionVi?: string;
    imageUrl?: string;
    imageAltText?: string;
    bulkDiscountTiers: Array<{ minQuantity: number; discountPercent: number }>;
    priceCents: number;
    leadTimeDays: 1 | 2 | 3;
    status: Dish["status"];
    ingredients: Array<{ name: string; isAllergen: boolean }>;
  }) {
    setError(null);
    setMessage(null);

    const response = await fetch("/api/admin/dishes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as { error?: string; ok?: boolean; dishes?: Dish[] };
    if (!response.ok || !data.ok || !data.dishes) {
      setError(data.error ?? "Could not save dish.");
      return false;
    }

    setDishes(data.dishes);
    setPriceDrafts(Object.fromEntries(data.dishes.map((dish) => [dish.id, dish.priceCents])));
    return true;
  }

  async function updateOrderStatus(orderId: string, status: string) {
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    const data = (await response.json()) as {
      error?: string;
      ok?: boolean;
      order?: AdminOrderSummary;
    };

    if (!response.ok || !data.ok) {
      setError(data.error ?? "Could not update order.");
      return;
    }

    setOrders((current) =>
      current.map((order) => (order.id === orderId && data.order ? data.order : order)),
    );
    setMessage("Order status updated.");
  }

  async function updateDishStatus(dishId: string, status: Dish["status"]) {
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/admin/dishes/${dishId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    const data = (await response.json()) as { error?: string; ok?: boolean };
    if (!response.ok || !data.ok) {
      setError(data.error ?? "Could not update dish.");
      return;
    }

    setDishes((current) =>
      current.map((dish) => (dish.id === dishId ? { ...dish, status } : dish)),
    );
    setMessage("Dish status updated.");
  }

  async function saveDishPrice(dish: Dish) {
    const draftValue = Number(priceDrafts[dish.id] ?? dish.priceCents);
    if (!Number.isFinite(draftValue) || draftValue < 100) {
      setError("Price must be at least 100 cents.");
      return;
    }

    const updated = await saveDish({
      id: dish.id,
      slug: dish.slug,
      name: dish.name,
      nameVi: dish.nameVi ?? undefined,
      shortDescription: dish.shortDescription,
      shortDescriptionVi: dish.shortDescriptionVi ?? undefined,
      longDescription: dish.longDescription,
      longDescriptionVi: dish.longDescriptionVi ?? undefined,
      imageUrl: dish.images[0]?.url,
      imageAltText: dish.images[0]?.altText ?? dish.name,
      bulkDiscountTiers: dish.bulkDiscountTiers,
      priceCents: Math.round(draftValue),
      leadTimeDays: dish.leadTimeDays as 1 | 2 | 3,
      status: dish.status,
      ingredients: dish.ingredients.map((ingredient) => ({
        name: ingredient.name,
        isAllergen: ingredient.isAllergen,
      })),
    });

    if (updated) {
      setMessage(`Price updated for ${dish.name}.`);
    }
  }

  async function submitDishForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const updated = await saveDish({
      id: dishForm.id,
      slug: dishForm.slug.trim(),
      name: dishForm.name.trim(),
      nameVi: dishForm.nameVi.trim() || undefined,
      shortDescription: dishForm.shortDescription.trim(),
      shortDescriptionVi: dishForm.shortDescriptionVi.trim() || undefined,
      longDescription: dishForm.longDescription.trim(),
      longDescriptionVi: dishForm.longDescriptionVi.trim() || undefined,
      imageUrl: dishForm.imageUrl.trim() || undefined,
      imageAltText: dishForm.imageAltText.trim() || undefined,
      bulkDiscountTiers: parseBulkDiscountTiersInput(dishForm.bulkDiscountTiersCsv),
      priceCents: Math.round(Number(dishForm.priceCents)),
      leadTimeDays: dishForm.leadTimeDays,
      status: dishForm.status,
      ingredients: buildIngredients(dishForm.ingredientsCsv, dishForm.allergensCsv),
    });

    if (!updated) {
      return;
    }

    setMessage(dishForm.id ? "Dish updated." : "Dish created.");
    setDishForm(EMPTY_DISH_FORM);
  }

  const groupedOrders = useMemo(() => {
    return {
      cook_now: orders.filter((order) => order.kitchenGroup === "cook_now"),
      ready_from_prep: orders.filter((order) => order.kitchenGroup === "ready_from_prep"),
      later: orders.filter((order) => order.kitchenGroup === "later"),
    };
  }, [orders]);

  const filteredDishes = useMemo(() => {
    if (dishStatusFilter === "all") {
      return dishes;
    }

    if (dishStatusFilter === "available") {
      return dishes.filter((dish) => dish.status === "live" || dish.status === "scheduled");
    }

    return dishes.filter((dish) => dish.status === dishStatusFilter);
  }, [dishStatusFilter, dishes]);

  const selectedShoppingStatuses = useMemo(
    () =>
      SHOPPING_ORDER_STATUS_OPTIONS.filter(
        (status) => shoppingOrderStatuses[status],
      ),
    [shoppingOrderStatuses],
  );

  const shoppingListText = useMemo(() => {
    if (!shoppingSummary) {
      return "";
    }

    return shoppingSummary.ingredients
      .map(
        (item) =>
          `- ${item.name}${item.isAllergen ? " (allergen)" : ""} | qty units: ${item.requiredUnits} | dishes: ${item.usedByDishes.join(", ")}`,
      )
      .join("\n");
  }, [shoppingSummary]);

  useEffect(() => {
    async function loadShoppingSummary() {
      if (activeTab !== "shopping_list") {
        return;
      }

      setIsShoppingLoading(true);
      setError(null);

      try {
        const query = new URLSearchParams();
        for (const status of selectedShoppingStatuses) {
          query.append("status", status);
        }

        const response = await fetch(`/api/admin/shopping-list?${query.toString()}`);
        const data = (await response.json()) as {
          error?: string;
          summary?: ShoppingSummary;
        };

        if (!response.ok || !data.summary) {
          setError(data.error ?? "Could not load shopping list.");
          setShoppingSummary(null);
          return;
        }

        setShoppingSummary(data.summary);
      } catch {
        setError("Could not load shopping list.");
        setShoppingSummary(null);
      } finally {
        setIsShoppingLoading(false);
      }
    }

    void loadShoppingSummary();
  }, [activeTab, selectedShoppingStatuses, orders]);

  return (
    <section className="admin-shell">
      <div className="admin-tabs" role="tablist" aria-label="Admin sections">
        <button
          type="button"
          role="tab"
          className={activeTab === "workflow" ? "admin-tab active" : "admin-tab"}
          onClick={() => setActiveTab("workflow")}
        >
          Workflow
        </button>
        <button
          type="button"
          role="tab"
          className={activeTab === "current_dishes" ? "admin-tab active" : "admin-tab"}
          onClick={() => setActiveTab("current_dishes")}
        >
          Current Dishes
        </button>
        <button
          type="button"
          role="tab"
          className={activeTab === "dish_editor" ? "admin-tab active" : "admin-tab"}
          onClick={() => setActiveTab("dish_editor")}
        >
          Add / Edit Dish
        </button>
        <button
          type="button"
          role="tab"
          className={activeTab === "shopping_list" ? "admin-tab active" : "admin-tab"}
          onClick={() => setActiveTab("shopping_list")}
        >
          Shopping List
        </button>
      </div>

      {message && <p className="admin-message">{message}</p>}
      {error && <p className="form-error">{error}</p>}

      {activeTab === "workflow" && (
        <div className="admin-card">
          <h2>Orders Inbox + Kitchen Board</h2>
          <p>Grouped by kitchen priority: cook now, ready from prep, and later.</p>

          {(["cook_now", "ready_from_prep", "later"] as const).map((group) => (
            <section key={group}>
              <h3 className="admin-subheading">{group.replaceAll("_", " ")}</h3>
              <ul className="admin-list">
                {groupedOrders[group].map((order) => (
                  <li key={order.id}>
                    <div>
                      <strong>{order.orderNumber}</strong> | {order.customerName}
                    </div>
                    <div>
                      {order.fulfillmentType} at {order.fulfillmentTimeLocal}
                    </div>
                    <div>
                      Total {formatCurrency(order.totalCents)} | Payment {order.paymentMethodSelected}
                    </div>
                    <div>
                      Status: <strong>{order.status}</strong>
                    </div>
                    <form
                      className="inline-form"
                      onSubmit={(event) => {
                        event.preventDefault();
                        const formData = new FormData(event.currentTarget);
                        const status = String(formData.get("status") ?? "");
                        void updateOrderStatus(order.id, status);
                      }}
                    >
                      <select name="status" defaultValue={order.status}>
                        {ORDER_STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <button className="admin-action-button" type="submit">
                        Update
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {activeTab === "current_dishes" && (
        <div className="admin-card">
          <h2>Current Available Dishes</h2>
          <div className="admin-toolbar">
            <label>
              Filter
              <select
                value={dishStatusFilter}
                onChange={(event) => setDishStatusFilter(event.target.value as DishStatusFilter)}
              >
                <option value="available">available (live + scheduled)</option>
                <option value="live">live</option>
                <option value="scheduled">scheduled</option>
                <option value="sold_out">sold_out</option>
                <option value="draft">draft</option>
                <option value="archived">archived</option>
                <option value="all">all</option>
              </select>
            </label>
          </div>

          <ul className="admin-list">
            {filteredDishes.map((dish) => (
              <li key={dish.id}>
                <div>
                  <strong>{dish.name}</strong> ({dish.status})
                </div>
                <div>{dish.slug}</div>
                <div>Lead time: {dish.leadTimeDays} day(s)</div>
                <div>Current price: {formatCurrency(dish.priceCents)}</div>
                <div>
                  Bulk discount:{" "}
                  {dish.bulkDiscountTiers.length > 0
                    ? dish.bulkDiscountTiers
                        .map((tier) => `${tier.minQuantity}+ => ${tier.discountPercent}%`)
                        .join(", ")
                    : "none"}
                </div>

                <form
                  className="inline-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void saveDishPrice(dish);
                  }}
                >
                  <input
                    type="number"
                    min={100}
                    step={50}
                    value={priceDrafts[dish.id] ?? dish.priceCents}
                    onChange={(event) =>
                      setPriceDrafts((current) => ({
                        ...current,
                        [dish.id]: Number(event.target.value),
                      }))
                    }
                  />
                  <button className="admin-action-button" type="submit">
                    Save price
                  </button>
                </form>

                <form
                  className="inline-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    const status = String(formData.get("status") ?? "") as Dish["status"];
                    void updateDishStatus(dish.id, status);
                  }}
                >
                  <select name="status" defaultValue={dish.status}>
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <button className="admin-action-button" type="submit">
                    Update status
                  </button>
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={() => {
                      setDishForm(toDishFormState(dish));
                      setActiveTab("dish_editor");
                    }}
                  >
                    Edit dish
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === "dish_editor" && (
        <div className="admin-card">
          <h2>{dishForm.id ? "Edit Dish" : "Add Dish"}</h2>
          <form className="checkout-form" onSubmit={submitDishForm}>
            <label>
              Slug
              <input
                required
                value={dishForm.slug}
                onChange={(event) =>
                  setDishForm((current) => ({ ...current, slug: event.target.value }))
                }
              />
            </label>

            <label>
              Name
              <input
                required
                value={dishForm.name}
                onChange={(event) =>
                  setDishForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </label>

            <label>
              Name (Vietnamese)
              <input
                value={dishForm.nameVi}
                onChange={(event) =>
                  setDishForm((current) => ({ ...current, nameVi: event.target.value }))
                }
              />
            </label>

            <label>
              Short description
              <input
                required
                value={dishForm.shortDescription}
                onChange={(event) =>
                  setDishForm((current) => ({
                    ...current,
                    shortDescription: event.target.value,
                  }))
                }
              />
            </label>

            <label>
              Short description (Vietnamese)
              <input
                value={dishForm.shortDescriptionVi}
                onChange={(event) =>
                  setDishForm((current) => ({
                    ...current,
                    shortDescriptionVi: event.target.value,
                  }))
                }
              />
            </label>

            <label>
              Long description
              <textarea
                rows={3}
                required
                value={dishForm.longDescription}
                onChange={(event) =>
                  setDishForm((current) => ({
                    ...current,
                    longDescription: event.target.value,
                  }))
                }
              />
            </label>

            <label>
              Long description (Vietnamese)
              <textarea
                rows={3}
                value={dishForm.longDescriptionVi}
                onChange={(event) =>
                  setDishForm((current) => ({
                    ...current,
                    longDescriptionVi: event.target.value,
                  }))
                }
              />
            </label>

            <label>
              Primary image URL
              <input
                type="url"
                placeholder="https://..."
                value={dishForm.imageUrl}
                onChange={(event) =>
                  setDishForm((current) => ({
                    ...current,
                    imageUrl: event.target.value,
                  }))
                }
              />
            </label>

            <label>
              Image alt text
              <input
                value={dishForm.imageAltText}
                onChange={(event) =>
                  setDishForm((current) => ({
                    ...current,
                    imageAltText: event.target.value,
                  }))
                }
              />
            </label>

            <label>
              Ingredients (comma or new line separated)
              <textarea
                rows={3}
                value={dishForm.ingredientsCsv}
                onChange={(event) =>
                  setDishForm((current) => ({
                    ...current,
                    ingredientsCsv: event.target.value,
                  }))
                }
              />
            </label>

            <label>
              Allergens (comma or new line separated)
              <input
                value={dishForm.allergensCsv}
                onChange={(event) =>
                  setDishForm((current) => ({
                    ...current,
                    allergensCsv: event.target.value,
                  }))
                }
              />
            </label>

            <label>
              Bulk discount tiers for this dish (one per line as quantity:percent, for example 10:5)
              <textarea
                rows={3}
                placeholder={"10:5\n20:10"}
                value={dishForm.bulkDiscountTiersCsv}
                onChange={(event) =>
                  setDishForm((current) => ({
                    ...current,
                    bulkDiscountTiersCsv: event.target.value,
                  }))
                }
              />
            </label>

            <label>
              Price (cents)
              <input
                required
                type="number"
                min={100}
                value={dishForm.priceCents}
                onChange={(event) =>
                  setDishForm((current) => ({
                    ...current,
                    priceCents: Number(event.target.value),
                  }))
                }
              />
            </label>

            <label>
              Lead time days
              <select
                value={dishForm.leadTimeDays}
                onChange={(event) =>
                  setDishForm((current) => ({
                    ...current,
                    leadTimeDays: Number(event.target.value) as 1 | 2 | 3,
                  }))
                }
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
              </select>
            </label>

            <label>
              Status
              <select
                value={dishForm.status}
                onChange={(event) =>
                  setDishForm((current) => ({
                    ...current,
                    status: event.target.value as Dish["status"],
                  }))
                }
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <div className="admin-toolbar">
              <button className="btn-primary" type="submit">
                {dishForm.id ? "Update dish" : "Create dish"}
              </button>
              <button
                className="btn-secondary"
                type="button"
                onClick={() => setDishForm(EMPTY_DISH_FORM)}
              >
                New dish form
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === "shopping_list" && (
        <div className="admin-card">
          <h2>Shopping List Generator</h2>
          <p>
            Built from open orders. Ingredient quantities scale by ordered dish count
            (for example, 3 Pho orders means Pho ingredients count as 3 units each).
          </p>

          <div className="admin-status-grid">
            {SHOPPING_ORDER_STATUS_OPTIONS.map((status) => (
              <label key={status} className="admin-status-option">
                <input
                  type="checkbox"
                  checked={shoppingOrderStatuses[status]}
                  onChange={(event) =>
                    setShoppingOrderStatuses((current) => ({
                      ...current,
                      [status]: event.target.checked,
                    }))
                  }
                />
                {status}
              </label>
            ))}
          </div>

          {isShoppingLoading ? (
            <p>Loading shopping list...</p>
          ) : shoppingSummary ? (
            <>
              <p>
                Orders included: <strong>{shoppingSummary.orderCount}</strong> | Line items:{" "}
                <strong>{shoppingSummary.lineItemCount}</strong> | Ingredients:{" "}
                <strong>{shoppingSummary.ingredients.length}</strong>
              </p>

              <h3 className="admin-subheading">Dish Totals</h3>
              <ul className="admin-list">
                {shoppingSummary.dishes.map((dish) => (
                  <li key={dish.dishId}>
                    <div>
                      <strong>{dish.dishName}</strong>
                    </div>
                    <div>Total ordered quantity: {dish.totalQuantity}</div>
                  </li>
                ))}
              </ul>

              <h3 className="admin-subheading">Ingredient Totals</h3>
              <ul className="admin-list">
                {shoppingSummary.ingredients.map((item) => (
                  <li key={item.name}>
                    <div>
                      <strong>{item.name}</strong>{" "}
                      {item.isAllergen ? <span>(allergen)</span> : null}
                    </div>
                    <div>Required units: {item.requiredUnits}</div>
                    <div>Used by: {item.usedByDishes.join(", ")}</div>
                  </li>
                ))}
              </ul>

              <div className="admin-toolbar">
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={() => {
                    if (shoppingListText.length === 0 || !navigator.clipboard) {
                      return;
                    }
                    void navigator.clipboard.writeText(shoppingListText);
                    setMessage("Shopping list copied.");
                  }}
                >
                  Copy list
                </button>
              </div>
            </>
          ) : (
            <p>No matching open orders yet for selected statuses.</p>
          )}
        </div>
      )}
    </section>
  );
}
