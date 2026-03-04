PRAGMA foreign_keys = ON;

-- Seed per-dish bulk discount tiers for current menu items so discount
-- behavior is visible in cart drawer and checkout.
UPDATE dishes
SET bulk_discount_tiers_json = CASE id
  WHEN 'dish_pho' THEN '[{"minQuantity":4,"discountPercent":5},{"minQuantity":10,"discountPercent":12}]'
  WHEN 'dish_pho_chay' THEN '[{"minQuantity":5,"discountPercent":6},{"minQuantity":12,"discountPercent":14}]'
  WHEN 'dish_goi_cuon' THEN '[{"minQuantity":8,"discountPercent":5},{"minQuantity":20,"discountPercent":12}]'
  WHEN 'dish_bo_kho' THEN '[{"minQuantity":3,"discountPercent":4},{"minQuantity":8,"discountPercent":9},{"minQuantity":16,"discountPercent":15}]'
  WHEN 'dish_banh_xeo' THEN '[{"minQuantity":6,"discountPercent":5},{"minQuantity":14,"discountPercent":11}]'
  WHEN 'dish_banh_cuon' THEN '[{"minQuantity":6,"discountPercent":5},{"minQuantity":14,"discountPercent":11}]'
  WHEN 'dish_ga_nuong' THEN '[{"minQuantity":6,"discountPercent":5},{"minQuantity":14,"discountPercent":11}]'
  WHEN 'dish_ca_kho_to' THEN '[{"minQuantity":4,"discountPercent":5},{"minQuantity":10,"discountPercent":12}]'
  ELSE '[{"minQuantity":6,"discountPercent":5},{"minQuantity":15,"discountPercent":10}]'
END
WHERE status IN ('live', 'scheduled')
  AND TRIM(COALESCE(bulk_discount_tiers_json, '')) IN ('', '[]');
