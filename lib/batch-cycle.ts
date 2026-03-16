import { Temporal } from "@js-temporal/polyfill";

export const SATURDAY_DAY_OF_WEEK = 6;

export function isOrderWindowDay(dayOfWeek: number): boolean {
  return dayOfWeek >= 1 && dayOfWeek <= 5;
}

export function getEarlyOrderDiscountPercent(dayOfWeek: number): number {
  if (dayOfWeek === 1) {
    return 10;
  }

  if (dayOfWeek === 2 || dayOfWeek === 3) {
    return 5;
  }

  return 0;
}

export function getNextFulfillmentSaturday(
  now: Temporal.ZonedDateTime,
): Temporal.PlainDate {
  const daysUntilSaturday = (SATURDAY_DAY_OF_WEEK - now.dayOfWeek + 7) % 7;
  const normalizedDaysUntilSaturday = daysUntilSaturday === 0 ? 7 : daysUntilSaturday;
  return now.add({ days: normalizedDaysUntilSaturday }).toPlainDate();
}

export function isSaturdayDateLocal(dateLocal: string): boolean {
  try {
    return Temporal.PlainDate.from(dateLocal).dayOfWeek === SATURDAY_DAY_OF_WEEK;
  } catch {
    return false;
  }
}
