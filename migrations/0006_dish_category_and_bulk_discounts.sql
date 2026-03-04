PRAGMA foreign_keys = ON;

ALTER TABLE dishes ADD COLUMN category TEXT NOT NULL DEFAULT 'main';
ALTER TABLE dishes ADD COLUMN bulk_discount_tiers_json TEXT NOT NULL DEFAULT '[]';
