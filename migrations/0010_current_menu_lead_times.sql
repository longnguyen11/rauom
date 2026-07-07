PRAGMA foreign_keys = ON;

UPDATE dishes
SET lead_time_days = 1,
    updated_at_utc = CURRENT_TIMESTAMP
WHERE id = 'dish_banh_cuon';

UPDATE dishes
SET lead_time_days = 2,
    updated_at_utc = CURRENT_TIMESTAMP
WHERE id = 'dish_nem_chua';
