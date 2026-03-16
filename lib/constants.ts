export const BRAND_NAME = "Rau Om";
export const BRAND_SUBTITLE = "Weekly Batch-Cooked Vietnamese Home Meals in Orlando";

export const ORIGIN_ADDRESS_DEFAULT = "720 Orange Ave, Longwood, FL 32750";
export const ORIGIN_LAT_DEFAULT = 28.7001;
export const ORIGIN_LNG_DEFAULT = -81.3496;

export const APP_TIMEZONE = "America/New_York";

export const MIN_LEAD_TIME_DAYS_DEFAULT = 1;
export const MANUAL_PAYMENT_BUFFER_HOURS_DEFAULT = 12;
export const MAX_DELIVERY_DISTANCE_MI_DEFAULT = 30;

export const DELIVERY_BASE_FEE_CENTS_DEFAULT = 400;
export const DELIVERY_TIER1_RATE_CENTS_PER_MILE_DEFAULT = 90;
export const DELIVERY_TIER2_RATE_CENTS_PER_MILE_DEFAULT = 65;
export const DELIVERY_FEE_ROUNDING_STEP_CENTS_DEFAULT = 50;

export const PAYMENT_METHODS = ["cash", "zelle", "venmo"] as const;

export const DIETARY_TAG_ORDER = [
  "vegan",
  "vegetarian",
  "gluten_free",
  "dairy_free",
  "spicy",
] as const;

export const DEFAULT_TAX_RATE_BPS = 650;
