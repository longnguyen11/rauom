import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

import { isAdminAuthorizedForRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { listAdminOrders, updateOrderStatus } from "@/lib/orders";
import type { OrderStatus } from "@/lib/types";

const schema = z.object({
  status: z.enum([
    "new",
    "pending_confirmation",
    "confirmed",
    "preparing",
    "completed",
    "cancelled",
  ]),
  notes: z.string().max(1000).optional(),
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
    await updateOrderStatus(id, payload.status as OrderStatus, "admin", payload.notes);

    const orders = await listAdminOrders(200);
    const order = orders.find((entry) => entry.id === id);

    return NextResponse.json({ ok: true, order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update order.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
