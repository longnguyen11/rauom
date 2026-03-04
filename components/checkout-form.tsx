"use client";

import { nanoid } from "nanoid";
import { useEffect, useMemo, useState } from "react";

import { useCart } from "@/components/cart-context";
import { formatCurrency } from "@/lib/format";
import { getMessages, type Locale } from "@/lib/i18n-dictionary";
import type { FulfillmentType, Timeslot } from "@/lib/types";

interface AddressSuggestion {
  id: string;
  display: string;
  line1: string;
  city: string;
  state: string;
  zip: string;
}

interface EstimateResponse {
  totalItemQuantity: number;
  subtotalCents: number;
  bulkDiscountCents: number;
  subtotalAfterDiscountCents: number;
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

const CASH_LIMIT_CENTS = 10_000;
type FulfillmentChoice = "" | FulfillmentType;

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
  const { items, subtotalCents, updateQuantity, removeItem, clearCart } = useCart();
  const t = getMessages(locale);

  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentChoice>("");
  const [timeslots, setTimeslots] = useState<Timeslot[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTimeslot, setSelectedTimeslot] = useState("");
  const [deliveryAddressQuery, setDeliveryAddressQuery] = useState("");
  const [deliverySuggestions, setDeliverySuggestions] = useState<AddressSuggestion[]>([]);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [addressSuggestError, setAddressSuggestError] = useState<string | null>(null);
  const [selectedDeliveryAddress, setSelectedDeliveryAddress] =
    useState<AddressSuggestion | null>(null);
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
    phone: "",
    paymentMethod: "cash",
    notes: "",
  });

  const cartPayload = useMemo(
    () => items.map((item) => ({ dishId: item.dishId, quantity: item.quantity })),
    [items],
  );
  const cashRestricted =
    subtotalCents > CASH_LIMIT_CENTS || (estimate?.totalCents ?? 0) > CASH_LIMIT_CENTS;

  useEffect(() => {
    if (!cashRestricted) {
      return;
    }

    setFormValues((current) =>
      current.paymentMethod === "cash"
        ? { ...current, paymentMethod: "zelle" }
        : current,
    );
  }, [cashRestricted]);

  useEffect(() => {
    async function loadTimeslots() {
      if (cartPayload.length === 0 || !fulfillmentType) {
        setTimeslots([]);
        setSelectedDate("");
        setSelectedTimeslot("");
        return;
      }

      const query = new URLSearchParams({
        fulfillmentType,
        items: JSON.stringify(cartPayload),
        daysAhead: "60",
      });

      const response = await fetch(`/api/timeslots?${query.toString()}`);
      if (!response.ok) {
        setTimeslots([]);
        setSelectedDate("");
        setSelectedTimeslot("");
        return;
      }

      const data = (await response.json()) as { timeslots: Timeslot[] };
      setTimeslots(data.timeslots);
    }

    void loadTimeslots();
  }, [cartPayload, fulfillmentType]);

  useEffect(() => {
    if (fulfillmentType !== "delivery") {
      setDeliverySuggestions([]);
      setShowAddressSuggestions(false);
      setIsAddressLoading(false);
      setAddressSuggestError(null);
      return;
    }

    const query = deliveryAddressQuery.trim();
    if (query.length < 3) {
      setDeliverySuggestions([]);
      setAddressSuggestError(null);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsAddressLoading(true);
      setAddressSuggestError(null);
      try {
        const response = await fetch(
          `/api/addresses/suggest?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        const data = (await response.json()) as {
          suggestions?: AddressSuggestion[];
          error?: string;
        };

        if (data.error) {
          setAddressSuggestError(data.error);
        }

        if (!response.ok) {
          setDeliverySuggestions([]);
          if (!data.error) {
            setAddressSuggestError(t.checkout.addressLookupFailed);
          }
          return;
        }

        setDeliverySuggestions(data.suggestions ?? []);
      } catch {
        setDeliverySuggestions([]);
        setAddressSuggestError(t.checkout.addressLookupFailed);
      } finally {
        setIsAddressLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [deliveryAddressQuery, fulfillmentType, t.checkout.addressLookupFailed]);

  const availableDates = useMemo(() => {
    const uniqueDates = new Set(timeslots.map((slot) => slot.dateLocal));
    return [...uniqueDates].sort((a, b) => a.localeCompare(b));
  }, [timeslots]);

  const earliestDate = availableDates[0] ?? "";
  const latestDate = availableDates[availableDates.length - 1] ?? "";

  useEffect(() => {
    if (availableDates.length === 0) {
      setSelectedDate("");
      return;
    }

    setSelectedDate((current) =>
      current && availableDates.includes(current) ? current : availableDates[0],
    );
  }, [availableDates]);

  const filteredTimeslots = useMemo(() => {
    if (!selectedDate) {
      return timeslots;
    }
    return timeslots.filter((slot) => slot.dateLocal === selectedDate);
  }, [timeslots, selectedDate]);

  useEffect(() => {
    setSelectedTimeslot((current) =>
      filteredTimeslots.some((slot) => slot.id === current)
        ? current
        : (filteredTimeslots[0]?.id ?? ""),
    );
  }, [filteredTimeslots]);

  useEffect(() => {
    async function refreshEstimate() {
      if (cartPayload.length === 0) {
        setEstimate(null);
        return;
      }

      if (!fulfillmentType) {
        setEstimate(null);
        return;
      }

      const deliveryAddress =
        fulfillmentType === "delivery" ? selectedDeliveryAddress : null;

      if (fulfillmentType === "delivery") {
        if (!deliveryAddress) {
          setEstimate(null);
          return;
        }
      }

      setIsEstimating(true);
      setError(null);

      let payloadDeliveryAddress:
        | { line1: string; city: string; state: string; zip: string }
        | undefined;
      if (fulfillmentType === "delivery" && deliveryAddress) {
        payloadDeliveryAddress = {
          line1: deliveryAddress.line1,
          city: deliveryAddress.city,
          state: deliveryAddress.state,
          zip: deliveryAddress.zip,
        };
      }

      const payload = {
        fulfillmentType,
        items: cartPayload,
        deliveryAddress: payloadDeliveryAddress,
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
    selectedDeliveryAddress,
    t.checkout.estimateFailed,
  ]);

  if (success) {
    return (
      <section className="checkout-confirmation-screen">
        <h2>{t.checkout.waitingForConfirmationTitle}</h2>
        <p>{t.checkout.waitingForConfirmationBody}</p>
        <p>
          <strong>
            {t.checkout.orderNumberLabel}: {success.orderNumber}
          </strong>
        </p>
        <p>
          {t.checkout.total}: <strong>{formatCurrency(success.totalCents)}</strong>
        </p>
        <p>
          {t.checkout.status}: <strong>{success.status.replaceAll("_", " ")}</strong>
        </p>
      </section>
    );
  }

  if (items.length === 0) {
    return <p className="checkout-empty">{t.checkout.empty}</p>;
  }

  async function submitOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const normalizedPhone = formatPhoneNumber(formValues.phone);

    if (toPhoneDigits(normalizedPhone).length !== 10) {
      setError(t.checkout.invalidPhone);
      return;
    }

    if (!fulfillmentType) {
      setError(t.checkout.chooseFulfillmentError);
      return;
    }

    if (
      fulfillmentType === "delivery" &&
      !selectedDeliveryAddress
    ) {
      setError(t.checkout.addressSuggestionRequired);
      return;
    }

    if (!selectedTimeslot) {
      setError(t.checkout.chooseSlotError);
      return;
    }

    if (cashRestricted && formValues.paymentMethod === "cash") {
      setError(t.checkout.cashLimitError);
      return;
    }

    setIsSubmitting(true);
    const selectedFulfillment = fulfillmentType as FulfillmentType;
    const deliveryAddress =
      selectedFulfillment === "delivery" ? selectedDeliveryAddress : null;

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: formValues.customerName,
          phone: normalizedPhone,
          fulfillmentType: selectedFulfillment,
          timeslotId: selectedTimeslot,
          paymentMethod: formValues.paymentMethod,
          notes: formValues.notes || undefined,
          idempotencyKey: nanoid(24),
          items: cartPayload,
          deliveryAddress:
            deliveryAddress
              ? {
                  line1: deliveryAddress.line1,
                  city: deliveryAddress.city,
                  state: deliveryAddress.state,
                  zip: deliveryAddress.zip,
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
          {t.checkout.phone}
          <input
            required
            autoComplete="tel"
            inputMode="numeric"
            placeholder="(555) 123-4567"
            maxLength={14}
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
        <h2>{t.checkout.paymentNotesTitle}</h2>

        <label>
          {t.checkout.paymentMethod}
          <select
            value={formValues.paymentMethod}
            onChange={(event) =>
              setFormValues((current) => ({ ...current, paymentMethod: event.target.value }))
            }
          >
            <option value="cash" disabled={cashRestricted}>
              {cashRestricted
                ? `${t.checkout.cash} (${t.checkout.cashDisabledOver100})`
                : t.checkout.cash}
            </option>
            <option value="zelle">{t.checkout.zelle}</option>
            <option value="venmo">{t.checkout.venmo}</option>
          </select>
          {cashRestricted && formValues.paymentMethod === "cash" ? (
            <small className="checkout-cash-limit-note">{t.checkout.cashLimitNote}</small>
          ) : null}
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

        <div className="checkout-summary-grid">
          <div className="checkout-summary-col checkout-summary-col-fulfillment">
            <div className="checkout-fulfillment-inline">
              <label>
                {t.checkout.fulfillmentTitle}
                <select
                  value={fulfillmentType}
                  onChange={(event) => {
                    const next = event.target.value as FulfillmentChoice;
                    setFulfillmentType(next);
                    setSelectedTimeslot("");
                    setError(null);
                    if (next !== "delivery") {
                      setDeliveryAddressQuery("");
                      setSelectedDeliveryAddress(null);
                      setDeliverySuggestions([]);
                      setAddressSuggestError(null);
                    }
                  }}
                  aria-label={t.checkout.fulfillmentAria}
                >
                  <option value="">{t.checkout.deliveryMethodPlaceholder}</option>
                  <option value="delivery">{t.checkout.delivery}</option>
                  <option value="pickup">{t.checkout.pickup}</option>
                </select>
              </label>

              {fulfillmentType === "delivery" && (
                <div className="checkout-address-autocomplete">
                  <label>
                    {t.checkout.deliveryAddressAutocomplete}
                    <input
                      required
                      value={deliveryAddressQuery}
                      placeholder={t.checkout.deliveryAddressPlaceholder}
                      onFocus={() => setShowAddressSuggestions(true)}
                      onChange={(event) =>
                        {
                          setDeliveryAddressQuery(event.target.value);
                          setShowAddressSuggestions(true);
                          setSelectedDeliveryAddress(null);
                          setAddressSuggestError(null);
                        }
                      }
                    />
                  </label>
                  <small>{t.checkout.deliveryAddressHint}</small>
                  {isAddressLoading ? <small>{t.checkout.addressSearching}</small> : null}
                  {addressSuggestError ? <small className="form-error">{addressSuggestError}</small> : null}
                  {!isAddressLoading &&
                  !addressSuggestError &&
                  showAddressSuggestions &&
                  deliveryAddressQuery.trim().length >= 3 &&
                  deliverySuggestions.length === 0 ? (
                    <small>{t.checkout.addressNoResults}</small>
                  ) : null}
                  {showAddressSuggestions &&
                  deliveryAddressQuery.trim().length >= 3 &&
                  deliverySuggestions.length > 0 && (
                    <ul className="address-suggestion-list">
                      {deliverySuggestions.map((suggestion) => (
                        <li key={suggestion.id}>
                          <button
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                              setDeliveryAddressQuery(suggestion.display);
                              setShowAddressSuggestions(false);
                              setSelectedDeliveryAddress(suggestion);
                            }}
                          >
                            {suggestion.display}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {fulfillmentType && (
                <>
                  <label>
                    {t.checkout.fulfillmentDate}
                    <input
                      type="date"
                      required
                      min={earliestDate || undefined}
                      max={latestDate || undefined}
                      value={selectedDate}
                      onChange={(event) => setSelectedDate(event.target.value)}
                      disabled={availableDates.length === 0}
                    />
                  </label>

                  <label>
                    {t.checkout.slot}
                    <select
                      required
                      value={selectedTimeslot}
                      onChange={(event) => setSelectedTimeslot(event.target.value)}
                      disabled={filteredTimeslots.length === 0}
                    >
                      <option value="">{t.checkout.slotPlaceholder}</option>
                      {filteredTimeslots.map((slot) => (
                        <option key={slot.id} value={slot.id}>
                          {slot.dateLocal} {slot.startTimeLocal} ({slot.slotType})
                        </option>
                      ))}
                    </select>
                    {selectedDate && filteredTimeslots.length === 0 ? (
                      <small>{t.checkout.noSlotsForDate}</small>
                    ) : null}
                  </label>
                </>
              )}
            </div>
          </div>

          <div className="checkout-summary-col checkout-summary-col-items">
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
                      <div className="checkout-qty-controls">
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => updateQuantity(item.dishId, item.quantity - 1)}
                          aria-label={`${t.cart.decreaseQtyPrefix} ${item.name}`}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={25}
                          value={item.quantity}
                          onChange={(event) => {
                            const next = Number(event.target.value);
                            if (!Number.isFinite(next)) {
                              return;
                            }
                            updateQuantity(item.dishId, Math.max(1, Math.floor(next)));
                          }}
                          aria-label={`${t.checkout.quantityLabel} ${item.name}`}
                        />
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => updateQuantity(item.dishId, item.quantity + 1)}
                          aria-label={`${t.cart.increaseQtyPrefix} ${item.name}`}
                        >
                          +
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => removeItem(item.dishId)}
                        >
                          {t.cart.remove}
                        </button>
                      </div>
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
                {estimate.bulkDiscountCents > 0 && (
                  <p>
                    {t.checkout.bulkDiscount}:{" "}
                    <strong>-{formatCurrency(estimate.bulkDiscountCents)}</strong>
                  </p>
                )}
                {estimate.bulkDiscountCents > 0 && (
                  <p>
                    {t.checkout.subtotalAfterDiscount}:{" "}
                    <strong>{formatCurrency(estimate.subtotalAfterDiscountCents)}</strong>
                  </p>
                )}
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
          </div>
        </div>
      </section>

      {error && <p className="form-error">{error}</p>}

      <button className="btn-primary checkout-submit" type="submit" disabled={isSubmitting}>
        {isSubmitting ? t.checkout.submitting : t.checkout.submit}
      </button>
    </form>
  );
}
