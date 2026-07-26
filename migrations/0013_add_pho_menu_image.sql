PRAGMA foreign_keys = ON;

UPDATE menu_temporary_dishes
SET
  image_url = '/menu-assets/pho.png',
  updated_at_utc = CURRENT_TIMESTAMP
WHERE slot = 1;
