import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

import { isAdminAuthorizedForRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { listAllDishesForAdmin, upsertDish } from "@/lib/dishes";

const createSchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(3).max(120),
  name: z.string().min(2).max(120),
  nameVi: z.string().min(2).max(120).optional(),
  shortDescription: z.string().min(8).max(220),
  shortDescriptionVi: z.string().min(8).max(220).optional(),
  longDescription: z.string().min(8).max(1200),
  longDescriptionVi: z.string().min(8).max(1200).optional(),
  priceCents: z.number().int().min(100).max(50000),
  leadTimeDays: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  status: z.enum(["draft", "scheduled", "live", "archived", "sold_out"]),
  imageUrl: z.string().url().max(1200).optional(),
  imageAltText: z.string().min(2).max(220).optional(),
  ingredients: z
    .array(
      z.object({
        name: z.string().min(1).max(120),
        isAllergen: z.boolean(),
      }),
    )
    .default([]),
});

export async function GET(request: NextRequest) {
  const authorized = await isAdminAuthorizedForRequest(request);
  if (!authorized) {
    return unauthorizedResponse();
  }

  const dishes = await listAllDishesForAdmin();
  return NextResponse.json({ dishes });
}

export async function POST(request: NextRequest) {
  const authorized = await isAdminAuthorizedForRequest(request);
  if (!authorized) {
    return unauthorizedResponse();
  }

  try {
    const payload = createSchema.parse(await request.json());
    await upsertDish(payload);
    const dishes = await listAllDishesForAdmin();
    return NextResponse.json({ ok: true, dishes });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save dish.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
