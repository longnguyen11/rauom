import { NextResponse } from "next/server";

import { getDishBySlug } from "@/lib/dishes";

interface RouteProps {
  params: Promise<{ slug: string }>;
}

export async function GET(_: Request, { params }: RouteProps) {
  const { slug } = await params;
  const dish = await getDishBySlug(slug);

  if (!dish) {
    return NextResponse.json({ error: "Dish not found." }, { status: 404 });
  }

  return NextResponse.json({ dish });
}
