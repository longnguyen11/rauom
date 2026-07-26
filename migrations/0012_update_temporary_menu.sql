PRAGMA foreign_keys = ON;

UPDATE menu_temporary_dishes
SET
  is_active = 1,
  name_en = 'Pho Bo (Beef Pho)',
  name_vi = 'Phở Bò',
  description_en = 'Beef pho with a rich, aromatic broth, available in this weekly batch.',
  description_vi = 'Phở bò với nước dùng thơm đậm đà, mở bán theo mẻ trong tuần.',
  price_en = '$15/bowl',
  price_vi = '$15/tô',
  image_url = NULL,
  image_alt_en = 'Pho Bo beef pho',
  image_alt_vi = 'Phở bò',
  updated_at_utc = CURRENT_TIMESTAMP
WHERE slot = 1;

UPDATE menu_temporary_dishes
SET
  is_active = 0,
  name_en = 'Not available',
  name_vi = 'Chưa có món',
  description_en = 'There is no second temporary dish right now.',
  description_vi = 'Hiện chưa có món tạm thời thứ hai.',
  price_en = '',
  price_vi = '',
  image_url = NULL,
  image_alt_en = 'No dish available',
  image_alt_vi = 'Chưa có món',
  updated_at_utc = CURRENT_TIMESTAMP
WHERE slot = 2;
