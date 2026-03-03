import {
  DEFAULT_TAX_RATE_BPS,
  MANUAL_PAYMENT_BUFFER_HOURS_DEFAULT,
  MIN_LEAD_TIME_DAYS_DEFAULT,
} from "@/lib/constants";
import { readAppRuntimeConfig } from "@/lib/cloudflare";
import { dbAll, dbFirst } from "@/lib/db";
import {
  DEFAULT_DELIVERY_PRICING_RULE,
  type DeliveryPricingRule,
} from "@/lib/pricing";

interface AppSettingRow {
  key: string;
  value_json: string;
}

interface DeliveryRuleRow {
  base_fee_cents: number;
  tier1_rate_cents_per_mile: number;
  tier2_rate_cents_per_mile: number;
  max_distance_mi: number;
  rounding_step_cents: number;
  minimum_order_enabled: number;
  minimum_order_amount_delivery_cents: number | null;
  minimum_order_amount_pickup_cents: number | null;
}

interface TaxRuleRow {
  tax_rate_bps: number;
}

export async function getAppSetting<T>(key: string): Promise<T | null> {
  const row = await dbFirst<AppSettingRow>(
    `SELECT key, value_json FROM app_settings WHERE key = ?`,
    [key],
  );

  if (!row) {
    return null;
  }

  try {
    return JSON.parse(row.value_json) as T;
  } catch {
    return null;
  }
}

export async function getOperationalSettings() {
  const runtime = readAppRuntimeConfig();

  const [minLeadDaysFromDb, bufferHoursFromDb] = await Promise.all([
    getAppSetting<number>("minimum_lead_time_days_default"),
    getAppSetting<number>("manual_payment_confirmation_buffer_hours"),
  ]);

  return {
    timezone: runtime.timezone,
    minLeadDaysDefault:
      minLeadDaysFromDb ?? runtime.minLeadDaysDefault ?? MIN_LEAD_TIME_DAYS_DEFAULT,
    manualPaymentBufferHours:
      bufferHoursFromDb ??
      runtime.manualPaymentBufferHours ??
      MANUAL_PAYMENT_BUFFER_HOURS_DEFAULT,
  };
}

export async function getActiveDeliveryPricingRule(): Promise<DeliveryPricingRule> {
  const row = await dbFirst<DeliveryRuleRow>(
    `SELECT
      base_fee_cents,
      tier1_rate_cents_per_mile,
      tier2_rate_cents_per_mile,
      max_distance_mi,
      rounding_step_cents,
      minimum_order_enabled,
      minimum_order_amount_delivery_cents,
      minimum_order_amount_pickup_cents
    FROM delivery_pricing_rules
    WHERE is_active = 1
      AND effective_from_utc <= CURRENT_TIMESTAMP
      AND (effective_to_utc IS NULL OR effective_to_utc > CURRENT_TIMESTAMP)
    ORDER BY effective_from_utc DESC
    LIMIT 1`,
  );

  if (!row) {
    return DEFAULT_DELIVERY_PRICING_RULE;
  }

  return {
    baseFeeCents: row.base_fee_cents,
    tier1RateCentsPerMile: row.tier1_rate_cents_per_mile,
    tier2RateCentsPerMile: row.tier2_rate_cents_per_mile,
    maxDistanceMiles: row.max_distance_mi,
    roundingStepCents: row.rounding_step_cents,
    minimumOrderEnabled: row.minimum_order_enabled === 1,
    minimumOrderAmountDeliveryCents: row.minimum_order_amount_delivery_cents,
    minimumOrderAmountPickupCents: row.minimum_order_amount_pickup_cents,
  };
}

export async function getActiveTaxRateBps(): Promise<number> {
  const row = await dbFirst<TaxRuleRow>(
    `SELECT tax_rate_bps
    FROM tax_rules
    WHERE is_active = 1
      AND effective_from_utc <= CURRENT_TIMESTAMP
      AND (effective_to_utc IS NULL OR effective_to_utc > CURRENT_TIMESTAMP)
    ORDER BY effective_from_utc DESC
    LIMIT 1`,
  );

  return row?.tax_rate_bps ?? DEFAULT_TAX_RATE_BPS;
}

export async function getBlackoutDateSet(): Promise<Set<string>> {
  const rows = await dbAll<{ date_local: string }>(
    `SELECT date_local
    FROM blackout_dates
    WHERE is_active = 1`,
  );

  return new Set(rows.map((row) => row.date_local));
}
