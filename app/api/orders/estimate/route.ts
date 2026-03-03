import { NextResponse } from "next/server";

import { estimateOrder } from "@/lib/orders";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Parameters<typeof estimateOrder>[0];
    const estimate = await estimateOrder(payload);
    return NextResponse.json(estimate);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Estimate failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
