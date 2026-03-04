import { NextResponse } from "next/server";

import { getEnv } from "@/lib/cloudflare";

interface MapboxContextItem {
  id?: string;
  text?: string;
  short_code?: string;
}

interface MapboxFeature {
  id: string;
  place_name?: string;
  text?: string;
  address?: string;
  context?: MapboxContextItem[];
}

interface MapboxResponse {
  features?: MapboxFeature[];
}

interface AddressSuggestion {
  id: string;
  display: string;
  line1: string;
  city: string;
  state: string;
  zip: string;
}

function extractZip(display: string): string {
  const match = display.match(/\b\d{5}(?:-\d{4})?\b/);
  return match?.[0]?.trim() ?? "";
}

function extractCityState(display: string): { city: string; state: string } {
  const parts = display.split(",").map((part) => part.trim()).filter(Boolean);
  const city = parts[1] ?? "";
  const statePart = parts[2] ?? "";
  const state = statePart.split(" ")[0]?.trim() ?? "";
  return { city, state };
}

function readContext(
  feature: MapboxFeature,
  prefixes: string[],
): MapboxContextItem | undefined {
  return feature.context?.find((item) =>
    prefixes.some((prefix) => item.id?.startsWith(prefix)),
  );
}

function toSuggestion(feature: MapboxFeature): AddressSuggestion | null {
  const display = feature.place_name?.trim() ?? "";
  const line1 =
    feature.address && feature.text
      ? `${feature.address} ${feature.text}`.trim()
      : (feature.text?.trim() ?? display.split(",")[0]?.trim() ?? "");

  const cityContext = readContext(feature, ["place", "locality", "district"]);
  const regionContext = readContext(feature, ["region"]);
  const zipContext = readContext(feature, ["postcode"]);
  const fallback = extractCityState(display);

  const city = cityContext?.text?.trim() ?? fallback.city;
  const regionShortCode = regionContext?.short_code?.split("-")[1]?.trim() ?? "";
  const state = regionShortCode || regionContext?.text?.trim() || fallback.state;
  const zip = zipContext?.text?.trim() ?? extractZip(display);

  if (!display || !line1 || !city || !state || !zip) {
    return null;
  }

  return {
    id: feature.id,
    display,
    line1,
    city,
    state,
    zip,
  };
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  const accessToken = getEnv().MAPBOX_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json({
      error:
        "Address autocomplete is not configured yet. Add MAPBOX_ACCESS_TOKEN to your local .dev.vars and Cloudflare Worker secrets.",
      suggestions: [],
    });
  }

  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/` +
    `${encodeURIComponent(query)}.json?autocomplete=true&limit=6&country=US&types=address&access_token=${accessToken}`;

  const response = await fetch(url);
  if (!response.ok) {
    return NextResponse.json(
      { error: "Address suggestions are temporarily unavailable.", suggestions: [] },
      { status: 502 },
    );
  }

  const json = (await response.json()) as MapboxResponse;
  const suggestions = (json.features ?? [])
    .map((feature) => toSuggestion(feature))
    .filter((entry): entry is AddressSuggestion => Boolean(entry));

  return NextResponse.json({ suggestions });
}
