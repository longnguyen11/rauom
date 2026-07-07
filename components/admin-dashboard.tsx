"use client";

import { useMemo, useState } from "react";

import { formatCurrency } from "@/lib/format";
import type { AdminOrderSummary, BlackoutDate, OrderStatus } from "@/lib/types";

interface AdminDashboardProps {
  initialOrders: AdminOrderSummary[];
  initialBlackoutDates: BlackoutDate[];
}

const ORDER_STATUS_OPTIONS = [
  "new",
  "pending_confirmation",
  "confirmed",
  "preparing",
  "completed",
  "cancelled",
] as const satisfies readonly OrderStatus[];

function getDateKey(order: AdminOrderSummary): string {
  const match = order.fulfillmentTimeLocal.match(/\d{4}-\d{2}-\d{2}/);
  if (match) {
    return match[0];
  }

  return order.createdAtUtc.slice(0, 10);
}

function formatStatus(value: string): string {
  return value.replaceAll("_", " ");
}

function formatDateKey(dateKey: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${dateKey}T12:00:00`));
}

function formatMonthKey(monthKey: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${monthKey}-01T12:00:00`));
}

function toMonthKey(dateKey: string): string {
  return dateKey.slice(0, 7);
}

function todayDateKey(): string {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function shiftMonth(monthKey: string, delta: number): string {
  const date = new Date(`${monthKey}-01T12:00:00`);
  date.setMonth(date.getMonth() + delta);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 7);
}

function getCalendarCells(monthKey: string): Array<string | null> {
  const first = new Date(`${monthKey}-01T12:00:00`);
  const startPadding = first.getDay();
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells: Array<string | null> = Array.from({ length: startPadding }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(`${monthKey}-${day.toString().padStart(2, "0")}`);
  }

  return cells;
}

export function AdminDashboard({
  initialOrders,
  initialBlackoutDates,
}: AdminDashboardProps) {
  const firstDateKey =
    initialOrders[0]?.fulfillmentTimeLocal
      ? getDateKey(initialOrders[0])
      : initialBlackoutDates[0]?.dateLocal ?? todayDateKey();
  const [orders, setOrders] = useState(initialOrders);
  const [blackoutDates, setBlackoutDates] = useState(initialBlackoutDates);
  const [blackoutReason, setBlackoutReason] = useState("");
  const [selectedDateKey, setSelectedDateKey] = useState(firstDateKey);
  const [selectedOrderId, setSelectedOrderId] = useState(initialOrders[0]?.id ?? "");
  const [monthKey, setMonthKey] = useState(toMonthKey(firstDateKey));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const dateCompare = getDateKey(a).localeCompare(getDateKey(b));
      return (
        dateCompare ||
        b.totalCents - a.totalCents ||
        a.status.localeCompare(b.status) ||
        a.orderNumber.localeCompare(b.orderNumber)
      );
    });
  }, [orders]);

  const ordersByDate = useMemo(() => {
    const map = new Map<string, AdminOrderSummary[]>();
    for (const order of sortedOrders) {
      const dateKey = getDateKey(order);
      const bucket = map.get(dateKey) ?? [];
      bucket.push(order);
      map.set(dateKey, bucket);
    }
    return map;
  }, [sortedOrders]);

  const selectedDateOrders = ordersByDate.get(selectedDateKey) ?? [];
  const blackoutByDate = useMemo(() => {
    return new Map(blackoutDates.map((date) => [date.dateLocal, date]));
  }, [blackoutDates]);
  const selectedDateBlackout = blackoutByDate.get(selectedDateKey) ?? null;
  const selectedOrder =
    orders.find((order) => order.id === selectedOrderId) ??
    selectedDateOrders[0] ??
    sortedOrders[0] ??
    null;

  async function refreshOrders() {
    setMessage(null);
    setError(null);

    try {
      const [ordersResponse, blackoutResponse] = await Promise.all([
        fetch("/api/admin/orders"),
        fetch("/api/admin/blackout-dates"),
      ]);
      const ordersData = (await ordersResponse.json()) as {
        orders?: AdminOrderSummary[];
        error?: string;
      };
      const blackoutData = (await blackoutResponse.json()) as {
        blackoutDates?: BlackoutDate[];
        error?: string;
      };

      if (!ordersResponse.ok || !ordersData.orders) {
        setError(ordersData.error ?? "Could not refresh orders.");
        return;
      }

      if (!blackoutResponse.ok || !blackoutData.blackoutDates) {
        setError(blackoutData.error ?? "Could not refresh blocked dates.");
        return;
      }

      setOrders(ordersData.orders);
      setBlackoutDates(blackoutData.blackoutDates);
      setMessage("Orders and blocked dates refreshed.");
    } catch {
      setError("Could not refresh admin data.");
    }
  }

  async function blockSelectedDate() {
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/blackout-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateLocal: selectedDateKey,
          reason: blackoutReason || undefined,
        }),
      });
      const data = (await response.json()) as {
        blackoutDates?: BlackoutDate[];
        error?: string;
      };

      if (!response.ok || !data.blackoutDates) {
        setError(data.error ?? "Could not block date.");
        return;
      }

      setBlackoutDates(data.blackoutDates);
      setBlackoutReason("");
      setMessage(`${formatDateKey(selectedDateKey)} is blocked out.`);
    } catch {
      setError("Could not block date.");
    }
  }

  async function unblockSelectedDate() {
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/blackout-dates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateLocal: selectedDateKey }),
      });
      const data = (await response.json()) as {
        blackoutDates?: BlackoutDate[];
        error?: string;
      };

      if (!response.ok || !data.blackoutDates) {
        setError(data.error ?? "Could not unblock date.");
        return;
      }

      setBlackoutDates(data.blackoutDates);
      setMessage(`${formatDateKey(selectedDateKey)} is open again.`);
    } catch {
      setError("Could not unblock date.");
    }
  }

  async function updateStatus(orderId: string, status: OrderStatus) {
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = (await response.json()) as {
        order?: AdminOrderSummary;
        error?: string;
      };

      if (!response.ok || !data.order) {
        setError(data.error ?? "Could not update order status.");
        return;
      }

      setOrders((current) =>
        current.map((order) => (order.id === data.order?.id ? data.order : order)),
      );
      setMessage(`Order ${data.order.orderNumber} updated.`);
    } catch {
      setError("Could not update order status.");
    }
  }

  return (
    <div className="admin-shell">
      <div className="admin-toolbar">
        <button type="button" className="admin-action-button" onClick={refreshOrders}>
          Refresh orders
        </button>
        {message ? <p className="admin-message">{message}</p> : null}
        {error ? <p className="form-error">{error}</p> : null}
      </div>

      <section className="admin-order-layout">
        <div className="admin-card">
          <div className="admin-calendar-header">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setMonthKey((current) => shiftMonth(current, -1))}
            >
              Previous
            </button>
            <h2>{formatMonthKey(monthKey)}</h2>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setMonthKey((current) => shiftMonth(current, 1))}
            >
              Next
            </button>
          </div>

          <div className="admin-calendar-weekdays" aria-hidden="true">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="admin-calendar-grid">
            {getCalendarCells(monthKey).map((dateKey, index) => {
              if (!dateKey) {
                return <div key={`empty-${index}`} className="admin-calendar-empty" />;
              }

              const dayOrders = ordersByDate.get(dateKey) ?? [];
              const blackout = blackoutByDate.get(dateKey) ?? null;
              const isSelected = dateKey === selectedDateKey;

              return (
                <button
                  key={dateKey}
                  type="button"
                  className={
                    isSelected
                      ? `admin-calendar-day admin-calendar-day-selected${
                          blackout ? " admin-calendar-day-blocked" : ""
                        }`
                      : `admin-calendar-day${blackout ? " admin-calendar-day-blocked" : ""}`
                  }
                  onClick={() => {
                    setSelectedDateKey(dateKey);
                    setSelectedOrderId(dayOrders[0]?.id ?? "");
                  }}
                >
                  <span>{Number(dateKey.slice(-2))}</span>
                  {dayOrders.length > 0 ? (
                    <strong>{dayOrders.length} order{dayOrders.length === 1 ? "" : "s"}</strong>
                  ) : (
                    <small>No orders</small>
                  )}
                  {blackout ? <em>Blocked</em> : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="admin-card">
          <h2>Due on {formatDateKey(selectedDateKey)}</h2>
          <div className="admin-detail-box">
            <strong>
              {selectedDateBlackout ? "This date is blocked out" : "Block this date"}
            </strong>
            {selectedDateBlackout ? (
              <>
                <p>
                  Customers cannot select this date for pickup or delivery.
                  {selectedDateBlackout.reason ? ` Reason: ${selectedDateBlackout.reason}` : ""}
                </p>
                <button
                  type="button"
                  className="admin-action-button"
                  onClick={() => void unblockSelectedDate()}
                >
                  Reopen this date
                </button>
              </>
            ) : (
              <>
                <p>
                  Use this for vacation days or any date when you do not accept pickup
                  or delivery orders.
                </p>
                <label>
                  Reason
                  <input
                    value={blackoutReason}
                    onChange={(event) => setBlackoutReason(event.target.value)}
                    placeholder="Vacation, private event, kitchen closed..."
                  />
                </label>
                <button
                  type="button"
                  className="admin-action-button"
                  onClick={() => void blockSelectedDate()}
                >
                  Block this date
                </button>
              </>
            )}
          </div>

          {selectedDateOrders.length === 0 ? (
            <p>No orders due on this date.</p>
          ) : (
            <ul className="admin-list">
              {selectedDateOrders.map((order) => (
                <li key={order.id}>
                  <button
                    type="button"
                    className="admin-order-button"
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    <span>
                      <strong>{order.orderNumber}</strong> {order.customerName}
                    </span>
                    <span>{formatCurrency(order.totalCents)}</span>
                    <span>{formatStatus(order.status)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="admin-order-layout">
        <div className="admin-card">
          <h2>All Orders</h2>
          <p className="admin-subheading">Sorted by due date, amount, then status.</p>
          <ul className="admin-list">
            {sortedOrders.map((order) => (
              <li key={order.id}>
                <button
                  type="button"
                  className="admin-order-button"
                  onClick={() => {
                    const dateKey = getDateKey(order);
                    setSelectedDateKey(dateKey);
                    setMonthKey(toMonthKey(dateKey));
                    setSelectedOrderId(order.id);
                  }}
                >
                  <span>
                    <strong>{formatDateKey(getDateKey(order))}</strong>
                    <br />
                    {order.orderNumber} - {order.customerName}
                  </span>
                  <span>{formatCurrency(order.totalCents)}</span>
                  <span>{formatStatus(order.status)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="admin-card">
          <h2>Order Detail</h2>
          {selectedOrder ? (
            <div className="admin-order-detail">
              <div className="admin-detail-header">
                <div>
                  <p className="admin-detail-kicker">Order {selectedOrder.orderNumber}</p>
                  <h3>{selectedOrder.customerName}</h3>
                </div>
                <strong>{formatCurrency(selectedOrder.totalCents)}</strong>
              </div>

              <label>
                Order status
                <select
                  value={selectedOrder.status}
                  onChange={(event) =>
                    void updateStatus(selectedOrder.id, event.target.value as OrderStatus)
                  }
                >
                  {ORDER_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {formatStatus(status)}
                    </option>
                  ))}
                </select>
              </label>

              <div className="admin-detail-grid">
                <p>
                  <strong>Due</strong>
                  <span>{selectedOrder.fulfillmentTimeLocal}</span>
                </p>
                <p>
                  <strong>Fulfillment</strong>
                  <span>{selectedOrder.fulfillmentType}</span>
                </p>
                <p>
                  <strong>Phone</strong>
                  <span>{selectedOrder.phone}</span>
                </p>
                <p>
                  <strong>Email</strong>
                  <span>{selectedOrder.email || "Not provided"}</span>
                </p>
                <p>
                  <strong>Payment</strong>
                  <span>
                    {selectedOrder.paymentMethodSelected} - {formatStatus(selectedOrder.paymentStatus)}
                  </span>
                </p>
                <p>
                  <strong>Tax / delivery</strong>
                  <span>
                    {formatCurrency(selectedOrder.taxAmountCents)} tax -{" "}
                    {formatCurrency(selectedOrder.deliveryFeeCents)} delivery
                  </span>
                </p>
              </div>

              {selectedOrder.deliveryAddress ? (
                <div className="admin-detail-box">
                  <strong>Delivery address</strong>
                  <p>
                    {selectedOrder.deliveryAddress.line1}
                    {selectedOrder.deliveryAddress.line2
                      ? `, ${selectedOrder.deliveryAddress.line2}`
                      : ""}
                    <br />
                    {selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.state}{" "}
                    {selectedOrder.deliveryAddress.zip}
                  </p>
                  {selectedOrder.deliveryDistanceMiles !== null ? (
                    <p>{selectedOrder.deliveryDistanceMiles.toFixed(1)} miles</p>
                  ) : null}
                </div>
              ) : null}

              <div className="admin-detail-box">
                <strong>Items</strong>
                <ul className="admin-item-lines">
                  {selectedOrder.items.map((item) => (
                    <li key={item.id}>
                      <span>
                        {item.quantity} x {item.dishName}
                      </span>
                      <span>{formatCurrency(item.unitPriceCents * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {selectedOrder.notes ? (
                <div className="admin-detail-box">
                  <strong>Notes</strong>
                  <p>{selectedOrder.notes}</p>
                </div>
              ) : null}
            </div>
          ) : (
            <p>No orders yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
