import { NextRequest, NextResponse } from "next/server";

import { listArchivedDishes } from "@/lib/dishes";
import { normalizeLocale } from "@/lib/i18n-dictionary";

export async function GET(request: NextRequest) {
  const locale = normalizeLocale(request.nextUrl.searchParams.get("locale"));
  const dishes = await listArchivedDishes(locale);
  return NextResponse.json({ dishes });
}
