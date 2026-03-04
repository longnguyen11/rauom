import { dbAll, dbFirst, dbRun } from "@/lib/db";
import type { Locale } from "@/lib/i18n-dictionary";
import { MOCK_DISHES } from "@/lib/mock-data";
import type { Dish } from "@/lib/types";

interface DishRow {
  id: string;
  slug: string;
  name: string;
  name_vi: string | null;
  short_description: string;
  short_description_vi: string | null;
  long_description: string;
  long_description_vi: string | null;
  category: Dish["category"] | null;
  bulk_discount_tiers_json: string | null;
  price_cents: number;
  currency: string;
  status: Dish["status"];
  lead_time_days: number;
  is_featured_week: number;
  available_from_utc: string | null;
  available_to_utc: string | null;
  created_at_utc: string;
  updated_at_utc: string;
}

interface DishImageRow {
  id: string;
  dish_id: string;
  url: string;
  alt_text: string;
  sort_order: number;
}

interface IngredientRow {
  dish_id: string;
  name: string;
  is_allergen: number;
}

interface DietaryRow {
  dish_id: string;
  code: string;
  label: string;
}

interface NutritionRow {
  dish_id: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  sodium_mg: number | null;
  notes: string | null;
}

function normalizeDishBulkDiscountTiers(
  tiers: Dish["bulkDiscountTiers"] | undefined,
): Dish["bulkDiscountTiers"] {
  if (!tiers || tiers.length === 0) {
    return [];
  }

  return tiers
    .map((tier) => ({
      minQuantity: Math.max(2, Math.floor(tier.minQuantity)),
      discountPercent: Math.max(1, Math.min(90, Math.floor(tier.discountPercent))),
    }))
    .filter((tier) => Number.isFinite(tier.minQuantity) && Number.isFinite(tier.discountPercent))
    .sort((a, b) => a.minQuantity - b.minQuantity);
}

function parseBulkDiscountTiers(
  value: string | null | undefined,
): Dish["bulkDiscountTiers"] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as Array<{
      minQuantity?: number;
      discountPercent?: number;
    }>;

    return normalizeDishBulkDiscountTiers(
      parsed.map((tier) => ({
        minQuantity: Number(tier.minQuantity ?? 0),
        discountPercent: Number(tier.discountPercent ?? 0),
      })),
    );
  } catch {
    return [];
  }
}

function mapDishRows(
  dishRows: DishRow[],
  imageRows: DishImageRow[],
  ingredientRows: IngredientRow[],
  dietaryRows: DietaryRow[],
  nutritionRows: NutritionRow[],
): Dish[] {
  const imagesByDish = new Map<string, DishImageRow[]>();
  for (const row of imageRows) {
    const list = imagesByDish.get(row.dish_id) ?? [];
    list.push(row);
    imagesByDish.set(row.dish_id, list);
  }

  const ingredientsByDish = new Map<string, IngredientRow[]>();
  for (const row of ingredientRows) {
    const list = ingredientsByDish.get(row.dish_id) ?? [];
    list.push(row);
    ingredientsByDish.set(row.dish_id, list);
  }

  const dietaryByDish = new Map<string, DietaryRow[]>();
  for (const row of dietaryRows) {
    const list = dietaryByDish.get(row.dish_id) ?? [];
    list.push(row);
    dietaryByDish.set(row.dish_id, list);
  }

  const nutritionByDish = new Map<string, NutritionRow>();
  for (const row of nutritionRows) {
    nutritionByDish.set(row.dish_id, row);
  }

  return dishRows.map((row) => {
    const nutrition = nutritionByDish.get(row.id);

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      nameVi: row.name_vi,
      shortDescription: row.short_description,
      shortDescriptionVi: row.short_description_vi,
      longDescription: row.long_description,
      longDescriptionVi: row.long_description_vi,
      category: row.category ?? "main",
      bulkDiscountTiers: parseBulkDiscountTiers(row.bulk_discount_tiers_json),
      priceCents: row.price_cents,
      currency: row.currency,
      status: row.status,
      leadTimeDays: row.lead_time_days,
      isFeaturedWeek: row.is_featured_week === 1,
      availableFromUtc: row.available_from_utc,
      availableToUtc: row.available_to_utc,
      createdAtUtc: row.created_at_utc,
      updatedAtUtc: row.updated_at_utc,
      images: (imagesByDish.get(row.id) ?? [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((image) => ({
          id: image.id,
          url: image.url,
          altText: image.alt_text,
          sortOrder: image.sort_order,
        })),
      ingredients: (ingredientsByDish.get(row.id) ?? []).map((ingredient) => ({
        name: ingredient.name,
        isAllergen: ingredient.is_allergen === 1,
      })),
      dietaryTags: (dietaryByDish.get(row.id) ?? []).map((tag) => ({
        code: tag.code,
        label: tag.label,
      })),
      nutrition: nutrition
        ? {
            calories: nutrition.calories,
            proteinG: nutrition.protein_g,
            carbsG: nutrition.carbs_g,
            fatG: nutrition.fat_g,
            sodiumMg: nutrition.sodium_mg,
            notes: nutrition.notes,
          }
        : null,
    };
  });
}

function localizeDish(dish: Dish, locale?: Locale): Dish {
  if (locale !== "vi") {
    return dish;
  }

  return {
    ...dish,
    name: dish.nameVi?.trim() || dish.name,
    shortDescription: dish.shortDescriptionVi?.trim() || dish.shortDescription,
    longDescription: dish.longDescriptionVi?.trim() || dish.longDescription,
  };
}

async function loadDishesFromDb(statuses: Dish["status"][]): Promise<Dish[]> {
  const placeholders = statuses.map(() => "?").join(", ");
  let dishRows: DishRow[] = [];
  try {
    dishRows = await dbAll<DishRow>(
      `SELECT
        id,
        slug,
        name,
        name_vi,
        short_description,
        short_description_vi,
        long_description,
        long_description_vi,
        category,
        bulk_discount_tiers_json,
        price_cents,
        currency,
        status,
        lead_time_days,
        is_featured_week,
        available_from_utc,
        available_to_utc,
        created_at_utc,
        updated_at_utc
      FROM dishes
      WHERE status IN (${placeholders})
      ORDER BY is_featured_week DESC, updated_at_utc DESC`,
      statuses,
    );
  } catch {
    try {
      dishRows = await dbAll<DishRow>(
        `SELECT
          id,
          slug,
          name,
          name_vi,
          short_description,
          short_description_vi,
          long_description,
          long_description_vi,
          'main' AS category,
          '[]' AS bulk_discount_tiers_json,
          price_cents,
          currency,
          status,
          lead_time_days,
          is_featured_week,
          available_from_utc,
          available_to_utc,
          created_at_utc,
          updated_at_utc
        FROM dishes
        WHERE status IN (${placeholders})
        ORDER BY is_featured_week DESC, updated_at_utc DESC`,
        statuses,
      );
    } catch {
      dishRows = await dbAll<DishRow>(
        `SELECT
          id,
          slug,
          name,
          NULL AS name_vi,
          short_description,
          NULL AS short_description_vi,
          long_description,
          NULL AS long_description_vi,
          'main' AS category,
          '[]' AS bulk_discount_tiers_json,
          price_cents,
          currency,
          status,
          lead_time_days,
          is_featured_week,
          available_from_utc,
          available_to_utc,
          created_at_utc,
          updated_at_utc
        FROM dishes
        WHERE status IN (${placeholders})
        ORDER BY is_featured_week DESC, updated_at_utc DESC`,
        statuses,
      );
    }
  }

  if (dishRows.length === 0) {
    return [];
  }

  const dishIds = dishRows.map((dish) => dish.id);
  const idPlaceholders = dishIds.map(() => "?").join(", ");

  const [imageRows, ingredientRows, dietaryRows, nutritionRows] = await Promise.all([
    dbAll<DishImageRow>(
      `SELECT id, dish_id, url, alt_text, sort_order
       FROM dish_images
       WHERE dish_id IN (${idPlaceholders})`,
      dishIds,
    ),
    dbAll<IngredientRow>(
      `SELECT dish_id, name, is_allergen
       FROM ingredients
       WHERE dish_id IN (${idPlaceholders})`,
      dishIds,
    ),
    dbAll<DietaryRow>(
      `SELECT dd.dish_id, dt.code, dt.label
       FROM dish_dietary_tags dd
       JOIN dietary_tags dt ON dt.id = dd.dietary_tag_id
       WHERE dd.dish_id IN (${idPlaceholders})`,
      dishIds,
    ),
    dbAll<NutritionRow>(
      `SELECT dish_id, calories, protein_g, carbs_g, fat_g, sodium_mg, notes
       FROM dish_nutrition
       WHERE dish_id IN (${idPlaceholders})`,
      dishIds,
    ),
  ]);

  return mapDishRows(dishRows, imageRows, ingredientRows, dietaryRows, nutritionRows);
}

export async function listLiveDishes(tagCode?: string, locale?: Locale): Promise<Dish[]> {
  const dbDishes = await loadDishesFromDb(["live"]);
  const source = dbDishes.length > 0 ? dbDishes : MOCK_DISHES.filter((dish) => dish.status === "live");

  const filtered = tagCode
    ? source.filter((dish) => dish.dietaryTags.some((tag) => tag.code === tagCode))
    : source;

  if (!locale) {
    return filtered;
  }

  return filtered.map((dish) => localizeDish(dish, locale));
}

export async function listArchivedDishes(locale?: Locale): Promise<Dish[]> {
  const dbDishes = await loadDishesFromDb(["archived"]);
  if (dbDishes.length > 0) {
    return locale ? dbDishes.map((dish) => localizeDish(dish, locale)) : dbDishes;
  }

  const archived = MOCK_DISHES.filter((dish) => dish.status === "archived");
  return locale ? archived.map((dish) => localizeDish(dish, locale)) : archived;
}

export async function getDishBySlug(slug: string, locale?: Locale): Promise<Dish | null> {
  const liveAndArchived = await loadDishesFromDb(["live", "archived", "sold_out"]);
  if (liveAndArchived.length > 0) {
    const dish = liveAndArchived.find((entry) => entry.slug === slug) ?? null;
    return dish && locale ? localizeDish(dish, locale) : dish;
  }

  const dish = MOCK_DISHES.find((entry) => entry.slug === slug) ?? null;
  return dish && locale ? localizeDish(dish, locale) : dish;
}

interface UpsertDishInput {
  id?: string;
  slug: string;
  name: string;
  nameVi?: string;
  shortDescription: string;
  shortDescriptionVi?: string;
  longDescription: string;
  longDescriptionVi?: string;
  bulkDiscountTiers?: Dish["bulkDiscountTiers"];
  priceCents: number;
  leadTimeDays: 1 | 2 | 3;
  status: Dish["status"];
  imageUrl?: string;
  imageAltText?: string;
  ingredients?: Array<{
    name: string;
    isAllergen: boolean;
  }>;
}

export async function upsertDish(input: UpsertDishInput): Promise<void> {
  const id = input.id ?? `dish_${crypto.randomUUID()}`;
  const bulkDiscountTiersJson = JSON.stringify(
    normalizeDishBulkDiscountTiers(input.bulkDiscountTiers),
  );

  try {
    await dbRun(
      `INSERT INTO dishes (
        id,
        slug,
        name,
        name_vi,
        short_description,
        short_description_vi,
        long_description,
        long_description_vi,
        bulk_discount_tiers_json,
        price_cents,
        currency,
        status,
        lead_time_days,
        is_featured_week,
        created_at_utc,
        updated_at_utc
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'USD', ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        slug = excluded.slug,
        name = excluded.name,
        name_vi = excluded.name_vi,
        short_description = excluded.short_description,
        short_description_vi = excluded.short_description_vi,
        long_description = excluded.long_description,
        long_description_vi = excluded.long_description_vi,
        bulk_discount_tiers_json = excluded.bulk_discount_tiers_json,
        price_cents = excluded.price_cents,
        status = excluded.status,
        lead_time_days = excluded.lead_time_days,
        updated_at_utc = CURRENT_TIMESTAMP`,
      [
        id,
        input.slug,
        input.name,
        input.nameVi?.trim() || null,
        input.shortDescription,
        input.shortDescriptionVi?.trim() || null,
        input.longDescription,
        input.longDescriptionVi?.trim() || null,
        bulkDiscountTiersJson,
        input.priceCents,
        input.status,
        input.leadTimeDays,
      ],
    );
  } catch {
    try {
      await dbRun(
        `INSERT INTO dishes (
          id,
          slug,
          name,
          name_vi,
          short_description,
          short_description_vi,
          long_description,
          long_description_vi,
          price_cents,
          currency,
          status,
          lead_time_days,
          is_featured_week,
          created_at_utc,
          updated_at_utc
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'USD', ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          slug = excluded.slug,
          name = excluded.name,
          name_vi = excluded.name_vi,
          short_description = excluded.short_description,
          short_description_vi = excluded.short_description_vi,
          long_description = excluded.long_description,
          long_description_vi = excluded.long_description_vi,
          price_cents = excluded.price_cents,
          status = excluded.status,
          lead_time_days = excluded.lead_time_days,
          updated_at_utc = CURRENT_TIMESTAMP`,
        [
          id,
          input.slug,
          input.name,
          input.nameVi?.trim() || null,
          input.shortDescription,
          input.shortDescriptionVi?.trim() || null,
          input.longDescription,
          input.longDescriptionVi?.trim() || null,
          input.priceCents,
          input.status,
          input.leadTimeDays,
        ],
      );
    } catch {
      await dbRun(
        `INSERT INTO dishes (
          id,
          slug,
          name,
          short_description,
          long_description,
          price_cents,
          currency,
          status,
          lead_time_days,
          is_featured_week,
          created_at_utc,
          updated_at_utc
        ) VALUES (?, ?, ?, ?, ?, ?, 'USD', ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          slug = excluded.slug,
          name = excluded.name,
          short_description = excluded.short_description,
          long_description = excluded.long_description,
          price_cents = excluded.price_cents,
          status = excluded.status,
          lead_time_days = excluded.lead_time_days,
          updated_at_utc = CURRENT_TIMESTAMP`,
        [
          id,
          input.slug,
          input.name,
          input.shortDescription,
          input.longDescription,
          input.priceCents,
          input.status,
          input.leadTimeDays,
        ],
      );
    }
  }

  if (input.ingredients) {
    await dbRun(`DELETE FROM ingredients WHERE dish_id = ?`, [id]);

    for (const ingredient of input.ingredients) {
      await dbRun(
        `INSERT INTO ingredients (id, dish_id, name, is_allergen)
         VALUES (?, ?, ?, ?)`,
        [
          `ing_${crypto.randomUUID()}`,
          id,
          ingredient.name,
          ingredient.isAllergen ? 1 : 0,
        ],
      );
    }
  }

  if (typeof input.imageUrl === "string") {
    const imageUrl = input.imageUrl.trim();
    if (imageUrl.length > 0) {
      const imageAltText = input.imageAltText?.trim() || `${input.name} image`;
      const existingImage = await dbFirst<{ id: string }>(
        `SELECT id
         FROM dish_images
         WHERE dish_id = ?
         ORDER BY sort_order ASC, id ASC
         LIMIT 1`,
        [id],
      );

      if (existingImage) {
        await dbRun(
          `UPDATE dish_images
           SET url = ?, alt_text = ?, sort_order = 0
           WHERE id = ?`,
          [imageUrl, imageAltText, existingImage.id],
        );
      } else {
        await dbRun(
          `INSERT INTO dish_images (id, dish_id, url, alt_text, sort_order)
           VALUES (?, ?, ?, ?, 0)`,
          [`img_${crypto.randomUUID()}`, id, imageUrl, imageAltText],
        );
      }
    }
  }
}

export async function updateDishStatus(
  dishId: string,
  status: Dish["status"],
): Promise<void> {
  await dbRun(`UPDATE dishes SET status = ?, updated_at_utc = CURRENT_TIMESTAMP WHERE id = ?`, [
    status,
    dishId,
  ]);
}

export async function listAllDishesForAdmin(): Promise<Dish[]> {
  const dbDishes = await loadDishesFromDb([
    "draft",
    "scheduled",
    "live",
    "archived",
    "sold_out",
  ]);

  if (dbDishes.length > 0) {
    return dbDishes;
  }

  return MOCK_DISHES;
}

export async function getDietaryTagOptions(): Promise<{ code: string; label: string }[]> {
  const rows = await dbAll<{ code: string; label: string }>(
    `SELECT code, label FROM dietary_tags ORDER BY label ASC`,
  );

  if (rows.length > 0) {
    return rows;
  }

  const seen = new Map<string, string>();
  for (const dish of MOCK_DISHES) {
    for (const tag of dish.dietaryTags) {
      seen.set(tag.code, tag.label);
    }
  }

  return [...seen.entries()].map(([code, label]) => ({ code, label }));
}

export async function mapDishesById(dishIds: string[]): Promise<Map<string, Dish>> {
  if (dishIds.length === 0) {
    return new Map();
  }

  const allLive = await loadDishesFromDb(["live", "sold_out", "archived"]);
  const source = allLive.length > 0 ? allLive : MOCK_DISHES;

  const result = new Map<string, Dish>();
  for (const dish of source) {
    if (dishIds.includes(dish.id)) {
      result.set(dish.id, dish);
    }
  }

  return result;
}

export async function mapDishesBySlug(): Promise<Map<string, Dish>> {
  const all = await loadDishesFromDb(["live", "sold_out", "archived"]);
  const source = all.length > 0 ? all : MOCK_DISHES;

  return new Map(source.map((dish) => [dish.slug, dish]));
}

export async function getFeaturedDishes(limit = 3, locale?: Locale): Promise<Dish[]> {
  const all = await listLiveDishes(undefined, locale);
  const featured = all.filter((dish) => dish.isFeaturedWeek);
  if (featured.length > 0) {
    return featured.slice(0, limit);
  }
  return all.slice(0, limit);
}

export async function getSeoDishSlugs(): Promise<string[]> {
  const rows = await dbAll<{ slug: string }>(
    `SELECT slug FROM dishes WHERE status IN ('live', 'archived') ORDER BY updated_at_utc DESC`,
  );

  if (rows.length > 0) {
    return rows.map((row) => row.slug);
  }

  return MOCK_DISHES.map((dish) => dish.slug);
}

export async function getArchiveDateKeys(): Promise<string[]> {
  const rows = await dbAll<{ updated_at_utc: string }>(
    `SELECT updated_at_utc FROM dishes WHERE status = 'archived' ORDER BY updated_at_utc DESC`,
  );

  if (rows.length === 0) {
    return [];
  }

  const keys = new Set<string>();
  rows.forEach((row) => {
    const date = new Date(row.updated_at_utc);
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    keys.add(key);
  });

  return [...keys];
}
