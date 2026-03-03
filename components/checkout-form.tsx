"use client";

import { nanoid } from "nanoid";
import { useEffect, useMemo, useState } from "react";

import { useCart } from "@/components/cart-context";
import { formatCurrency } from "@/lib/format";
import type { FulfillmentType, Timeslot } from "@/lib/types";

interface EstimateResponse {
  subtotalCents: number;
  deliveryFeeCents: number;
  taxAmountCents: number;
  totalCents: number;
  taxRateBps: number;
  leadTimeDays: number;
  notes: string[];
  quote?: {
    distanceMiles: number;
  };
}

export function CheckoutForm() {
  const { items, subtotalCents, clearCart } = useCart();

  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>("delivery");
  const [timeslots, setTimeslots] = useState<Timeslot[]>([]);
  const [selectedTimeslot, setSelectedTimeslot] = useState("");
  const [estimate, setEstimate] = useState<EstimateResponse | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    orderNumber: string;
    totalCents: number;
    status: string;
  } | null>(null);

  const [formValues, setFormValues] = useState({
    customerName: "",
    email: "",
    phone: "",
    paymentMethod: "cash",
    notes: "",
    addressLine1: "",
    addressLine2: "",
    city: "Longwood",
    state: "FL",
    zip: "",
    turnstileToken: "",
  });

  const cartPayload = useMemo(
    () => items.map((item) => ({ dishId: item.dishId, quantity: item.quantity })),
    [items],
  );

  useEffect(() => {
    async function loadTimeslots() {
      if (cartPayload.length === 0) {
        setTimeslots([]);
        setSelectedTimeslot("");
        return;
      }

      const query = new URLSearchParams({
        fulfillmentType,
        items: JSON.stringify(cartPayload),
      });

      const response = await fetch(`/api/timeslots?${query.toString()}`);
      if (!response.ok) {
        setTimeslots([]);
        setSelectedTimeslot("");
        return;
      }

      const data = (await response.json()) as { timeslots: Timeslot[] };
      setTimeslots(data.timeslots);
      setSelectedTimeslot((current) =>
        data.timeslots.some((slot) => slot.id === current)
          ? current
          : (data.timeslots[0]?.id ?? ""),
      );
    }

    void loadTimeslots();
  }, [cartPayload, fulfillmentType]);

  useEffect(() => {
    async function refreshEstimate() {
      if (cartPayload.length === 0) {
        setEstimate(null);
        return;
      }

      if (fulfillmentType === "delivery") {
        if (!formValues.addressLine1 || !formValues.city || !formValues.state || !formValues.zip) {
          setEstimate(null);
          return;
        }
      }

      setIsEstimating(true);
      setError(null);

      const payload = {
        fulfillmentType,
        items: cartPayload,
        deliveryAddress:
          fulfillmentType === "delivery"
            ? {
                line1: formValues.addressLine1,
                line2: formValues.addressLine2 || undefined,
                city: formValues.city,
                state: formValues.state,
                zip: formValues.zip,
              }
            : undefined,
      };

      try {
        const response = await fetch("/api/orders/estimate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = (await response.json()) as EstimateResponse & { error?: string };

        if (!response.ok) {
          setEstimate(null);
          setError(data.error ?? "Could not estimate this order.");
          return;
        }

        setEstimate(data);
      } catch {
        setEstimate(null);
        setError("Could not estimate this order.");
      } finally {
        setIsEstimating(false);
      }
    }

    void refreshEstimate();
  }, [
    cartPayload,
    fulfillmentType,
    formValues.addressLine1,
    formValues.addressLine2,
    formValues.city,
    formValues.state,
    formValues.zip,
  ]);

  if (items.length === 0) {
    return <p className="checkout-empty">Your cart is empty. Add dishes first.</p>;
  }

  async function submitOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedTimeslot) {
      setError("Please choose a fulfillment slot.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: formValues.customerName,
          email: formValues.email,
          phone: formValues.phone,
          fulfillmentType,
          timeslotId: selectedTimeslot,
          paymentMethod: formValues.paymentMethod,
          notes: formValues.notes || undefined,
          turnstileToken: formValues.turnstileToken || undefined,
          idempotencyKey: nanoid(24),
          items: cartPayload,
          deliveryAddress:
            fulfillmentType === "delivery"
              ? {
                  line1: formValues.addressLine1,
                  line2: formValues.addressLine2 || undefined,
                  city: formValues.city,
                  state: formValues.state,
                  zip: formValues.zip,
                }
              : undefined,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        order?: { orderNumber: string; totalCents: number; status: string };
      };

      if (!response.ok || !data.order) {
        setError(data.error ?? "Order submission failed. Please retry.");
        return;
      }

      setSuccess(data.order);
      clearCart();
    } catch {
      setError("Order submission failed. Please retry.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="checkout-form" onSubmit={submitOrder}>
      <section className="checkout-section">
        <h2>Contact</h2>
        <label>
          Name
          <input
            required
            value={formValues.customerName}
            onChange={(event) =>
              setFormValues((current) => ({ ...current, customerName: event.target.value }))
            }
          />
        </label>

        <label>
          Email
          <input
            required
            type="email"
            value={formValues.email}
            onChange={(event) =>
              setFormValues((current) => ({ ...current, email: event.target.value }))
            }
          />
        </label>

        <label>
          Phone
          <input
            required
            value={formValues.phone}
            onChange={(event) =>
              setFormValues((current) => ({ ...current, phone: event.target.value }))
            }
          />
        </label>
      </section>

      <section className="checkout-section">
        <h2>Fulfillment</h2>
        <div className="toggle-row" role="radiogroup" aria-label="Choose delivery or pickup">
          <button
            type="button"
            className={fulfillmentType === "delivery" ? "chip active" : "chip"}
            onClick={() => setFulfillmentType("delivery")}
          >
            Delivery
          </button>
          <button
            type="button"
            className={fulfillmentType === "pickup" ? "chip active" : "chip"}
            onClick={() => setFulfillmentType("pickup")}
          >
            Pickup
          </button>
        </div>

        {fulfillmentType === "delivery" && (
          <div className="address-grid">
            <label>
              Address line 1
              <input
                required
                value={formValues.addressLine1}
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, addressLine1: event.target.value }))
                }
              />
            </label>

            <label>
              Address line 2
              <input
                value={formValues.addressLine2}
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, addressLine2: event.target.value }))
                }
              />
            </label>

            <label>
              City
              <input
                required
                value={formValues.city}
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, city: event.target.value }))
                }
              />
            </label>

            <label>
              State
              <input
                required
                value={formValues.state}
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, state: event.target.value }))
                }
              />
            </label>

            <label>
              ZIP
              <input
                required
                value={formValues.zip}
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, zip: event.target.value }))
                }
              />
            </label>
          </div>
        )}

        <label>
          Fulfillment slot
          <select
            required
            value={selectedTimeslot}
            onChange={(event) => setSelectedTimeslot(event.target.value)}
          >
            <option value="">Select a slot</option>
            {timeslots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {slot.dateLocal} {slot.startTimeLocal} ({slot.slotType})
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="checkout-section">
        <h2>Payment and Notes</h2>

        <label>
          Payment method
          <select
            value={formValues.paymentMethod}
            onChange={(event) =>
              setFormValues((current) => ({ ...current, paymentMethod: event.target.value }))
            }
          >
            <option value="cash">Cash</option>
            <option value="zelle">Zelle</option>
            <option value="venmo">Venmo</option>
          </select>
        </label>

        <label>
          Order notes
          <textarea
            rows={4}
            value={formValues.notes}
            onChange={(event) =>
              setFormValues((current) => ({ ...current, notes: event.target.value }))
            }
          />
        </label>

        <label>
          Turnstile token (required only when Turnstile secret is configured)
          <input
            value={formValues.turnstileToken}
            onChange={(event) =>
              setFormValues((current) => ({ ...current, turnstileToken: event.target.value }))
            }
          />
        </label>
      </section>

      <section className="checkout-section checkout-summary">
        <h2>Estimated total</h2>
        <p>
          Cart subtotal: <strong>{formatCurrency(subtotalCents)}</strong>
        </p>

        {isEstimating ? (
          <p>Updating estimate...</p>
        ) : estimate ? (
          <>
            <p>
              Delivery fee: <strong>{formatCurrency(estimate.deliveryFeeCents)}</strong>
            </p>
            {estimate.quote && (
              <p>
                Distance: <strong>{estimate.quote.distanceMiles.toFixed(1)} miles</strong>
              </p>
            )}
            <p>
              Tax: <strong>{formatCurrency(estimate.taxAmountCents)}</strong>
            </p>
            <p>
              Final total: <strong>{formatCurrency(estimate.totalCents)}</strong>
            </p>
            <ul className="estimate-notes">
              {estimate.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </>
        ) : (
          <p>Enter fulfillment details to calculate total.</p>
        )}
      </section>

      {error && <p className="form-error">{error}</p>}

      {success && (
        <div className="form-success">
          <p>Order received: {success.orderNumber}</p>
          <p>Total: {formatCurrency(success.totalCents)}</p>
          <p>Status: {success.status}</p>
        </div>
      )}

      <button className="btn-primary checkout-submit" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit order"}
      </button>
    </form>
  );
}
