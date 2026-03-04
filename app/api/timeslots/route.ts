import { NextRequest, NextResponse } from "next/server";

import { listTimeslotsForCart } from "@/lib/orders";

export async function GET(request: NextRequest) {
  const fulfillmentType = request.nextUrl.searchParams.get("fulfillmentType");
  const itemsRaw = request.nextUrl.searchParams.get("items");
  const daysAheadRaw = request.nextUrl.searchParams.get("daysAhead");

  if (fulfillmentType !== "delivery" && fulfillmentType !== "pickup") {
    return NextResponse.json(
      { error: "fulfillmentType must be delivery or pickup." },
      { status: 400 },
    );
  }

  if (!itemsRaw) {
    return NextResponse.json({ timeslots: [] });
  }

  try {
    const items = JSON.parse(itemsRaw) as Array<{ dishId: string; quantity: number }>;
    const parsedDaysAhead = Number(daysAheadRaw ?? "60");
    const daysAhead =
      Number.isFinite(parsedDaysAhead) && parsedDaysAhead >= 14
        ? Math.min(Math.floor(parsedDaysAhead), 180)
        : 60;

    const timeslots = await listTimeslotsForCart(fulfillmentType, items, daysAhead);
    return NextResponse.json({ timeslots });
  } catch {
    return NextResponse.json({ error: "Invalid items payload." }, { status: 400 });
  }
}
