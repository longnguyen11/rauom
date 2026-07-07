import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  isMenuSettingsAuthorizedForRequest,
  menuSettingsUnauthorizedResponse,
} from "@/lib/menu-settings-auth";
import { listTemporaryMenuDishes, saveTemporaryMenuDishes } from "@/lib/menu";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const imageUrlSchema = z
  .string()
  .max(1_500_000)
  .refine(
    (value) =>
      value.length === 0 ||
      value.startsWith("/") ||
      value.startsWith("https://") ||
      value.startsWith("http://") ||
      value.startsWith("data:image/"),
    "Image must be a site path, URL, or uploaded image.",
  );

const temporaryDishSchema = z.object({
  slot: z.union([z.literal(1), z.literal(2)]),
  isActive: z.boolean(),
  nameEn: z.string().min(1).max(120),
  nameVi: z.string().min(1).max(120),
  descriptionEn: z.string().min(1).max(420),
  descriptionVi: z.string().min(1).max(420),
  priceEn: z.string().min(1).max(60),
  priceVi: z.string().min(1).max(60),
  deliveryDate: dateSchema,
  orderDeadline: dateSchema,
  imageUrl: imageUrlSchema,
  imageAltEn: z.string().min(1).max(160),
  imageAltVi: z.string().min(1).max(160),
});

const saveSchema = z.object({
  temporaryDishes: z
    .array(temporaryDishSchema)
    .length(2)
    .refine(
      (dishes) => new Set(dishes.map((dish) => dish.slot)).size === 2,
      "Exactly one dish for slot 1 and slot 2 is required.",
    ),
});

export async function GET(request: NextRequest) {
  if (!isMenuSettingsAuthorizedForRequest(request)) {
    return menuSettingsUnauthorizedResponse();
  }

  const temporaryDishes = await listTemporaryMenuDishes();
  return NextResponse.json({ temporaryDishes });
}

export async function PUT(request: NextRequest) {
  if (!isMenuSettingsAuthorizedForRequest(request)) {
    return menuSettingsUnauthorizedResponse();
  }

  try {
    const payload = saveSchema.parse(await request.json());
    const temporaryDishes = await saveTemporaryMenuDishes(payload.temporaryDishes);
    return NextResponse.json({ ok: true, temporaryDishes });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save menu.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
