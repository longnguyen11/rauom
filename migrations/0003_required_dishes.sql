PRAGMA foreign_keys = ON;

-- Ensure requested core dishes are present with stable IDs and expected names.
INSERT INTO dishes (
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
) VALUES
  (
    'dish_pho',
    'pho',
    'Pho',
    'Classic Vietnamese beef noodle soup with aromatic broth and herbs.',
    'Slow-simmered beef bone broth served with rice noodles, thin-sliced beef, rau om, basil, and lime.',
    1850,
    'USD',
    'live',
    1,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'dish_pho_chay',
    'pho-chay',
    'Pho Chay',
    'Vegetarian pho with clear mushroom broth, rice noodles, and fresh herbs.',
    'A light and aromatic plant-based pho with mushrooms, bok choy, scallions, rau om, and lime.',
    1650,
    'USD',
    'live',
    1,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'dish_goi_cuon',
    'goi-cuon',
    'Goi Cuon',
    'Fresh spring rolls with herbs, vermicelli, and house dipping sauce.',
    'Rice paper rolls with herbs, lettuce, vermicelli, and your choice of protein, served chilled with peanut-hoisin dip.',
    1290,
    'USD',
    'live',
    1,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'dish_bo_kho',
    'bo-kho',
    'Bo Kho',
    'Vietnamese lemongrass beef stew with carrots and toasted baguette.',
    'Rich, slow-braised beef stew with lemongrass, star anise, and tomato, served with herbs and bread.',
    1950,
    'USD',
    'live',
    2,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'dish_banh_xeo',
    'banh-xeo',
    'Banh Xeo',
    'Crispy turmeric crepe with bean sprouts, herbs, and dipping sauce.',
    'Golden rice-flour crepe folded over savory filling, served with herbs and lettuce for wrapping.',
    1690,
    'USD',
    'live',
    1,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT(id) DO UPDATE SET
  slug = excluded.slug,
  name = excluded.name,
  short_description = excluded.short_description,
  long_description = excluded.long_description,
  price_cents = excluded.price_cents,
  currency = excluded.currency,
  status = excluded.status,
  lead_time_days = excluded.lead_time_days,
  is_featured_week = excluded.is_featured_week,
  updated_at_utc = CURRENT_TIMESTAMP;

INSERT OR REPLACE INTO dish_images (id, dish_id, url, alt_text, sort_order) VALUES
  ('img_pho_1', 'dish_pho', 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1600&q=80', 'Pho bowl with herbs and sliced beef', 0),
  ('img_pho_chay_1', 'dish_pho_chay', 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=1600&q=80', 'Pho chay bowl with mushrooms and herbs', 0),
  ('img_goi_cuon_1', 'dish_goi_cuon', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1600&q=80', 'Goi cuon fresh spring rolls with dip', 0),
  ('img_bo_kho_1', 'dish_bo_kho', 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&w=1600&q=80', 'Bo kho beef stew in a bowl', 0),
  ('img_banh_xeo_1', 'dish_banh_xeo', 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=1600&q=80', 'Banh xeo crispy crepe with herbs', 0);

INSERT OR REPLACE INTO ingredients (id, dish_id, name, is_allergen) VALUES
  ('ing_pho_1', 'dish_pho', 'Rice noodles', 0),
  ('ing_pho_2', 'dish_pho', 'Beef broth', 0),
  ('ing_pho_3', 'dish_pho', 'Fish sauce', 1),

  ('ing_pho_chay_1', 'dish_pho_chay', 'Rice noodles', 0),
  ('ing_pho_chay_2', 'dish_pho_chay', 'Mushrooms', 0),
  ('ing_pho_chay_3', 'dish_pho_chay', 'Soy sauce', 1),

  ('ing_goi_cuon_1', 'dish_goi_cuon', 'Rice paper', 0),
  ('ing_goi_cuon_2', 'dish_goi_cuon', 'Vermicelli', 0),
  ('ing_goi_cuon_3', 'dish_goi_cuon', 'Peanut hoisin sauce', 1),

  ('ing_bo_kho_1', 'dish_bo_kho', 'Beef shank', 0),
  ('ing_bo_kho_2', 'dish_bo_kho', 'Lemongrass', 0),
  ('ing_bo_kho_3', 'dish_bo_kho', 'Fish sauce', 1),

  ('ing_banh_xeo_1', 'dish_banh_xeo', 'Rice flour batter', 0),
  ('ing_banh_xeo_2', 'dish_banh_xeo', 'Bean sprouts', 0),
  ('ing_banh_xeo_3', 'dish_banh_xeo', 'Fish sauce dip', 1);

INSERT INTO dish_nutrition (dish_id, calories, protein_g, carbs_g, fat_g, sodium_mg, notes) VALUES
  ('dish_pho', 520, 34, 55, 16, 1180, 'Values are estimated per serving.'),
  ('dish_pho_chay', 420, 15, 58, 12, 980, 'Values are estimated per serving.'),
  ('dish_goi_cuon', 290, 11, 39, 10, 640, 'Values are estimated per serving.'),
  ('dish_bo_kho', 560, 38, 35, 29, 1120, 'Values are estimated per serving.'),
  ('dish_banh_xeo', 510, 19, 56, 22, 930, 'Values are estimated per serving.')
ON CONFLICT(dish_id) DO UPDATE SET
  calories = excluded.calories,
  protein_g = excluded.protein_g,
  carbs_g = excluded.carbs_g,
  fat_g = excluded.fat_g,
  sodium_mg = excluded.sodium_mg,
  notes = excluded.notes;

INSERT OR IGNORE INTO dish_dietary_tags (dish_id, dietary_tag_id)
SELECT 'dish_pho_chay', id FROM dietary_tags WHERE code IN ('vegan', 'vegetarian', 'dairy_free');

INSERT OR IGNORE INTO dish_dietary_tags (dish_id, dietary_tag_id)
SELECT 'dish_goi_cuon', id FROM dietary_tags WHERE code IN ('dairy_free', 'gluten_free');

INSERT OR IGNORE INTO dish_dietary_tags (dish_id, dietary_tag_id)
SELECT 'dish_bo_kho', id FROM dietary_tags WHERE code IN ('dairy_free', 'spicy');

INSERT OR IGNORE INTO dish_dietary_tags (dish_id, dietary_tag_id)
SELECT 'dish_banh_xeo', id FROM dietary_tags WHERE code IN ('dairy_free', 'gluten_free');
