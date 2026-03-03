import { NextRequest, NextResponse } from "next/server";

import { listTimeslotsForCart } from "@/lib/orders";

export async function GET(request: NextRequest) {
  const fulfillmentType = request.nextUrl.searchParams.get("fulfillmentType");
  const itemsRaw = request.nextUrl.searchParams.get("items");

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
    const timeslots = await listTimeslotsForCart(fulfillmentType, items);
    return NextResponse.json({ timeslots });
  } catch {
    return NextResponse.json({ error: "Invalid items payload." }, { status: 400 });
  }
}
