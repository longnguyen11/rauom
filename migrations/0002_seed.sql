PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO dietary_tags (code, label) VALUES
  ('vegan', 'Vegan'),
  ('vegetarian', 'Vegetarian'),
  ('gluten_free', 'Gluten-Free'),
  ('dairy_free', 'Dairy-Free'),
  ('spicy', 'Spicy');

INSERT OR IGNORE INTO dishes (
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
    'dish_pho_chay',
    'vegan-pho-chay',
    'Vegan Pho Chay',
    'Slow-simmered vegetable broth with rice noodles, mushrooms, and herbs.',
    'A fragrant bowl inspired by Hanoi-style pho chay, finished with rau om, scallions, and lime. Designed for next-day freshness and light reheating.',
    1650,
    'USD',
    'live',
    1,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'dish_bo_kho',
    'bo-kho',
    'Bo Kho Beef Stew',
    'Vietnamese lemongrass beef stew with carrots and toasted baguette.',
    'A rich tomato-lemongrass broth braised low and slow. Includes garnish pack with Thai basil, rau om, and chili oil.',
    1950,
    'USD',
    'live',
    2,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'dish_banh_cuon',
    'banh-cuon',
    'Banh Cuon Tray',
    'Steamed rice rolls with wood-ear mushroom and pork filling.',
    'Freshly rolled rice sheets with fried shallot, fish sauce, and house pickles. Prepared to order for texture and aroma.',
    1750,
    'USD',
    'live',
    1,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'dish_ga_nuong',
    'ga-nuong-sa',
    'Lemongrass Chicken',
    'Char-grilled lemongrass chicken over jasmine rice and cucumber salad.',
    'Marinated overnight with garlic, fish sauce, palm sugar, and black pepper. Includes nuoc cham dressing and scallion oil.',
    1890,
    'USD',
    'live',
    1,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'dish_ca_kho_to',
    'ca-kho-to',
    'Ca Kho To',
    'Caramelized braised fish clay pot with pepper and ginger.',
    'A southern-style caramel fish braise balanced with fish sauce and coconut water. Best paired with steamed rice and pickled mustard greens.',
    2090,
    'USD',
    'live',
    3,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'dish_archive_bun_rieu',
    'bun-rieu-crab-noodle-soup',
    'Bun Rieu (Archive)',
    'Tomato crab noodle soup from a previous weekly menu.',
    'Classic northern tomato-and-crab style broth served in a limited run. Archived for seasonal rotation and repeat-order history.',
    1790,
    'USD',
    'archived',
    1,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

INSERT OR IGNORE INTO dish_images (id, dish_id, url, alt_text, sort_order) VALUES
  ('img_pho_1', 'dish_pho_chay', 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=1600&q=80', 'Vegan pho bowl with herbs and lime', 0),
  ('img_bo_kho_1', 'dish_bo_kho', 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&w=1600&q=80', 'Vietnamese beef stew in a clay bowl', 0),
  ('img_banh_cuon_1', 'dish_banh_cuon', 'https://images.unsplash.com/photo-1625943556515-4b0f98f2e4fd?auto=format&fit=crop&w=1600&q=80', 'Steamed rice rolls with herbs', 0),
  ('img_ga_nuong_1', 'dish_ga_nuong', 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?auto=format&fit=crop&w=1600&q=80', 'Lemongrass grilled chicken over rice', 0),
  ('img_ca_kho_to_1', 'dish_ca_kho_to', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1600&q=80', 'Caramelized fish in clay pot', 0),
  ('img_bun_rieu_1', 'dish_archive_bun_rieu', 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1600&q=80', 'Bun rieu noodle soup bowl', 0);

INSERT OR IGNORE INTO ingredients (id, dish_id, name, is_allergen) VALUES
  ('ing_pho_1', 'dish_pho_chay', 'Rice noodles', 0),
  ('ing_pho_2', 'dish_pho_chay', 'Mushrooms', 0),
  ('ing_pho_3', 'dish_pho_chay', 'Soy sauce', 1),
  ('ing_bo_1', 'dish_bo_kho', 'Beef shank', 0),
  ('ing_bo_2', 'dish_bo_kho', 'Lemongrass', 0),
  ('ing_bo_3', 'dish_bo_kho', 'Fish sauce', 1),
  ('ing_bc_1', 'dish_banh_cuon', 'Rice flour sheets', 0),
  ('ing_bc_2', 'dish_banh_cuon', 'Ground pork', 0),
  ('ing_bc_3', 'dish_banh_cuon', 'Wood-ear mushroom', 0),
  ('ing_ga_1', 'dish_ga_nuong', 'Chicken thigh', 0),
  ('ing_ga_2', 'dish_ga_nuong', 'Fish sauce', 1),
  ('ing_ga_3', 'dish_ga_nuong', 'Palm sugar', 0),
  ('ing_ckt_1', 'dish_ca_kho_to', 'White fish fillet', 0),
  ('ing_ckt_2', 'dish_ca_kho_to', 'Caramel sauce', 0),
  ('ing_ckt_3', 'dish_ca_kho_to', 'Fish sauce', 1);

INSERT OR IGNORE INTO dish_nutrition (dish_id, calories, protein_g, carbs_g, fat_g, sodium_mg, notes) VALUES
  ('dish_pho_chay', 420, 15, 58, 12, 980, 'Values are estimated per serving.'),
  ('dish_bo_kho', 560, 38, 35, 29, 1120, 'Values are estimated per serving.'),
  ('dish_banh_cuon', 470, 20, 61, 14, 990, 'Values are estimated per serving.'),
  ('dish_ga_nuong', 610, 44, 52, 24, 1040, 'Values are estimated per serving.'),
  ('dish_ca_kho_to', 540, 36, 18, 33, 1170, 'Values are estimated per serving.');

INSERT OR IGNORE INTO dish_dietary_tags (dish_id, dietary_tag_id)
SELECT 'dish_pho_chay', id FROM dietary_tags WHERE code IN ('vegan', 'vegetarian', 'dairy_free');

INSERT OR IGNORE INTO dish_dietary_tags (dish_id, dietary_tag_id)
SELECT 'dish_bo_kho', id FROM dietary_tags WHERE code IN ('dairy_free', 'spicy');

INSERT OR IGNORE INTO dish_dietary_tags (dish_id, dietary_tag_id)
SELECT 'dish_banh_cuon', id FROM dietary_tags WHERE code IN ('dairy_free');

INSERT OR IGNORE INTO dish_dietary_tags (dish_id, dietary_tag_id)
SELECT 'dish_ga_nuong', id FROM dietary_tags WHERE code IN ('gluten_free', 'dairy_free');

INSERT OR IGNORE INTO dish_dietary_tags (dish_id, dietary_tag_id)
SELECT 'dish_ca_kho_to', id FROM dietary_tags WHERE code IN ('gluten_free', 'dairy_free');

INSERT OR IGNORE INTO dish_dietary_tags (dish_id, dietary_tag_id)
SELECT 'dish_archive_bun_rieu', id FROM dietary_tags WHERE code IN ('dairy_free');

INSERT OR IGNORE INTO delivery_pricing_rules (
  base_fee_cents,
  tier1_rate_cents_per_mile,
  tier2_rate_cents_per_mile,
  max_distance_mi,
  rounding_step_cents,
  minimum_order_enabled,
  minimum_order_amount_delivery_cents,
  minimum_order_amount_pickup_cents,
  is_active,
  effective_from_utc
)
VALUES (400, 90, 65, 30.0, 50, 0, NULL, NULL, 1, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO tax_rules (
  jurisdiction,
  tax_rate_bps,
  is_active,
  effective_from_utc
)
VALUES ('FL-ORANGE', 650, 1, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO app_settings (key, value_json) VALUES
  ('fixed_origin_address', '"720 Orange Ave, Longwood, FL 32750"'),
  ('accepted_payment_methods', '["cash", "zelle", "venmo"]'),
  ('minimum_lead_time_days_default', '1'),
  ('manual_payment_confirmation_buffer_hours', '12'),
  ('pending_confirmation_timeout_minutes', '180'),
  ('minimum_order_enabled', 'false');
