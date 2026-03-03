import { NextRequest, NextResponse } from "next/server";

import { createOrder } from "@/lib/orders";

function readClientIp(request: NextRequest): string | null {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) {
    return cfIp;
  }

  const forwarded = request.headers.get("x-forwarded-for");
  if (!forwarded) {
    return null;
  }

  return forwarded.split(",")[0]?.trim() ?? null;
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as Parameters<typeof createOrder>[0];
    const ipAddress = readClientIp(request);
    const order = await createOrder(payload, ipAddress);
    return NextResponse.json({ order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Order submission failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
