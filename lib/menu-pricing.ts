import { formatCompactCurrency } from "@/lib/format";

const UNIT_LABEL_BY_SLUG: Record<string, string> = {
  "banh-uot-banh-cuon": "/lb",
  "cha-ca": "/lb",
  "nem-chua": "/lb",
  "banh-tom-chien": "/c\u00e1i",
};

const QUANTITY_LABEL_BY_SLUG: Record<string, string> = {
  "banh-uot-banh-cuon": "Qty (lb)",
  "cha-ca": "Qty (lb)",
  "nem-chua": "Qty (lb)",
  "banh-tom-chien": "Qty (pieces)",
};

const REQUIRED_LEAD_TIME_DAYS_BY_SLUG: Record<string, number> = {
  "banh-uot-banh-cuon": 1,
  "nem-chua": 2,
};

export function getDishUnitLabel(slug: string): string {
  return UNIT_LABEL_BY_SLUG[slug] ?? "";
}

export function getDishQuantityLabel(slug: string): string {
  return QUANTITY_LABEL_BY_SLUG[slug] ?? "Qty";
}

export function getDishRequiredLeadTimeDays(slug: string): number {
  return REQUIRED_LEAD_TIME_DAYS_BY_SLUG[slug] ?? 0;
}

export function formatDishUnitPrice(input: {
  priceCents: number;
  currency?: string;
  slug: string;
}): string {
  return `${formatCompactCurrency(input.priceCents, input.currency)}${getDishUnitLabel(input.slug)}`;
}
