import { Temporal } from "@js-temporal/polyfill";

import { APP_TIMEZONE } from "@/lib/constants";

export function nowZoned(timezone = APP_TIMEZONE): Temporal.ZonedDateTime {
  return Temporal.Now.zonedDateTimeISO(timezone);
}

export function toUtcFromLocal(
  dateLocal: string,
  timeLocal: string,
  timezone = APP_TIMEZONE,
): Temporal.Instant {
  const plain = Temporal.PlainDateTime.from(`${dateLocal}T${timeLocal}`);
  return plain.toZonedDateTime(timezone).toInstant();
}

export function toIsoInstant(instant: Temporal.Instant): string {
  return instant.toString();
}

export function minEligibleInstant(
  leadTimeDays: number,
  bufferHours: number,
  timezone = APP_TIMEZONE,
): Temporal.Instant {
  const now = nowZoned(timezone);

  const leadBound = now.add({ days: leadTimeDays }).toInstant();
  const bufferBound = now.add({ hours: bufferHours }).toInstant();

  return Temporal.Instant.compare(leadBound, bufferBound) > 0
    ? leadBound
    : bufferBound;
}

export function isUtcSlotEligible(
  slotStartUtc: string,
  leadTimeDays: number,
  bufferHours: number,
  timezone = APP_TIMEZONE,
): boolean {
  const slotInstant = Temporal.Instant.from(slotStartUtc);
  const minInstant = minEligibleInstant(leadTimeDays, bufferHours, timezone);
  return Temporal.Instant.compare(slotInstant, minInstant) >= 0;
}

export function formatUtcForLocalDisplay(
  slotUtc: string,
  timezone = APP_TIMEZONE,
): string {
  const zoned = Temporal.Instant.from(slotUtc).toZonedDateTimeISO(timezone);
  return `${zoned.month.toString().padStart(2, "0")}/${zoned.day
    .toString()
    .padStart(2, "0")}/${zoned.year} ${zoned.hour
    .toString()
    .padStart(2, "0")}:${zoned.minute.toString().padStart(2, "0")}`;
}

export function addMinutesToLocalTime(time: string, minutes: number): string {
  const [hourRaw, minuteRaw] = time.split(":").map((part) => Number(part));
  const total = hourRaw * 60 + minuteRaw + minutes;
  const nextMinutes = ((total % 1440) + 1440) % 1440;
  const h = Math.floor(nextMinutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (nextMinutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}
