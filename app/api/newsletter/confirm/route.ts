import { NextRequest, NextResponse } from "next/server";

import { confirmSubscriberByToken } from "@/lib/subscribers";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }

  const ok = await confirmSubscriberByToken(token);
  if (!ok) {
    return NextResponse.json({ error: "Invalid or expired token." }, { status: 400 });
  }

  return NextResponse.json({ message: "Subscription confirmed." });
}
