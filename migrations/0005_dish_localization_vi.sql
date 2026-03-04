PRAGMA foreign_keys = ON;

ALTER TABLE dishes ADD COLUMN name_vi TEXT;
ALTER TABLE dishes ADD COLUMN short_description_vi TEXT;
ALTER TABLE dishes ADD COLUMN long_description_vi TEXT;

-- Core required dishes
UPDATE dishes
SET
  name_vi = 'Phở',
  short_description_vi = 'Phở bò truyền thống với nước dùng thơm và rau thơm tươi.',
  long_description_vi = 'Nước dùng xương bò ninh chậm, ăn kèm bánh phở, thịt bò thái mỏng, rau om, húng quế và chanh.'
WHERE id = 'dish_pho';

UPDATE dishes
SET
  name_vi = 'Phở Chay',
  short_description_vi = 'Phở chay với nước dùng nấm thanh, bánh phở và rau tươi.',
  long_description_vi = 'Phở chay thanh nhẹ với nấm, cải thìa, hành lá, rau om và chanh, phù hợp cho bữa ăn dễ tiêu.'
WHERE id = 'dish_pho_chay';

UPDATE dishes
SET
  name_vi = 'Gỏi Cuốn',
  short_description_vi = 'Gỏi cuốn tươi với rau thơm, bún và nước chấm nhà làm.',
  long_description_vi = 'Cuốn bánh tráng với rau sống, bún và nhân mặn, dùng kèm sốt đậu phộng hoisin đậm đà.'
WHERE id = 'dish_goi_cuon';

UPDATE dishes
SET
  name_vi = 'Bò Kho',
  short_description_vi = 'Bò kho sả cà rốt ăn kèm bánh mì nướng.',
  long_description_vi = 'Bò kho nấu chậm với sả, hoa hồi và cà chua, vị đậm đà, ăn cùng rau thơm và bánh mì.'
WHERE id = 'dish_bo_kho';

UPDATE dishes
SET
  name_vi = 'Bánh Xèo',
  short_description_vi = 'Bánh xèo nghệ giòn với giá, rau sống và nước chấm.',
  long_description_vi = 'Bánh xèo vàng giòn từ bột gạo, gập nhân mặn, ăn kèm rau sống để cuốn và nước mắm chua ngọt.'
WHERE id = 'dish_banh_xeo';

-- Legacy seeded dishes still present in some environments
UPDATE dishes
SET
  name_vi = 'Bánh Cuốn Thập Cẩm',
  short_description_vi = 'Bánh cuốn nóng với nhân mộc nhĩ thịt và hành phi.',
  long_description_vi = 'Bánh cuốn mỏng cuốn nhân mộc nhĩ thịt, dùng kèm nước mắm, đồ chua và hành phi thơm.'
WHERE id = 'dish_banh_cuon';

UPDATE dishes
SET
  name_vi = 'Gà Nướng Sả',
  short_description_vi = 'Gà nướng sả ăn kèm cơm thơm và salad dưa leo.',
  long_description_vi = 'Gà ướp qua đêm với tỏi, nước mắm, đường thốt nốt và tiêu, ăn kèm nước chấm và mỡ hành.'
WHERE id = 'dish_ga_nuong';

UPDATE dishes
SET
  name_vi = 'Cá Kho Tộ',
  short_description_vi = 'Cá kho tộ caramel với tiêu và gừng.',
  long_description_vi = 'Cá kho kiểu miền Nam với nước màu, nước mắm và nước dừa, dùng ngon nhất với cơm nóng.'
WHERE id = 'dish_ca_kho_to';

UPDATE dishes
SET
  name_vi = 'Bún Riêu (Lưu Trữ)',
  short_description_vi = 'Bún riêu cà chua cua đồng từ thực đơn trước.',
  long_description_vi = 'Món bún riêu phong cách Bắc, đã lưu trữ để xoay vòng theo mùa và phục vụ khách đặt lại.'
WHERE id = 'dish_archive_bun_rieu';
