"use client";

import { nanoid } from "nanoid";
import { useEffect, useMemo, useState } from "react";

import { useCart } from "@/components/cart-context";
import { formatCurrency } from "@/lib/format";
import { getMessages, type Locale } from "@/lib/i18n-dictionary";
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function toPhoneDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}

function formatPhoneNumber(value: string): string {
  const digits = toPhoneDigits(value);

  if (digits.length === 0) {
    return "";
  }

  if (digits.length <= 3) {
    return `(${digits}`;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function CheckoutForm({ locale }: { locale: Locale }) {
  const { items, subtotalCents, clearCart } = useCart();
  const t = getMessages(locale);

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
          setError(data.error ?? t.checkout.estimateFailed);
          return;
        }

        setEstimate(data);
      } catch {
        setEstimate(null);
        setError(t.checkout.estimateFailed);
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
    t.checkout.estimateFailed,
  ]);

  if (items.length === 0) {
    return <p className="checkout-empty">{t.checkout.empty}</p>;
  }

  async function submitOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const normalizedEmail = formValues.email.trim().toLowerCase();
    const normalizedPhone = formatPhoneNumber(formValues.phone);

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setError(t.checkout.invalidEmail);
      return;
    }

    if (toPhoneDigits(normalizedPhone).length !== 10) {
      setError(t.checkout.invalidPhone);
      return;
    }

    if (!selectedTimeslot) {
      setError(t.checkout.chooseSlotError);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: formValues.customerName,
          email: normalizedEmail,
          phone: normalizedPhone,
          fulfillmentType,
          timeslotId: selectedTimeslot,
          paymentMethod: formValues.paymentMethod,
          notes: formValues.notes || undefined,
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
        setError(data.error ?? t.checkout.orderFailed);
        return;
      }

      setSuccess(data.order);
      clearCart();
    } catch {
      setError(t.checkout.orderFailed);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="checkout-form" onSubmit={submitOrder}>
      <section className="checkout-section">
        <h2>{t.checkout.contactTitle}</h2>
        <label>
          {t.checkout.name}
          <input
            required
            value={formValues.customerName}
            onChange={(event) =>
              setFormValues((current) => ({ ...current, customerName: event.target.value }))
            }
          />
        </label>

        <label>
          {t.checkout.email}
          <input
            required
            type="email"
            autoComplete="email"
            inputMode="email"
            value={formValues.email}
            onChange={(event) =>
              setFormValues((current) => ({ ...current, email: event.target.value }))
            }
          />
        </label>

        <label>
          {t.checkout.phone}
          <input
            required
            autoComplete="tel"
            inputMode="numeric"
            placeholder="(555) 123-4567"
            maxLength={14}
            pattern="\\(\\d{3}\\) \\d{3}-\\d{4}"
            value={formValues.phone}
            onChange={(event) =>
              setFormValues((current) => ({
                ...current,
                phone: formatPhoneNumber(event.target.value),
              }))
            }
          />
        </label>
      </section>

      <section className="checkout-section">
        <h2>{t.checkout.fulfillmentTitle}</h2>
        <div className="toggle-row" role="radiogroup" aria-label={t.checkout.fulfillmentAria}>
          <button
            type="button"
            className={fulfillmentType === "delivery" ? "chip active" : "chip"}
            onClick={() => setFulfillmentType("delivery")}
          >
            {t.checkout.delivery}
          </button>
          <button
            type="button"
            className={fulfillmentType === "pickup" ? "chip active" : "chip"}
            onClick={() => setFulfillmentType("pickup")}
          >
            {t.checkout.pickup}
          </button>
        </div>

        {fulfillmentType === "delivery" && (
          <div className="address-grid">
            <label>
              {t.checkout.address1}
              <input
                required
                value={formValues.addressLine1}
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, addressLine1: event.target.value }))
                }
              />
            </label>

            <label>
              {t.checkout.address2}
              <input
                value={formValues.addressLine2}
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, addressLine2: event.target.value }))
                }
              />
            </label>

            <label>
              {t.checkout.city}
              <input
                required
                value={formValues.city}
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, city: event.target.value }))
                }
              />
            </label>

            <label>
              {t.checkout.state}
              <input
                required
                value={formValues.state}
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, state: event.target.value }))
                }
              />
            </label>

            <label>
              {t.checkout.zip}
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
          {t.checkout.slot}
          <select
            required
            value={selectedTimeslot}
            onChange={(event) => setSelectedTimeslot(event.target.value)}
          >
            <option value="">{t.checkout.slotPlaceholder}</option>
            {timeslots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {slot.dateLocal} {slot.startTimeLocal} ({slot.slotType})
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="checkout-section">
        <h2>{t.checkout.paymentNotesTitle}</h2>

        <label>
          {t.checkout.paymentMethod}
          <select
            value={formValues.paymentMethod}
            onChange={(event) =>
              setFormValues((current) => ({ ...current, paymentMethod: event.target.value }))
            }
          >
            <option value="cash">{t.checkout.cash}</option>
            <option value="zelle">{t.checkout.zelle}</option>
            <option value="venmo">{t.checkout.venmo}</option>
          </select>
        </label>

        <label>
          {t.checkout.orderNotes}
          <textarea
            rows={4}
            value={formValues.notes}
            onChange={(event) =>
              setFormValues((current) => ({ ...current, notes: event.target.value }))
            }
          />
        </label>
      </section>

      <section className="checkout-section checkout-summary">
        <h2>{t.checkout.summaryTitle}</h2>
        <h3 className="checkout-tally-title">{t.checkout.itemsTitle}</h3>
        <ul className="checkout-tally-list">
          {items.map((item) => {
            const lineTotalCents = item.priceCents * item.quantity;

            return (
              <li key={item.dishId} className="checkout-tally-item">
                <div>
                  <p className="checkout-tally-name">{item.name}</p>
                  <p className="checkout-tally-meta">
                    {t.checkout.quantityLabel}: {item.quantity} · {formatCurrency(item.priceCents)}{" "}
                    {t.common.each}
                  </p>
                </div>
                <strong>{formatCurrency(lineTotalCents)}</strong>
              </li>
            );
          })}
        </ul>
        <p>
          {t.checkout.cartSubtotal}: <strong>{formatCurrency(subtotalCents)}</strong>
        </p>

        {isEstimating ? (
          <p>{t.checkout.updatingEstimate}</p>
        ) : estimate ? (
          <>
            <p>
              {t.checkout.deliveryFee}: <strong>{formatCurrency(estimate.deliveryFeeCents)}</strong>
            </p>
            {estimate.quote && (
              <p>
                {t.checkout.distance}: <strong>{estimate.quote.distanceMiles.toFixed(1)} {t.checkout.miles}</strong>
              </p>
            )}
            <p>
              {t.checkout.tax}: <strong>{formatCurrency(estimate.taxAmountCents)}</strong>
            </p>
            <p>
              {t.checkout.total}: <strong>{formatCurrency(estimate.totalCents)}</strong>
            </p>
            <ul className="estimate-notes">
              {estimate.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </>
        ) : (
          <p>{t.checkout.enterDetails}</p>
        )}
      </section>

      {error && <p className="form-error">{error}</p>}

      {success && (
        <div className="form-success">
          <p>{t.checkout.orderReceived}: {success.orderNumber}</p>
          <p>{t.checkout.total}: {formatCurrency(success.totalCents)}</p>
          <p>{t.checkout.status}: {success.status}</p>
        </div>
      )}

      <button className="btn-primary checkout-submit" type="submit" disabled={isSubmitting}>
        {isSubmitting ? t.checkout.submitting : t.checkout.submit}
      </button>
    </form>
  );
}
