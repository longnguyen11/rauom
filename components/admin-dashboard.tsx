"use client";

import { useMemo, useState } from "react";

import { formatCurrency } from "@/lib/format";
import type { AdminOrderSummary, Dish } from "@/lib/types";

interface AdminDashboardProps {
  initialOrders: AdminOrderSummary[];
  initialDishes: Dish[];
}

export function AdminDashboard({
  initialOrders,
  initialDishes,
}: AdminDashboardProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [dishes, setDishes] = useState(initialDishes);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newDish, setNewDish] = useState({
    slug: "",
    name: "",
    shortDescription: "",
    longDescription: "",
    priceCents: 0,
    leadTimeDays: 1,
    status: "draft",
  });

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

  async function updateDishStatus(dishId: string, status: string) {
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
      current.map((dish) => (dish.id === dishId ? { ...dish, status: status as Dish["status"] } : dish)),
    );
    setMessage("Dish status updated.");
  }

  async function createDish(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const response = await fetch("/api/admin/dishes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newDish),
    });

    const data = (await response.json()) as { error?: string; ok?: boolean; dishes?: Dish[] };
    if (!response.ok || !data.ok || !data.dishes) {
      setError(data.error ?? "Could not create dish.");
      return;
    }

    setDishes(data.dishes);
    setNewDish({
      slug: "",
      name: "",
      shortDescription: "",
      longDescription: "",
      priceCents: 0,
      leadTimeDays: 1,
      status: "draft",
    });
    setMessage("Dish saved.");
  }

  const groupedOrders = useMemo(() => {
    return {
      cook_now: orders.filter((order) => order.kitchenGroup === "cook_now"),
      ready_from_prep: orders.filter((order) => order.kitchenGroup === "ready_from_prep"),
      later: orders.filter((order) => order.kitchenGroup === "later"),
    };
  }, [orders]);

  return (
    <section className="admin-grid">
      <div className="admin-card">
        <h2>Orders Inbox + Kitchen Board</h2>
        <p>
          Grouped by kitchen priority: cook now, ready from prep, and later.
        </p>

        {message && <p>{message}</p>}
        {error && <p className="form-error">{error}</p>}

        {(["cook_now", "ready_from_prep", "later"] as const).map((group) => (
          <section key={group}>
            <h3 style={{ textTransform: "capitalize" }}>{group.replaceAll("_", " ")}</h3>
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
                      <option value="pending_confirmation">pending_confirmation</option>
                      <option value="confirmed">confirmed</option>
                      <option value="preparing">preparing</option>
                      <option value="completed">completed</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                    <button type="submit">Update</button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="admin-card">
        <h2>Dish Management</h2>
        <form className="checkout-form" onSubmit={createDish}>
          <label>
            Slug
            <input
              required
              value={newDish.slug}
              onChange={(event) =>
                setNewDish((current) => ({ ...current, slug: event.target.value }))
              }
            />
          </label>

          <label>
            Name
            <input
              required
              value={newDish.name}
              onChange={(event) =>
                setNewDish((current) => ({ ...current, name: event.target.value }))
              }
            />
          </label>

          <label>
            Short description
            <input
              required
              value={newDish.shortDescription}
              onChange={(event) =>
                setNewDish((current) => ({ ...current, shortDescription: event.target.value }))
              }
            />
          </label>

          <label>
            Long description
            <textarea
              rows={3}
              required
              value={newDish.longDescription}
              onChange={(event) =>
                setNewDish((current) => ({ ...current, longDescription: event.target.value }))
              }
            />
          </label>

          <label>
            Price (cents)
            <input
              required
              type="number"
              min={100}
              value={newDish.priceCents}
              onChange={(event) =>
                setNewDish((current) => ({
                  ...current,
                  priceCents: Number(event.target.value),
                }))
              }
            />
          </label>

          <label>
            Lead time days
            <select
              value={newDish.leadTimeDays}
              onChange={(event) =>
                setNewDish((current) => ({
                  ...current,
                  leadTimeDays: Number(event.target.value),
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
              value={newDish.status}
              onChange={(event) =>
                setNewDish((current) => ({ ...current, status: event.target.value }))
              }
            >
              <option value="draft">draft</option>
              <option value="scheduled">scheduled</option>
              <option value="live">live</option>
              <option value="archived">archived</option>
              <option value="sold_out">sold_out</option>
            </select>
          </label>

          <button className="btn-primary" type="submit">
            Save dish
          </button>
        </form>

        <ul className="admin-list">
          {dishes.map((dish) => (
            <li key={dish.id}>
              <div>
                <strong>{dish.name}</strong> ({dish.status})
              </div>
              <div>{formatCurrency(dish.priceCents)}</div>
              <form
                className="inline-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  const formData = new FormData(event.currentTarget);
                  const status = String(formData.get("status") ?? "");
                  void updateDishStatus(dish.id, status);
                }}
              >
                <select name="status" defaultValue={dish.status}>
                  <option value="draft">draft</option>
                  <option value="scheduled">scheduled</option>
                  <option value="live">live</option>
                  <option value="archived">archived</option>
                  <option value="sold_out">sold_out</option>
                </select>
                <button type="submit">Update</button>
              </form>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
