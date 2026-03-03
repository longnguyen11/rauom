import { getCloudflareContext } from "@opennextjs/cloudflare";

import {
  APP_TIMEZONE,
  MANUAL_PAYMENT_BUFFER_HOURS_DEFAULT,
  MAX_DELIVERY_DISTANCE_MI_DEFAULT,
  MIN_LEAD_TIME_DAYS_DEFAULT,
  ORIGIN_ADDRESS_DEFAULT,
  ORIGIN_LAT_DEFAULT,
  ORIGIN_LNG_DEFAULT,
} from "@/lib/constants";

export interface AppEnv {
  DB: D1Database;
  DISH_IMAGES_BUCKET?: R2Bucket;
  NEXTJS_ENV?: string;
  ORIGIN_ADDRESS?: string;
  ORIGIN_LAT?: string;
  ORIGIN_LNG?: string;
  TIMEZONE?: string;
  MIN_LEAD_TIME_DAYS_DEFAULT?: string;
  MANUAL_PAYMENT_BUFFER_HOURS?: string;
  MAX_DELIVERY_DISTANCE_MI?: string;
  MAPBOX_ACCESS_TOKEN?: string;
  TURNSTILE_SECRET_KEY?: string;
  ADMIN_ACCESS_TOKEN?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  RESEND_OWNER_EMAIL?: string;
}

export function getEnv(): Partial<AppEnv> {
  try {
    const { env } = getCloudflareContext();
    return env as Partial<AppEnv>;
  } catch {
    return {};
  }
}

export function getRequiredDb(): D1Database {
  const env = getEnv();
  if (!env.DB) {
    throw new Error(
      "D1 binding `DB` is missing. Run via `npm run preview` with wrangler bindings configured.",
    );
  }
  return env.DB;
}

export function getOptionalDb(): D1Database | null {
  const env = getEnv();
  return env.DB ?? null;
}

export function readAppRuntimeConfig() {
  const env = getEnv();

  return {
    originAddress: env.ORIGIN_ADDRESS ?? ORIGIN_ADDRESS_DEFAULT,
    originLat: Number(env.ORIGIN_LAT ?? ORIGIN_LAT_DEFAULT),
    originLng: Number(env.ORIGIN_LNG ?? ORIGIN_LNG_DEFAULT),
    timezone: env.TIMEZONE ?? APP_TIMEZONE,
    minLeadDaysDefault: Number(
      env.MIN_LEAD_TIME_DAYS_DEFAULT ?? MIN_LEAD_TIME_DAYS_DEFAULT,
    ),
    manualPaymentBufferHours: Number(
      env.MANUAL_PAYMENT_BUFFER_HOURS ?? MANUAL_PAYMENT_BUFFER_HOURS_DEFAULT,
    ),
    maxDeliveryDistanceMiles: Number(
      env.MAX_DELIVERY_DISTANCE_MI ?? MAX_DELIVERY_DISTANCE_MI_DEFAULT,
    ),
  };
}
