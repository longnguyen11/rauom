PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO dietary_tags (code, label) VALUES
  ('dairy_free', 'Dairy-Free');

UPDATE dishes
SET
  status = CASE WHEN status = 'live' THEN 'archived' ELSE status END,
  is_featured_week = 0,
  updated_at_utc = CURRENT_TIMESTAMP
WHERE id NOT IN (
  'dish_banh_cuon',
  'dish_cha_ca',
  'dish_nem_chua',
  'dish_banh_tom_chien'
);

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
    'dish_banh_cuon',
    'banh-uot-banh-cuon',
    'Bánh Ướt / Bánh Cuốn',
    'Bánh Ướt / Bánh Cuốn',
    'Fresh steamed rice sheets and rolls, sold by the pound.',
    'Bánh ướt và bánh cuốn tươi, bán theo pound.',
    'Soft steamed rice sheets and bánh cuốn prepared for pickup or delivery. Sold by the pound.',
    'Bánh ướt và bánh cuốn mềm, làm cho đơn pickup hoặc delivery. Bán theo pound.',
    'main',
    '[]',
    1000,
    'USD',
    'live',
    1,
    1,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'dish_cha_ca',
    'cha-ca',
    'Chả Cá',
    'Chả Cá',
    'Vietnamese fish cake, sold by the pound.',
    'Chả cá Việt Nam, bán theo pound.',
    'Savory Vietnamese fish cake with herbs and seasoning. Sold by the pound.',
    'Chả cá đậm đà với gia vị và rau thơm. Bán theo pound.',
    'main',
    '[]',
    1200,
    'USD',
    'live',
    1,
    1,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'dish_nem_chua',
    'nem-chua',
    'Nem Chua',
    'Nem Chua',
    'Vietnamese cured pork, sold by the pound.',
    'Nem chua, bán theo pound.',
    'Tangy Vietnamese cured pork with garlic and chili notes. Sold by the pound.',
    'Nem chua vị chua nhẹ, có tỏi và ớt. Bán theo pound.',
    'side',
    '[]',
    800,
    'USD',
    'live',
    2,
    0,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'dish_banh_tom_chien',
    'banh-tom-chien',
    'Bánh Tôm Chiên',
    'Bánh Tôm Chiên',
    'Crispy fried shrimp cake, priced per piece.',
    'Bánh tôm chiên giòn, tính giá theo cái.',
    'Crispy fried shrimp cake prepared fresh for pickup or delivery. Priced per piece.',
    'Bánh tôm chiên giòn, làm cho đơn pickup hoặc delivery. Tính giá theo cái.',
    'side',
    '[]',
    100,
    'USD',
    'live',
    1,
    0,
    1,
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
  currency = excluded.currency,
  status = excluded.status,
  lead_time_days = excluded.lead_time_days,
  is_featured_week = excluded.is_featured_week,
  is_anchor_dish = excluded.is_anchor_dish,
  updated_at_utc = CURRENT_TIMESTAMP;

DELETE FROM dish_images
WHERE dish_id IN (
  'dish_banh_cuon',
  'dish_cha_ca',
  'dish_nem_chua',
  'dish_banh_tom_chien'
);

INSERT INTO dish_images (id, dish_id, url, alt_text, sort_order) VALUES
  ('img_banh_cuon_current', 'dish_banh_cuon', '/demo/banh-cuon-demo.svg', 'Bánh ướt and bánh cuốn tray', 0),
  ('img_cha_ca_current', 'dish_cha_ca', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80', 'Vietnamese fish cake', 0),
  ('img_nem_chua_current', 'dish_nem_chua', 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=1200&q=80', 'Nem chua Vietnamese cured pork', 0),
  ('img_banh_tom_chien_current', 'dish_banh_tom_chien', 'https://images.unsplash.com/photo-1562967916-eb82221dfb92?auto=format&fit=crop&w=1200&q=80', 'Crispy fried shrimp cake', 0);

DELETE FROM ingredients
WHERE dish_id IN (
  'dish_banh_cuon',
  'dish_cha_ca',
  'dish_nem_chua',
  'dish_banh_tom_chien'
);

INSERT INTO ingredients (id, dish_id, name, is_allergen) VALUES
  ('ing_banh_cuon_current_1', 'dish_banh_cuon', 'Rice flour', 0),
  ('ing_banh_cuon_current_2', 'dish_banh_cuon', 'Tapioca starch', 0),
  ('ing_banh_cuon_current_3', 'dish_banh_cuon', 'Fried shallots', 0),
  ('ing_banh_cuon_current_4', 'dish_banh_cuon', 'Fish sauce may be served on the side', 1),
  ('ing_cha_ca_current_1', 'dish_cha_ca', 'Fish', 1),
  ('ing_cha_ca_current_2', 'dish_cha_ca', 'Garlic', 0),
  ('ing_cha_ca_current_3', 'dish_cha_ca', 'Black pepper', 0),
  ('ing_cha_ca_current_4', 'dish_cha_ca', 'Fish sauce', 1),
  ('ing_nem_chua_current_1', 'dish_nem_chua', 'Pork', 0),
  ('ing_nem_chua_current_2', 'dish_nem_chua', 'Garlic', 0),
  ('ing_nem_chua_current_3', 'dish_nem_chua', 'Chili', 0),
  ('ing_nem_chua_current_4', 'dish_nem_chua', 'Black pepper', 0),
  ('ing_banh_tom_current_1', 'dish_banh_tom_chien', 'Shrimp', 1),
  ('ing_banh_tom_current_2', 'dish_banh_tom_chien', 'Sweet potato', 0),
  ('ing_banh_tom_current_3', 'dish_banh_tom_chien', 'Flour batter', 1),
  ('ing_banh_tom_current_4', 'dish_banh_tom_chien', 'Oil', 0);

DELETE FROM dish_dietary_tags
WHERE dish_id IN (
  'dish_banh_cuon',
  'dish_cha_ca',
  'dish_nem_chua',
  'dish_banh_tom_chien'
);

INSERT INTO dish_dietary_tags (dish_id, dietary_tag_id)
SELECT dish_id, id
FROM (
  SELECT 'dish_banh_cuon' AS dish_id, 'dairy_free' AS code
  UNION ALL SELECT 'dish_cha_ca', 'dairy_free'
  UNION ALL SELECT 'dish_nem_chua', 'dairy_free'
) menu_tags
JOIN dietary_tags ON dietary_tags.code = menu_tags.code;

DELETE FROM dish_nutrition
WHERE dish_id IN (
  'dish_banh_cuon',
  'dish_cha_ca',
  'dish_nem_chua',
  'dish_banh_tom_chien'
);
