import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

import { isAdminAuthorizedForRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { updateDishStatus } from "@/lib/dishes";

const schema = z.object({
  status: z.enum(["draft", "scheduled", "live", "archived", "sold_out"]),
});

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteProps) {
  const authorized = await isAdminAuthorizedForRequest(request);
  if (!authorized) {
    return unauthorizedResponse();
  }

  const { id } = await params;

  try {
    const payload = schema.parse(await request.json());
    await updateDishStatus(id, payload.status);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update dish.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
