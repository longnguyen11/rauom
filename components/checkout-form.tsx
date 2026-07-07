"use client";

import { nanoid } from "nanoid";
import { useEffect, useMemo, useState } from "react";

import { useCart } from "@/components/cart-context";
import { formatCurrency, formatDateReadable } from "@/lib/format";
import { getMessages, type Locale } from "@/lib/i18n-dictionary";
import {
  formatDishUnitPrice,
  getDishQuantityLabel,
  getDishRequiredLeadTimeDays,
} from "@/lib/menu-pricing";
import type { FulfillmentType, PaymentMethod, PickupLocation } from "@/lib/types";

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
  subtotalAfterDiscountCents: number;
  deliveryFeeCents: number;
  taxAmountCents: number;
  totalCents: number;
  taxRateBps: number;
  advancePaymentRequired: boolean;
  notes: string[];
  quote?: {
    distanceMiles: number;
  };
}

const ADVANCE_PAYMENT_THRESHOLD_CENTS = 5_000;
type FulfillmentChoice = "" | FulfillmentType;
type PickupLocationChoice = "" | PickupLocation;

const LONG_VAN_TIMES = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];
const PHAP_VU_TIMES = ["09:00", "10:00", "11:00", "12:00", "13:00"];

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

function todayDateLocal(): string {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function isDateBefore(dateLocal: string, minDateLocal: string): boolean {
  return dateLocal.localeCompare(minDateLocal) < 0;
}

function getMonthKey(dateLocal: string): string {
  return dateLocal.slice(0, 7);
}

function shiftMonth(monthKey: string, delta: number): string {
  const date = new Date(`${monthKey}-01T12:00:00`);
  date.setMonth(date.getMonth() + delta);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 7);
}

function formatMonthKey(monthKey: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${monthKey}-01T12:00:00`));
}

function addDaysToDateLocal(dateLocal: string, days: number): string {
  const date = new Date(`${dateLocal}T12:00:00`);
  date.setDate(date.getDate() + days);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function getDaysUntilDate(dateLocal: string): number {
  const today = new Date(`${todayDateLocal()}T12:00:00`);
  const target = new Date(`${dateLocal}T12:00:00`);
  return Math.floor((target.getTime() - today.getTime()) / 86_400_000);
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

function canSelectFulfillmentDate(input: {
  dateLocal: string;
  blackoutDateSet: Set<string>;
  allowNonBatchDay: boolean;
  minDateLocal: string;
}): boolean {
  if (isDateBefore(input.dateLocal, input.minDateLocal)) {
    return false;
  }

  if (input.blackoutDateSet.has(input.dateLocal)) {
    return false;
  }

  return isBatchDay(input.dateLocal) || input.allowNonBatchDay;
}

function defaultFulfillmentDateLocal(
  blackoutDateSet = new Set<string>(),
  allowNonBatchDay = false,
  minDateLocal = todayDateLocal(),
): string {
  const date = new Date(`${minDateLocal}T12:00:00`);

  for (let offset = 0; offset <= 180; offset += 1) {
    const candidate = new Date(date);
    candidate.setDate(date.getDate() + offset);
    candidate.setMinutes(candidate.getMinutes() - candidate.getTimezoneOffset());
    const dateLocal = candidate.toISOString().slice(0, 10);

    if (
      canSelectFulfillmentDate({
        dateLocal,
        blackoutDateSet,
        allowNonBatchDay,
        minDateLocal,
      })
    ) {
      return dateLocal;
    }
  }

  return minDateLocal;
}

function getDateDay(dateLocal: string): number {
  return new Date(`${dateLocal}T12:00:00`).getDay();
}

function isBatchDay(dateLocal: string): boolean {
  const day = getDateDay(dateLocal);
  return day === 0 || day === 6;
}

function formatPickupLocation(location: PickupLocation): string {
  switch (location) {
    case "long_van_temple":
      return "Long Van Temple";
    case "phap_vu_temple":
      return "Phap Vu Temple";
    case "fancy_fruit":
      return "Fancy Fruit in Longwood";
  }
}

function isPickupLocationAvailableOnDate(
  location: PickupLocation,
  dateLocal: string,
): boolean {
  const day = getDateDay(dateLocal);

  switch (location) {
    case "long_van_temple":
      return day === 6;
    case "phap_vu_temple":
      return day === 0;
    case "fancy_fruit":
      return true;
  }
}

function formatPickupTime(timeLocal: string): string {
  const [hourPart, minutePart] = timeLocal.split(":");
  const hour = Number(hourPart);
  const minute = Number(minutePart);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return timeLocal;
  }

  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute.toString().padStart(2, "0")} ${suffix}`;
}

export function CheckoutForm({
  locale,
  blackoutDates,
}: {
  locale: Locale;
  blackoutDates: string[];
}) {
  const { items, subtotalCents, updateQuantity, removeItem, clearCart } = useCart();
  const t = getMessages(locale);
  const blackoutDateSet = useMemo(() => new Set(blackoutDates), [blackoutDates]);

  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentChoice>("");
  const [selectedDate, setSelectedDate] = useState(() =>
    defaultFulfillmentDateLocal(blackoutDateSet),
  );
  const [calendarMonth, setCalendarMonth] = useState(() =>
    getMonthKey(defaultFulfillmentDateLocal(blackoutDateSet)),
  );
  const [nonBatchDayRequested, setNonBatchDayRequested] = useState(false);
  const [pickupLocation, setPickupLocation] = useState<PickupLocationChoice>("");
  const [pickupTimeLocal, setPickupTimeLocal] = useState("");
  const [deliveryAddressQuery, setDeliveryAddressQuery] = useState("");
  const [deliverySuggestions, setDeliverySuggestions] = useState<AddressSuggestion[]>([]);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [addressSuggestError, setAddressSuggestError] = useState<string | null>(null);
  const [selectedDeliveryAddress, setSelectedDeliveryAddress] =
    useState<AddressSuggestion | null>(null);
  const [estimate, setEstimate] = useState<EstimateResponse | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<{
    orderNumber: string;
    totalCents: number;
    status: string;
  } | null>(null);

  const [formValues, setFormValues] = useState<{
    customerName: string;
    email: string;
    phone: string;
    paymentMethod: PaymentMethod;
    notes: string;
  }>({
    customerName: "",
    email: "",
    phone: "",
    paymentMethod: "cash",
    notes: "",
  });

  const cartPayload = useMemo(
    () => items.map((item) => ({ dishId: item.dishId, quantity: item.quantity })),
    [items],
  );

  const selectedDateIsBatchDay = selectedDate ? isBatchDay(selectedDate) : true;
  const selectedDateIsBlocked = selectedDate ? blackoutDateSet.has(selectedDate) : false;
  const selectedDateDay = selectedDate ? getDateDay(selectedDate) : null;
  const selectedDateIsWeekday =
    selectedDateDay !== null && selectedDateDay >= 1 && selectedDateDay <= 5;
  const longVanAvailable = selectedDateDay === 6;
  const phapVuAvailable = selectedDateDay === 0;
  const currentOrderValueCents = estimate?.totalCents ?? subtotalCents;
  const nonBatchAllowed = currentOrderValueCents > ADVANCE_PAYMENT_THRESHOLD_CENTS;
  const allowNonBatchDateSelection = nonBatchAllowed && nonBatchDayRequested;
  const minDateLocal = todayDateLocal();
  const requiredCartLeadTimeDays = items.reduce(
    (maxLeadTime, item) =>
      Math.max(maxLeadTime, getDishRequiredLeadTimeDays(item.slug)),
    0,
  );
  const minLeadDateLocal = addDaysToDateLocal(minDateLocal, requiredCartLeadTimeDays);
  const calendarCells = useMemo(() => getCalendarCells(calendarMonth), [calendarMonth]);
  const leadTimeWarnings = useMemo(() => {
    if (!selectedDate) {
      return [];
    }

    const daysUntilFulfillment = getDaysUntilDate(selectedDate);
    return items
      .map((item) => ({
        item,
        requiredLeadTimeDays: getDishRequiredLeadTimeDays(item.slug),
      }))
      .filter(
        ({ requiredLeadTimeDays }) =>
          requiredLeadTimeDays > 0 && daysUntilFulfillment < requiredLeadTimeDays,
      )
      .map((item) => {
        const earliestDate = addDaysToDateLocal(
          minDateLocal,
          item.requiredLeadTimeDays,
        );
        return `${item.item.name} needs ${item.requiredLeadTimeDays} day${
          item.requiredLeadTimeDays === 1 ? "" : "s"
        } lead time. Earliest available date is ${formatDateReadable(earliestDate)}.`;
      });
  }, [items, minDateLocal, selectedDate]);
  const advancePaymentRequired =
    estimate?.advancePaymentRequired ??
    currentOrderValueCents > ADVANCE_PAYMENT_THRESHOLD_CENTS;
  const pickupTimes = useMemo(() => {
    if (pickupLocation === "phap_vu_temple") {
      return PHAP_VU_TIMES;
    }

    if (pickupLocation === "long_van_temple") {
      return LONG_VAN_TIMES;
    }

    return [];
  }, [pickupLocation]);

  useEffect(() => {
    if (!advancePaymentRequired || formValues.paymentMethod !== "cash") {
      return;
    }

    setFormValues((current) => ({ ...current, paymentMethod: "zelle" }));
  }, [advancePaymentRequired, formValues.paymentMethod]);

  useEffect(() => {
    if (nonBatchAllowed) {
      return;
    }

    setNonBatchDayRequested(false);
  }, [nonBatchAllowed]);

  useEffect(() => {
    if (
      selectedDate &&
      canSelectFulfillmentDate({
        dateLocal: selectedDate,
        blackoutDateSet,
        allowNonBatchDay: allowNonBatchDateSelection,
        minDateLocal: minLeadDateLocal,
      })
    ) {
      return;
    }

    const nextDate = defaultFulfillmentDateLocal(
      blackoutDateSet,
      allowNonBatchDateSelection,
      minLeadDateLocal,
    );
    setSelectedDate(nextDate);
    setCalendarMonth(getMonthKey(nextDate));
  }, [allowNonBatchDateSelection, blackoutDateSet, minLeadDateLocal, selectedDate]);

  useEffect(() => {
    if (fulfillmentType === "pickup") {
      setSelectedDeliveryAddress(null);
      setDeliveryAddressQuery("");
      setDeliverySuggestions([]);
      setAddressSuggestError(null);
      return;
    }

    if (fulfillmentType === "delivery") {
      setPickupLocation("");
      setPickupTimeLocal("");
    }
  }, [fulfillmentType]);

  useEffect(() => {
    if (fulfillmentType !== "pickup" || !pickupLocation || !selectedDate) {
      return;
    }

    if (isPickupLocationAvailableOnDate(pickupLocation, selectedDate)) {
      return;
    }

    setPickupLocation("");
    setPickupTimeLocal("");
  }, [fulfillmentType, pickupLocation, selectedDate]);

  useEffect(() => {
    if (pickupLocation === "fancy_fruit") {
      setPickupTimeLocal("");
      return;
    }

    if (pickupTimeLocal && !pickupTimes.includes(pickupTimeLocal)) {
      setPickupTimeLocal("");
    }
  }, [pickupLocation, pickupTimeLocal, pickupTimes]);

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

  useEffect(() => {
    async function refreshEstimate() {
      if (cartPayload.length === 0 || !fulfillmentType || !selectedDate) {
        setEstimate(null);
        return;
      }

      if (!selectedDateIsBatchDay && (!nonBatchDayRequested || !nonBatchAllowed)) {
        setEstimate(null);
        return;
      }

      if (selectedDateIsBlocked) {
        setEstimate(null);
        return;
      }

      if (leadTimeWarnings.length > 0) {
        setEstimate(null);
        return;
      }

      if (fulfillmentType === "delivery" && !selectedDeliveryAddress) {
        setEstimate(null);
        return;
      }

      if (fulfillmentType === "pickup") {
        if (!pickupLocation) {
          setEstimate(null);
          return;
        }

        if (
          (pickupLocation === "long_van_temple" || pickupLocation === "phap_vu_temple") &&
          !pickupTimeLocal
        ) {
          setEstimate(null);
          return;
        }
      }

      setIsEstimating(true);
      setError(null);

      const deliveryAddress =
        fulfillmentType === "delivery" && selectedDeliveryAddress
          ? {
              line1: selectedDeliveryAddress.line1,
              city: selectedDeliveryAddress.city,
              state: selectedDeliveryAddress.state,
              zip: selectedDeliveryAddress.zip,
            }
          : undefined;

      try {
        const response = await fetch("/api/orders/estimate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fulfillmentType,
            items: cartPayload,
            deliveryAddress,
            fulfillmentDateLocal: selectedDate,
            nonBatchDayRequested,
            pickupLocation: fulfillmentType === "pickup" ? pickupLocation || undefined : undefined,
            pickupTimeLocal:
              fulfillmentType === "pickup" && pickupTimeLocal
                ? pickupTimeLocal
                : undefined,
          }),
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
    leadTimeWarnings,
    nonBatchAllowed,
    nonBatchDayRequested,
    pickupLocation,
    pickupTimeLocal,
    selectedDate,
    selectedDateIsBlocked,
    selectedDateIsBatchDay,
    selectedDeliveryAddress,
    t.checkout.estimateFailed,
  ]);

  function getFulfillmentError(): string | null {
    if (!fulfillmentType) {
      return t.checkout.chooseFulfillmentError;
    }

    if (!selectedDate) {
      return "Choose a pickup or delivery date.";
    }

    if (selectedDateIsBlocked) {
      return "That date is blocked out and cannot accept pickup or delivery orders.";
    }

    if (!selectedDateIsBatchDay && !nonBatchDayRequested) {
      return "Monday-Friday pickup or delivery needs the weekday request checkbox.";
    }

    if (!selectedDateIsBatchDay && !nonBatchAllowed) {
      return "Monday-Friday pickup or delivery is only available when the order is above $50.";
    }

    if (leadTimeWarnings.length > 0) {
      return leadTimeWarnings[0];
    }

    if (fulfillmentType === "delivery" && !selectedDeliveryAddress) {
      return t.checkout.addressSuggestionRequired;
    }

    if (fulfillmentType === "pickup") {
      if (!pickupLocation) {
        return "Choose a pickup location.";
      }

      const day = getDateDay(selectedDate);
      if (pickupLocation === "long_van_temple" && day !== 6) {
        return "Long Van Temple pickup is only available on Saturday.";
      }

      if (pickupLocation === "phap_vu_temple" && day !== 0) {
        return "Phap Vu Temple pickup is only available on Sunday.";
      }

      if (
        (pickupLocation === "long_van_temple" || pickupLocation === "phap_vu_temple") &&
        !pickupTimeLocal
      ) {
        return `Choose a pickup time for ${formatPickupLocation(pickupLocation)}.`;
      }
    }

    return null;
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

    const fulfillmentError = getFulfillmentError();
    if (fulfillmentError) {
      setError(fulfillmentError);
      return;
    }

    if (advancePaymentRequired && formValues.paymentMethod === "cash") {
      setError("Orders above $50 require advance payment by Zelle or Venmo.");
      return;
    }

    const selectedFulfillment = fulfillmentType as FulfillmentType;
    const deliveryAddress =
      selectedFulfillment === "delivery" && selectedDeliveryAddress
        ? {
            line1: selectedDeliveryAddress.line1,
            city: selectedDeliveryAddress.city,
            state: selectedDeliveryAddress.state,
            zip: selectedDeliveryAddress.zip,
          }
        : undefined;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: formValues.customerName,
          email: formValues.email.trim() || undefined,
          phone: normalizedPhone,
          fulfillmentType: selectedFulfillment,
          fulfillmentDateLocal: selectedDate,
          nonBatchDayRequested,
          pickupLocation:
            selectedFulfillment === "pickup" ? pickupLocation || undefined : undefined,
          pickupTimeLocal:
            selectedFulfillment === "pickup" && pickupTimeLocal
              ? pickupTimeLocal
              : undefined,
          paymentMethod: formValues.paymentMethod,
          notes: formValues.notes || undefined,
          idempotencyKey: nanoid(24),
          items: cartPayload,
          deliveryAddress,
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

  if (success) {
    const successRequiresAdvancePayment =
      success.totalCents > ADVANCE_PAYMENT_THRESHOLD_CENTS;

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
        {successRequiresAdvancePayment ? (
          <div className="payment-instructions">
            <h3>Advance payment required</h3>
            <p>
              Please pay by Zelle or Venmo. Payment account details will be added here.
              Include order number <strong>{success.orderNumber}</strong> in the memo so
              we can match the payment to your order.
            </p>
          </div>
        ) : null}
      </section>
    );
  }

  if (items.length === 0) {
    return <p className="checkout-empty">{t.checkout.empty}</p>;
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
            type="email"
            autoComplete="email"
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

      <section className="checkout-section checkout-summary">
        <h2>{t.checkout.summaryTitle}</h2>

        <div className="checkout-summary-grid">
          <div className="checkout-summary-col checkout-summary-col-fulfillment">
            <div className="checkout-fulfillment-inline">
              <p className="checkout-window-note">
                Normal pickup and delivery days are Saturday and Sunday. Need
                Monday-Friday? That is a special weekday request and is only available
                for orders above $50.
              </p>

              <label>
                {t.checkout.fulfillmentTitle}
                <select
                  value={fulfillmentType}
                  onChange={(event) => {
                    setFulfillmentType(event.target.value as FulfillmentChoice);
                    setError(null);
                  }}
                  aria-label={t.checkout.fulfillmentAria}
                >
                  <option value="">{t.checkout.deliveryMethodPlaceholder}</option>
                  <option value="delivery">{t.checkout.delivery}</option>
                  <option value="pickup">{t.checkout.pickup}</option>
                </select>
              </label>

              {fulfillmentType && (
                <>
                  <div className="checkout-calendar-picker">
                    <div className="checkout-calendar-header">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setCalendarMonth((current) => shiftMonth(current, -1))}
                      >
                        Previous
                      </button>
                      <strong>{formatMonthKey(calendarMonth)}</strong>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setCalendarMonth((current) => shiftMonth(current, 1))}
                      >
                        Next
                      </button>
                    </div>

                    <div className="checkout-calendar-weekdays" aria-hidden="true">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                        <span key={day}>{day}</span>
                      ))}
                    </div>

                    <div className="checkout-calendar-grid" aria-label={t.checkout.fulfillmentDate}>
                      {calendarCells.map((dateLocal, index) => {
                        if (!dateLocal) {
                          return (
                            <div
                              key={`checkout-empty-${index}`}
                              className="checkout-calendar-empty"
                            />
                          );
                        }

                        const blocked = blackoutDateSet.has(dateLocal);
                        const batchDay = isBatchDay(dateLocal);
                        const selectable = canSelectFulfillmentDate({
                          dateLocal,
                          blackoutDateSet,
                          allowNonBatchDay: allowNonBatchDateSelection,
                          minDateLocal: minLeadDateLocal,
                        });
                        const disabledReason = blocked
                          ? "Blocked out"
                          : isDateBefore(dateLocal, minDateLocal)
                            ? "Past date"
                          : !batchDay && !allowNonBatchDateSelection
                            ? "Check weekday request to select Monday-Friday"
                            : requiredCartLeadTimeDays > 0 &&
                                isDateBefore(dateLocal, minLeadDateLocal)
                              ? `Cart needs ${requiredCartLeadTimeDays} day${
                                  requiredCartLeadTimeDays === 1 ? "" : "s"
                                } lead time`
                              : "";

                        return (
                          <button
                            key={dateLocal}
                            type="button"
                            disabled={!selectable}
                            className={[
                              "checkout-calendar-day",
                              selectedDate === dateLocal
                                ? "checkout-calendar-day-selected"
                                : "",
                              blocked ? "checkout-calendar-day-blocked" : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                            onClick={() => {
                              setSelectedDate(dateLocal);
                              setError(null);
                            }}
                          >
                            <span>{Number(dateLocal.slice(-2))}</span>
                            <small>
                              {blocked ? "Blocked" : batchDay ? "Sat/Sun" : "Weekday"}
                            </small>
                            {disabledReason ? (
                              <span className="sr-only">{disabledReason}</span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                    <p className="checkout-help-note">
                      Selected date: <strong>{formatDateReadable(selectedDate)}</strong>
                    </p>
                    {requiredCartLeadTimeDays > 0 ? (
                      <p className="checkout-help-note">
                        Lead time: this cart needs {requiredCartLeadTimeDays} day
                        {requiredCartLeadTimeDays === 1 ? "" : "s"}. Dates before{" "}
                        <strong>{formatDateReadable(minLeadDateLocal)}</strong> are disabled.
                      </p>
                    ) : null}
                    {leadTimeWarnings.length > 0 ? (
                      <div className="checkout-warning-box" role="alert">
                        <strong>Lead time warning</strong>
                        <ul>
                          {leadTimeWarnings.map((warning) => (
                            <li key={warning}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>

                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={nonBatchDayRequested}
                      disabled={!nonBatchAllowed}
                      onChange={(event) => setNonBatchDayRequested(event.target.checked)}
                    />
                    Request a Monday-Friday pickup or delivery
                  </label>
                  {!nonBatchAllowed ? (
                    <small className="checkout-help-note">
                      Weekday requests are only enabled when the order is above $50.
                    </small>
                  ) : null}
                  {!selectedDateIsBatchDay && nonBatchAllowed ? (
                    <small className="checkout-help-note">
                      You selected a weekday. Check the box above to request
                      Monday-Friday pickup or delivery.
                    </small>
                  ) : null}
                </>
              )}

              {fulfillmentType === "delivery" && (
                <div className="checkout-address-autocomplete">
                  <label>
                    {t.checkout.deliveryAddressAutocomplete}
                    <input
                      required
                      value={deliveryAddressQuery}
                      placeholder={t.checkout.deliveryAddressPlaceholder}
                      onFocus={() => setShowAddressSuggestions(true)}
                      onChange={(event) => {
                        setDeliveryAddressQuery(event.target.value);
                        setShowAddressSuggestions(true);
                        setSelectedDeliveryAddress(null);
                        setAddressSuggestError(null);
                      }}
                    />
                  </label>
                  <small>{t.checkout.deliveryAddressHint}</small>
                  {isAddressLoading ? <small>{t.checkout.addressSearching}</small> : null}
                  {addressSuggestError ? (
                    <small className="form-error">{addressSuggestError}</small>
                  ) : null}
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

              {fulfillmentType === "pickup" && (
                <div className="checkout-pickup-options">
                  <label>
                    Pickup location
                    <select
                      required
                      value={pickupLocation}
                      onChange={(event) => {
                        setPickupLocation(event.target.value as PickupLocationChoice);
                        setError(null);
                      }}
                    >
                      <option value="">Choose a pickup location</option>
                      <option value="long_van_temple" disabled={!longVanAvailable}>
                        Long Van Temple, Saturday, flexible pickup window
                      </option>
                      <option value="phap_vu_temple" disabled={!phapVuAvailable}>
                        Phap Vu Temple, Sunday, 9:00 AM to 1:00 PM
                      </option>
                      <option value="fancy_fruit">
                        Fancy Fruit in Longwood, time agreed by phone/text
                      </option>
                    </select>
                  </label>

                  {selectedDateIsWeekday ? (
                    <small className="checkout-help-note">
                      Monday-Friday pickup is only available at Fancy Fruit in Longwood.
                      Temple pickup is only available on its weekend day.
                    </small>
                  ) : (
                    <small className="checkout-help-note">
                      Long Van Temple is available on Saturday. Phap Vu Temple is
                      available on Sunday. Fancy Fruit can be requested any available day.
                    </small>
                  )}

                  {pickupLocation === "fancy_fruit" ? (
                    <small className="checkout-help-note">
                      Fancy Fruit pickup is free. We will agree on the exact time after
                      the order is placed.
                    </small>
                  ) : null}

                  {pickupTimes.length > 0 ? (
                    <label>
                      Pickup time
                      <select
                        required
                        value={pickupTimeLocal}
                        onChange={(event) => setPickupTimeLocal(event.target.value)}
                      >
                        <option value="">Choose a pickup time</option>
                        {pickupTimes.map((time) => (
                          <option key={time} value={time}>
                            {formatPickupTime(time)}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          <div className="checkout-summary-col checkout-summary-col-items">
            <h3 className="checkout-tally-title">{t.checkout.itemsTitle}</h3>
            <ul className="checkout-tally-list">
              {items.map((item) => {
                const lineTotalCents = item.priceCents * item.quantity;
                const itemRequiredLeadTimeDays = getDishRequiredLeadTimeDays(item.slug);

                return (
                  <li key={item.dishId} className="checkout-tally-item">
                    <div>
                      <p className="checkout-tally-name">{item.name}</p>
                      <p className="checkout-tally-meta">
                        {formatDishUnitPrice({
                          priceCents: item.priceCents,
                          slug: item.slug,
                        })}
                        {itemRequiredLeadTimeDays > 0
                          ? ` - ${itemRequiredLeadTimeDays} day${
                              itemRequiredLeadTimeDays === 1 ? "" : "s"
                            } lead time`
                          : ""}
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
                          aria-label={`${getDishQuantityLabel(item.slug)} ${item.name}`}
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
                <p>
                  {t.checkout.deliveryFee}:{" "}
                  <strong>{formatCurrency(estimate.deliveryFeeCents)}</strong>
                </p>
                {estimate.quote && (
                  <p>
                    {t.checkout.distance}:{" "}
                    <strong>
                      {estimate.quote.distanceMiles.toFixed(1)} {t.checkout.miles}
                    </strong>
                  </p>
                )}
                <p>
                  {t.checkout.tax}: <strong>{formatCurrency(estimate.taxAmountCents)}</strong>
                </p>
                <p>
                  {t.checkout.total}: <strong>{formatCurrency(estimate.totalCents)}</strong>
                </p>
                {estimate.advancePaymentRequired ? (
                  <p className="checkout-cash-limit-note">
                    Orders above $50 require advance payment by Zelle or Venmo.
                  </p>
                ) : null}
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

      <section className="checkout-section">
        <h2>{t.checkout.paymentNotesTitle}</h2>

        <label>
          {t.checkout.paymentMethod}
          <select
            value={formValues.paymentMethod}
            onChange={(event) =>
              setFormValues((current) => ({
                ...current,
                paymentMethod: event.target.value as PaymentMethod,
              }))
            }
          >
            <option value="cash" disabled={advancePaymentRequired}>
              {advancePaymentRequired ? "Cash (disabled above $50)" : t.checkout.cash}
            </option>
            <option value="zelle">{t.checkout.zelle}</option>
            <option value="venmo">{t.checkout.venmo}</option>
          </select>
          {advancePaymentRequired ? (
            <small className="checkout-cash-limit-note">
              Payment instructions are shown after order submission. Add the order
              number in the Zelle/Venmo memo.
            </small>
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

      {error && <p className="form-error">{error}</p>}

      <button className="btn-primary checkout-submit" type="submit" disabled={isSubmitting}>
        {isSubmitting ? t.checkout.submitting : t.checkout.submit}
      </button>
    </form>
  );
}
