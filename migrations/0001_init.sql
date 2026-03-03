PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS dishes (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short_description TEXT NOT NULL,
  long_description TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('draft', 'scheduled', 'live', 'archived', 'sold_out')),
  lead_time_days INTEGER NOT NULL DEFAULT 1 CHECK (lead_time_days IN (1, 2, 3)),
  is_featured_week INTEGER NOT NULL DEFAULT 0,
  available_from_utc TEXT,
  available_to_utc TEXT,
  created_at_utc TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at_utc TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dish_images (
  id TEXT PRIMARY KEY,
  dish_id TEXT NOT NULL,
  url TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ingredients (
  id TEXT PRIMARY KEY,
  dish_id TEXT NOT NULL,
  name TEXT NOT NULL,
  is_allergen INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS dish_nutrition (
  dish_id TEXT PRIMARY KEY,
  calories INTEGER,
  protein_g INTEGER,
  carbs_g INTEGER,
  fat_g INTEGER,
  sodium_mg INTEGER,
  notes TEXT,
  FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS dietary_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS dish_dietary_tags (
  dish_id TEXT NOT NULL,
  dietary_tag_id INTEGER NOT NULL,
  PRIMARY KEY (dish_id, dietary_tag_id),
  FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE,
  FOREIGN KEY (dietary_tag_id) REFERENCES dietary_tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS fulfillment_timeslots (
  id TEXT PRIMARY KEY,
  date_local TEXT NOT NULL,
  start_time_local TEXT NOT NULL,
  end_time_local TEXT NOT NULL,
  start_time_utc TEXT NOT NULL,
  end_time_utc TEXT NOT NULL,
  slot_type TEXT NOT NULL CHECK (slot_type IN ('delivery', 'pickup')),
  capacity_limit INTEGER NOT NULL CHECK (capacity_limit >= 0),
  reserved_count INTEGER NOT NULL DEFAULT 0 CHECK (reserved_count >= 0),
  is_open INTEGER NOT NULL DEFAULT 1,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  cutoff_time_local TEXT NOT NULL,
  minimum_lead_time_days INTEGER NOT NULL DEFAULT 1 CHECK (minimum_lead_time_days IN (1, 2, 3)),
  created_at_utc TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (start_time_utc, slot_type)
);

CREATE TABLE IF NOT EXISTS blackout_dates (
  id TEXT PRIMARY KEY,
  date_local TEXT NOT NULL UNIQUE,
  reason TEXT,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS delivery_pricing_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  base_fee_cents INTEGER NOT NULL,
  tier1_rate_cents_per_mile INTEGER NOT NULL,
  tier2_rate_cents_per_mile INTEGER NOT NULL,
  max_distance_mi REAL NOT NULL,
  rounding_step_cents INTEGER NOT NULL DEFAULT 50,
  minimum_order_enabled INTEGER NOT NULL DEFAULT 0,
  minimum_order_amount_delivery_cents INTEGER,
  minimum_order_amount_pickup_cents INTEGER,
  is_active INTEGER NOT NULL DEFAULT 1,
  effective_from_utc TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  effective_to_utc TEXT
);

CREATE TABLE IF NOT EXISTS tax_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  jurisdiction TEXT NOT NULL,
  tax_rate_bps INTEGER NOT NULL CHECK (tax_rate_bps >= 0),
  is_active INTEGER NOT NULL DEFAULT 1,
  effective_from_utc TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  effective_to_utc TEXT
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  fulfillment_type TEXT NOT NULL CHECK (fulfillment_type IN ('delivery', 'pickup')),
  fulfillment_time_local TEXT NOT NULL,
  fulfillment_time_utc TEXT NOT NULL,
  timeslot_id TEXT NOT NULL,
  delivery_address_line1 TEXT,
  delivery_address_line2 TEXT,
  delivery_city TEXT,
  delivery_state TEXT,
  delivery_zip TEXT,
  delivery_lat REAL,
  delivery_lng REAL,
  delivery_distance_mi REAL,
  subtotal_before_tax_cents INTEGER NOT NULL,
  tax_rate_snapshot_bps INTEGER NOT NULL,
  tax_amount_cents INTEGER NOT NULL,
  delivery_fee_cents INTEGER NOT NULL,
  total_after_tax_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  notes TEXT,
  created_at_utc TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at_utc TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  payment_method_selected TEXT NOT NULL CHECK (payment_method_selected IN ('cash', 'zelle', 'venmo')),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('unpaid', 'paid', 'refunded_partial', 'refunded_full')) DEFAULT 'unpaid',
  payment_reference TEXT,
  payment_due_at_utc TEXT,
  confirmation_deadline_utc TEXT,
  cancelled_at_utc TEXT,
  cancellation_reason TEXT,
  refund_notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('new', 'pending_confirmation', 'confirmed', 'preparing', 'completed', 'cancelled')),
  distance_source TEXT,
  delivery_fee_rule_snapshot_json TEXT,
  kitchen_priority_score INTEGER NOT NULL DEFAULT 0,
  kitchen_group TEXT NOT NULL CHECK (kitchen_group IN ('cook_now', 'ready_from_prep', 'later')) DEFAULT 'cook_now',
  idempotency_key TEXT NOT NULL UNIQUE,
  FOREIGN KEY (timeslot_id) REFERENCES fulfillment_timeslots(id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  dish_id TEXT NOT NULL,
  dish_name_snapshot TEXT NOT NULL,
  unit_price_snapshot_cents INTEGER NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  qty_reserved_from_prep INTEGER NOT NULL DEFAULT 0,
  qty_to_cook INTEGER NOT NULL DEFAULT 0,
  item_fulfillment_status TEXT NOT NULL CHECK (item_fulfillment_status IN ('ready_from_prep', 'cook_required', 'fulfilled')) DEFAULT 'cook_required',
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (dish_id) REFERENCES dishes(id)
);

CREATE TABLE IF NOT EXISTS prep_inventory_lots (
  id TEXT PRIMARY KEY,
  dish_id TEXT NOT NULL,
  prepared_qty INTEGER NOT NULL,
  reserved_qty INTEGER NOT NULL DEFAULT 0,
  fulfilled_qty INTEGER NOT NULL DEFAULT 0,
  available_qty INTEGER NOT NULL,
  prepared_at_utc TEXT NOT NULL,
  expires_at_utc TEXT NOT NULL,
  created_by_admin_id TEXT,
  notes TEXT,
  FOREIGN KEY (dish_id) REFERENCES dishes(id)
);

CREATE TABLE IF NOT EXISTS prep_inventory_events (
  id TEXT PRIMARY KEY,
  lot_id TEXT NOT NULL,
  order_item_id TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('add', 'reserve', 'release', 'fulfill', 'waste')),
  quantity INTEGER NOT NULL,
  event_at_utc TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actor_admin_id TEXT,
  notes TEXT,
  FOREIGN KEY (lot_id) REFERENCES prep_inventory_lots(id)
);

CREATE TABLE IF NOT EXISTS kitchen_tasks (
  id TEXT PRIMARY KEY,
  dish_id TEXT NOT NULL,
  required_qty INTEGER NOT NULL,
  due_time_utc TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'done')) DEFAULT 'open',
  generated_at_utc TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  source_order_ids_snapshot TEXT NOT NULL,
  FOREIGN KEY (dish_id) REFERENCES dishes(id)
);

CREATE TABLE IF NOT EXISTS order_audit_log (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  actor_admin_id TEXT,
  event_at_utc TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS subscribers (
  id TEXT PRIMARY KEY,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'unsubscribed')),
  consent_text_version TEXT NOT NULL,
  consented_at_utc TEXT NOT NULL,
  verification_token TEXT,
  verification_sent_at_utc TEXT,
  UNIQUE (email, channel),
  UNIQUE (phone, channel)
);

CREATE TABLE IF NOT EXISTS distance_quote_cache (
  id TEXT PRIMARY KEY,
  origin_hash TEXT NOT NULL,
  destination_hash TEXT NOT NULL,
  distance_mi REAL NOT NULL,
  duration_min REAL,
  provider TEXT NOT NULL,
  quoted_at_utc TEXT NOT NULL,
  expires_at_utc TEXT NOT NULL,
  UNIQUE (origin_hash, destination_hash)
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  created_at_utc TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at_utc TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  id TEXT PRIMARY KEY,
  request_hash TEXT NOT NULL,
  scope TEXT NOT NULL,
  created_at_utc TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at_utc TEXT NOT NULL,
  UNIQUE (request_hash, scope)
);

CREATE INDEX IF NOT EXISTS idx_dishes_status ON dishes(status);
CREATE INDEX IF NOT EXISTS idx_dishes_featured ON dishes(is_featured_week, updated_at_utc DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at_utc DESC);
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_time ON orders(fulfillment_time_utc);
CREATE INDEX IF NOT EXISTS idx_timeslots_start_type ON fulfillment_timeslots(start_time_utc, slot_type);
CREATE INDEX IF NOT EXISTS idx_subscribers_status_channel ON subscribers(status, channel);
