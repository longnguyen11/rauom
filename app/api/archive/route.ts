import { NextResponse } from "next/server";

import { listArchivedDishes } from "@/lib/dishes";

export async function GET() {
  const dishes = await listArchivedDishes();
  return NextResponse.json({ dishes });
}
