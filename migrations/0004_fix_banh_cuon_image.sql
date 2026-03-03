PRAGMA foreign_keys = ON;

-- Use a guaranteed local asset so the Banh Cuon image never breaks in demo mode.
UPDATE dish_images
SET
  url = '/demo/banh-cuon-demo.svg',
  alt_text = 'Banh Cuon Tray demo image',
  sort_order = 0
WHERE dish_id = 'dish_banh_cuon';

INSERT INTO dish_images (id, dish_id, url, alt_text, sort_order)
SELECT
  'img_banh_cuon_fallback',
  'dish_banh_cuon',
  '/demo/banh-cuon-demo.svg',
  'Banh Cuon Tray demo image',
  0
WHERE NOT EXISTS (
  SELECT 1
  FROM dish_images
  WHERE dish_id = 'dish_banh_cuon'
);
