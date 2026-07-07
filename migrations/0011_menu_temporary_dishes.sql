PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS menu_temporary_dishes (
  slot INTEGER PRIMARY KEY CHECK (slot IN (1, 2)),
  is_active INTEGER NOT NULL DEFAULT 1,
  name_en TEXT NOT NULL,
  name_vi TEXT NOT NULL,
  description_en TEXT NOT NULL,
  description_vi TEXT NOT NULL,
  price_en TEXT NOT NULL,
  price_vi TEXT NOT NULL,
  delivery_date TEXT NOT NULL,
  order_deadline TEXT NOT NULL,
  image_url TEXT,
  image_alt_en TEXT NOT NULL,
  image_alt_vi TEXT NOT NULL,
  created_at_utc TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at_utc TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
