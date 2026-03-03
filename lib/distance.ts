import { nanoid } from "nanoid";

import { getEnv, readAppRuntimeConfig } from "@/lib/cloudflare";
import { dbAll, dbRun } from "@/lib/db";
import {
  calculateDeliveryFeeCents,
  type DeliveryPricingRule,
} from "@/lib/pricing";
import type { DeliveryAddress, DeliveryQuote } from "@/lib/types";

interface CachedQuoteRow {
  id: string;
  distance_mi: number;
  duration_min: number;
  provider: string;
  expires_at_utc: string;
}

function normalizeAddress(address: DeliveryAddress): string {
  return [
    address.line1,
    address.line2 ?? "",
    address.city,
    address.state,
    address.zip,
  ]
    .join(",")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

async function getCachedQuote(
  originHash: string,
  destinationHash: string,
): Promise<CachedQuoteRow | null> {
  const rows = await dbAll<CachedQuoteRow>(
    `SELECT id, distance_mi, duration_min, provider, expires_at_utc
     FROM distance_quote_cache
     WHERE origin_hash = ?
       AND destination_hash = ?
       AND expires_at_utc > CURRENT_TIMESTAMP
     LIMIT 1`,
    [originHash, destinationHash],
  );

  return rows[0] ?? null;
}

async function cacheQuote(
  originHash: string,
  destinationHash: string,
  quote: { distanceMiles: number; durationMinutes: number; provider: string },
): Promise<void> {
  await dbRun(
    `INSERT INTO distance_quote_cache (
      id,
      origin_hash,
      destination_hash,
      distance_mi,
      duration_min,
      provider,
      quoted_at_utc,
      expires_at_utc
    ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, datetime('now', '+24 hours'))
    ON CONFLICT(origin_hash, destination_hash)
    DO UPDATE SET
      distance_mi = excluded.distance_mi,
      duration_min = excluded.duration_min,
      provider = excluded.provider,
      quoted_at_utc = CURRENT_TIMESTAMP,
      expires_at_utc = datetime('now', '+24 hours')`,
    [
      `quote_${nanoid(12)}`,
      originHash,
      destinationHash,
      quote.distanceMiles,
      quote.durationMinutes,
      quote.provider,
    ],
  );
}

interface GeocodeResponse {
  features?: Array<{
    geometry?: {
      coordinates?: [number, number];
    };
  }>;
}

interface DirectionsResponse {
  routes?: Array<{
    distance?: number;
    duration?: number;
  }>;
}

async function fetchMapboxRouteMiles(
  originLng: number,
  originLat: number,
  address: DeliveryAddress,
  accessToken: string,
): Promise<{ distanceMiles: number; durationMinutes: number; lat: number; lng: number }> {
  const query = encodeURIComponent(
    `${address.line1}, ${address.city}, ${address.state} ${address.zip}`,
  );

  const geocodeUrl = `https://api.mapbox.com/search/geocode/v6/forward?q=${query}&limit=1&access_token=${accessToken}`;
  const geocodeResponse = await fetch(geocodeUrl);

  if (!geocodeResponse.ok) {
    throw new Error("Address validation failed. Please verify your address and try again.");
  }

  const geocodeJson = (await geocodeResponse.json()) as GeocodeResponse;
  const point = geocodeJson.features?.[0]?.geometry?.coordinates;

  if (!point || point.length !== 2) {
    throw new Error("We could not validate this address. Please try a more specific address.");
  }

  const [destinationLng, destinationLat] = point;

  const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${originLng},${originLat};${destinationLng},${destinationLat}?alternatives=false&overview=false&access_token=${accessToken}`;

  const directionsResponse = await fetch(directionsUrl);

  if (!directionsResponse.ok) {
    throw new Error("Delivery quote is temporarily unavailable. Please try again.");
  }

  const directionsJson = (await directionsResponse.json()) as DirectionsResponse;
  const route = directionsJson.routes?.[0];
  if (!route?.distance) {
    throw new Error("Delivery quote is temporarily unavailable. Please try again.");
  }

  return {
    distanceMiles: route.distance / 1609.344,
    durationMinutes: (route.duration ?? 0) / 60,
    lat: destinationLat,
    lng: destinationLng,
  };
}

export async function quoteDeliveryForAddress(
  deliveryAddress: DeliveryAddress,
  pricingRule: DeliveryPricingRule,
): Promise<DeliveryQuote> {
  const env = getEnv();
  const runtime = readAppRuntimeConfig();

  if (!env.MAPBOX_ACCESS_TOKEN) {
    throw new Error(
      "MAPBOX_ACCESS_TOKEN is not configured. Add it to your Cloudflare environment to enable delivery quotes.",
    );
  }

  const normalizedDestination = normalizeAddress(deliveryAddress);
  const originHash = await sha256Hex(runtime.originAddress.toLowerCase());
  const destinationHash = await sha256Hex(normalizedDestination);

  const cached = await getCachedQuote(originHash, destinationHash);
  if (cached) {
    return {
      distanceMiles: cached.distance_mi,
      durationMinutes: cached.duration_min,
      deliveryFeeCents: calculateDeliveryFeeCents(cached.distance_mi, pricingRule),
      distanceSource: `cache:${cached.provider}`,
    };
  }

  const route = await fetchMapboxRouteMiles(
    runtime.originLng,
    runtime.originLat,
    deliveryAddress,
    env.MAPBOX_ACCESS_TOKEN,
  );

  const roundedDistance = Math.round(route.distanceMiles * 10) / 10;
  const roundedDuration = Math.round(route.durationMinutes * 10) / 10;

  await cacheQuote(originHash, destinationHash, {
    distanceMiles: roundedDistance,
    durationMinutes: roundedDuration,
    provider: "mapbox",
  });

  return {
    distanceMiles: roundedDistance,
    durationMinutes: roundedDuration,
    deliveryFeeCents: calculateDeliveryFeeCents(roundedDistance, pricingRule),
    distanceSource: "mapbox",
    destinationLat: route.lat,
    destinationLng: route.lng,
  };
}
