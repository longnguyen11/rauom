export function formatCurrency(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatMiles(distanceMiles: number): string {
  return `${distanceMiles.toFixed(1)} mi`;
}

export function formatDateTimeLocal(isoUtc: string, timezone = "America/New_York"): string {
  const date = new Date(isoUtc);
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  }).format(date);
}

export function toIsoUtcString(date: Date): string {
  return date.toISOString();
}
