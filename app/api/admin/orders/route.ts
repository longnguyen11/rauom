import { NextRequest, NextResponse } from "next/server";

import { isAdminAuthorizedForRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { listAdminOrders } from "@/lib/orders";

export async function GET(request: NextRequest) {
  const authorized = await isAdminAuthorizedForRequest(request);
  if (!authorized) {
    return unauthorizedResponse();
  }

  const orders = await listAdminOrders(200);
  return NextResponse.json({ orders });
}
