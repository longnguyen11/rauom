import { NextRequest, NextResponse } from "next/server";

import { listLiveDishes } from "@/lib/dishes";

export async function GET(request: NextRequest) {
  const tag = request.nextUrl.searchParams.get("tag") ?? undefined;
  const dishes = await listLiveDishes(tag ?? undefined);

  return NextResponse.json({ dishes });
}
