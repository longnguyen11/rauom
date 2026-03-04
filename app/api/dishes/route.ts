import { NextRequest, NextResponse } from "next/server";

import { listLiveDishes } from "@/lib/dishes";
import { normalizeLocale } from "@/lib/i18n-dictionary";

export async function GET(request: NextRequest) {
  const tag = request.nextUrl.searchParams.get("tag") ?? undefined;
  const locale = normalizeLocale(request.nextUrl.searchParams.get("locale"));
  const dishes = await listLiveDishes(tag ?? undefined, locale);

  return NextResponse.json({ dishes });
}
