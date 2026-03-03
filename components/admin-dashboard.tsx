"use client";

import { useMemo, useState } from "react";

import { formatCurrency } from "@/lib/format";
import type { AdminOrderSummary, Dish } from "@/lib/types";

interface AdminDashboardProps {
  initialOrders: AdminOrderSummary[];
  initialDishes: Dish[];
}

type AdminTab = "workflow" | "current_dishes" | "dish_editor" | "shopping_list";

type DishStatusFilter = "available" | Dish["status"] | "all";

interface DishFormState {
  id?: string;
  slug: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  priceCents: number;
  leadTimeDays: 1 | 2 | 3;
  status: Dish["status"];
  ingredientsCsv: string;
  allergensCsv: string;
}

const EMPTY_DISH_FORM: DishFormState = {
  slug: "",
  name: "",
  shortDescription: "",
  longDescription: "",
  priceCents: 0,
  leadTimeDays: 1,
  status: "draft",
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

function parseCsvList(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
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
    shortDescription: dish.shortDescription,
    longDescription: dish.longDescription,
    priceCents: dish.priceCents,
    leadTimeDays: dish.leadTimeDays as 1 | 2 | 3,
    status: dish.status,
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
  const [shoppingStatuses, setShoppingStatuses] = useState<Record<Dish["status"], boolean>>({
    draft: false,
    scheduled: true,
    live: true,
    archived: false,
    sold_out: false,
  });

  async function saveDish(payload: {
    id?: string;
    slug: string;
    name: string;
    shortDescription: string;
    longDescription: string;
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
      shortDescription: dish.shortDescription,
      longDescription: dish.longDescription,
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
      shortDescription: dishForm.shortDescription.trim(),
      longDescription: dishForm.longDescription.trim(),
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

  const shoppingList = useMemo(() => {
    const selectedStatuses = new Set(
      (Object.keys(shoppingStatuses) as Dish["status"][]).filter(
        (status) => shoppingStatuses[status],
      ),
    );

    const selectedDishes = dishes.filter((dish) => selectedStatuses.has(dish.status));
    const ingredientMap = new Map<
      string,
      { name: string; dishCount: number; isAllergen: boolean }
    >();

    for (const dish of selectedDishes) {
      const seenInDish = new Set<string>();
      for (const ingredient of dish.ingredients) {
        const key = ingredient.name.trim().toLowerCase();
        if (!key || seenInDish.has(key)) {
          continue;
        }
        seenInDish.add(key);

        const existing = ingredientMap.get(key);
        if (existing) {
          existing.dishCount += 1;
          existing.isAllergen = existing.isAllergen || ingredient.isAllergen;
        } else {
          ingredientMap.set(key, {
            name: ingredient.name.trim(),
            dishCount: 1,
            isAllergen: ingredient.isAllergen,
          });
        }
      }
    }

    const items = [...ingredientMap.values()].sort((a, b) =>
      a.name.localeCompare(b.name),
    );

    const text = items
      .map(
        (item) =>
          `- ${item.name}${item.isAllergen ? " (allergen)" : ""} | used by ${item.dishCount} dish(es)`,
      )
      .join("\n");

    return {
      selectedDishCount: selectedDishes.length,
      items,
      text,
    };
  }, [dishes, shoppingStatuses]);

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
          <p>Build ingredient list from selected dish statuses.</p>

          <div className="admin-status-grid">
            {STATUS_OPTIONS.map((status) => (
              <label key={status} className="admin-status-option">
                <input
                  type="checkbox"
                  checked={shoppingStatuses[status]}
                  onChange={(event) =>
                    setShoppingStatuses((current) => ({
                      ...current,
                      [status]: event.target.checked,
                    }))
                  }
                />
                {status}
              </label>
            ))}
          </div>

          <p>
            Dishes included: <strong>{shoppingList.selectedDishCount}</strong> | Ingredients:{" "}
            <strong>{shoppingList.items.length}</strong>
          </p>

          <ul className="admin-list">
            {shoppingList.items.map((item) => (
              <li key={item.name}>
                <div>
                  <strong>{item.name}</strong>{" "}
                  {item.isAllergen ? <span>(allergen)</span> : null}
                </div>
                <div>Used by {item.dishCount} dish(es)</div>
              </li>
            ))}
          </ul>

          <div className="admin-toolbar">
            <button
              className="btn-secondary"
              type="button"
              onClick={() => {
                if (shoppingList.text.length === 0 || !navigator.clipboard) {
                  return;
                }
                void navigator.clipboard.writeText(shoppingList.text);
                setMessage("Shopping list copied.");
              }}
            >
              Copy list
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
