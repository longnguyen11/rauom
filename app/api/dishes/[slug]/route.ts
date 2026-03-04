import { NextRequest, NextResponse } from "next/server";

import { getDishBySlug } from "@/lib/dishes";
import { normalizeLocale } from "@/lib/i18n-dictionary";

interface RouteProps {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  const { slug } = await params;
  const locale = normalizeLocale(request.nextUrl.searchParams.get("locale"));
  const dish = await getDishBySlug(slug, locale);

  if (!dish) {
    return NextResponse.json({ error: "Dish not found." }, { status: 404 });
  }

  return NextResponse.json({ dish });
}
