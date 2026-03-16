PRAGMA foreign_keys = ON;

ALTER TABLE dishes ADD COLUMN is_anchor_dish INTEGER NOT NULL DEFAULT 0;

-- Weekly batch model keeps live menu at 1-day technical lead since all fulfillment
-- is gated to Saturday windows in application logic.
UPDATE dishes
SET lead_time_days = 1
WHERE status IN ('live', 'scheduled');

-- Mark stable anchors that should remain on menu most weeks.
UPDATE dishes
SET is_anchor_dish = 1
WHERE id IN ('dish_pho', 'dish_pho_chay', 'dish_goi_cuon');

-- Add bundled meal offerings for weekly prep customers.
INSERT INTO dishes (
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
  is_anchor_dish,
  created_at_utc,
  updated_at_utc
) VALUES
  (
    'dish_bundle_family_week',
    'family-week-bundle',
    'Family Weeknight Bundle',
    'Combo Gia Dinh Ca Tuan',
    '5 dinners for 4 people with anchor dishes plus rotating weekly specials.',
    '5 bua toi cho 4 nguoi, gom mon co dinh va mon thay doi theo tuan.',
    'Includes 20 portions total, Saturday prep, and delivery-ready packaging for easy reheating Monday-Friday.',
    'Tong cong 20 phan an, nau thu Bay va dong hop san de dung lai tu thu Hai den thu Sau.',
    'bundle',
    '[{\"minQuantity\":2,\"discountPercent\":8}]',
    12900,
    'USD',
    'live',
    1,
    1,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'dish_bundle_high_protein',
    'high-protein-bundle',
    'High-Protein Weekly Bundle',
    'Combo Tuan Giau Dam',
    '10 high-protein portions with two anchor dishes and one rotating special.',
    '10 phan an giau dam voi 2 mon co dinh va 1 mon thay doi theo tuan.',
    'Built for busy schedules: lean proteins, balanced carbs, and sauce packs prepared in Saturday batch cook.',
    'Thich hop lich ban ron: dam nac, tinh bot can bang, va nuoc sot dong goi tu dot nau thu Bay.',
    'bundle',
    '[{\"minQuantity\":2,\"discountPercent\":6}]',
    8900,
    'USD',
    'live',
    1,
    1,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT(id) DO UPDATE SET
  slug = excluded.slug,
  name = excluded.name,
  name_vi = excluded.name_vi,
  short_description = excluded.short_description,
  short_description_vi = excluded.short_description_vi,
  long_description = excluded.long_description,
  long_description_vi = excluded.long_description_vi,
  category = excluded.category,
  bulk_discount_tiers_json = excluded.bulk_discount_tiers_json,
  price_cents = excluded.price_cents,
  status = excluded.status,
  lead_time_days = excluded.lead_time_days,
  is_featured_week = excluded.is_featured_week,
  is_anchor_dish = excluded.is_anchor_dish,
  updated_at_utc = CURRENT_TIMESTAMP;

INSERT OR REPLACE INTO dish_images (id, dish_id, url, alt_text, sort_order) VALUES
  (
    'img_bundle_family_week_1',
    'dish_bundle_family_week',
    'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1600&q=80',
    'Family meal prep containers ready for the week',
    0
  ),
  (
    'img_bundle_high_protein_1',
    'dish_bundle_high_protein',
    'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1600&q=80',
    'High-protein weekly meal prep boxes',
    0
  );

INSERT OR REPLACE INTO ingredients (id, dish_id, name, is_allergen) VALUES
  ('ing_bundle_family_1', 'dish_bundle_family_week', 'Mixed proteins', 0),
  ('ing_bundle_family_2', 'dish_bundle_family_week', 'Seasonal vegetables', 0),
  ('ing_bundle_family_3', 'dish_bundle_family_week', 'Soy sauce', 1),
  ('ing_bundle_family_4', 'dish_bundle_family_week', 'Fish sauce', 1),
  ('ing_bundle_high_protein_1', 'dish_bundle_high_protein', 'Chicken and beef', 0),
  ('ing_bundle_high_protein_2', 'dish_bundle_high_protein', 'Rice and noodles', 0),
  ('ing_bundle_high_protein_3', 'dish_bundle_high_protein', 'Soy sauce', 1);

INSERT OR IGNORE INTO dish_dietary_tags (dish_id, dietary_tag_id)
SELECT 'dish_bundle_family_week', id
FROM dietary_tags
WHERE code IN ('dairy_free');

INSERT OR IGNORE INTO dish_dietary_tags (dish_id, dietary_tag_id)
SELECT 'dish_bundle_high_protein', id
FROM dietary_tags
WHERE code IN ('dairy_free');
