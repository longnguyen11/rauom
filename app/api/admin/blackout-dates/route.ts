import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

import { isAdminAuthorizedForRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { blockOutDate, listBlackoutDates, unblockDate } from "@/lib/settings";

const schema = z.object({
  dateLocal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().max(200).optional(),
});

export async function GET(request: NextRequest) {
  const authorized = await isAdminAuthorizedForRequest(request);
  if (!authorized) {
    return unauthorizedResponse();
  }

  const blackoutDates = await listBlackoutDates();
  return NextResponse.json({ blackoutDates });
}

export async function POST(request: NextRequest) {
  const authorized = await isAdminAuthorizedForRequest(request);
  if (!authorized) {
    return unauthorizedResponse();
  }

  try {
    const payload = schema.parse(await request.json());
    const blackoutDate = await blockOutDate(payload);
    const blackoutDates = await listBlackoutDates();
    return NextResponse.json({ blackoutDate, blackoutDates });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not block date.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const authorized = await isAdminAuthorizedForRequest(request);
  if (!authorized) {
    return unauthorizedResponse();
  }

  try {
    const payload = schema.pick({ dateLocal: true }).parse(await request.json());
    await unblockDate(payload.dateLocal);
    const blackoutDates = await listBlackoutDates();
    return NextResponse.json({ ok: true, blackoutDates });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not unblock date.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
