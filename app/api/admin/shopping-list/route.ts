import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { isAdminAuthorizedForRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { getAdminShoppingList } from "@/lib/orders";
import type { OrderStatus } from "@/lib/types";

const shoppingStatusSchema = z.enum([
  "pending_confirmation",
  "confirmed",
  "preparing",
]);

export async function GET(request: NextRequest) {
  const authorized = await isAdminAuthorizedForRequest(request);
  if (!authorized) {
    return unauthorizedResponse();
  }

  try {
    const statuses = request.nextUrl.searchParams
      .getAll("status")
      .map((status) => shoppingStatusSchema.parse(status)) as OrderStatus[];

    const summary = await getAdminShoppingList(statuses);
    return NextResponse.json({ summary });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load shopping list.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

