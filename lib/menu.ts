import { dbAll, dbRun } from "@/lib/db";

export type MenuDishKind = "mainstay" | "temporary";

export interface MenuDishCopy {
  name: string;
  description: string;
  price: string;
  imageAlt: string;
}

export interface MainstayMenuDish {
  id: string;
  kind: "mainstay";
  copy: {
    en: MenuDishCopy;
    vi: MenuDishCopy;
  };
  imageUrl: string;
}

export interface TemporaryMenuDish {
  id: string;
  slot: 1 | 2;
  kind: "temporary";
  isActive: boolean;
  copy: {
    en: MenuDishCopy;
    vi: MenuDishCopy;
  };
  deliveryDate: string;
  orderDeadline: string;
  imageUrl: string;
}

export interface MenuData {
  mainstayDishes: MainstayMenuDish[];
  temporaryDishes: TemporaryMenuDish[];
}

interface TemporaryDishRow {
  slot: number;
  is_active: number;
  name_en: string;
  name_vi: string;
  description_en: string;
  description_vi: string;
  price_en: string;
  price_vi: string;
  delivery_date: string;
  order_deadline: string;
  image_url: string | null;
  image_alt_en: string;
  image_alt_vi: string;
}

export interface SaveTemporaryDishInput {
  slot: 1 | 2;
  isActive: boolean;
  nameEn: string;
  nameVi: string;
  descriptionEn: string;
  descriptionVi: string;
  priceEn: string;
  priceVi: string;
  deliveryDate: string;
  orderDeadline: string;
  imageUrl: string;
  imageAltEn: string;
  imageAltVi: string;
}

export const MAINSTAY_MENU_DISHES: MainstayMenuDish[] = [
  {
    id: "banh-cuon",
    kind: "mainstay",
    imageUrl: "/menu-assets/banh-cuon.jpg",
    copy: {
      vi: {
        name: "Bánh Ướt / Bánh Cuốn",
        description: "Bánh mềm làm theo mẻ, dùng kèm hành phi và nước chấm.",
        price: "$10/lb",
        imageAlt: "Bánh ướt và bánh cuốn",
      },
      en: {
        name: "Steamed Rice Rolls / Rice Rolls with Ground Pork",
        description: "Fresh steamed rice sheets and rolls with fried shallots and sauce.",
        price: "$10/lb",
        imageAlt: "Steamed rice rolls with ground pork",
      },
    },
  },
  {
    id: "cha-ca",
    kind: "mainstay",
    imageUrl: "/menu-assets/cha-ca.jpg",
    copy: {
      vi: {
        name: "Chả Cá",
        description: "Chả cá dai thơm, bán theo pound.",
        price: "$12/lb",
        imageAlt: "Chả cá Việt Nam",
      },
      en: {
        name: "Fish Cakes",
        description: "Savory Vietnamese fish cakes, sold by the pound.",
        price: "$12/lb",
        imageAlt: "Vietnamese fish cakes",
      },
    },
  },
  {
    id: "nem-chua",
    kind: "mainstay",
    imageUrl: "/menu-assets/nem-chua.jpg",
    copy: {
      vi: {
        name: "Nem Chua",
        description: "Nem chua vị chua nhẹ với tỏi, ớt và rau thơm.",
        price: "$10/lb",
        imageAlt: "Nem chua Việt Nam",
      },
      en: {
        name: "Fermented Pork Roll",
        description: "Tangy cured pork with garlic, chile, and fresh herbs.",
        price: "$10/lb",
        imageAlt: "Vietnamese fermented pork roll",
      },
    },
  },
  {
    id: "banh-tom-chien",
    kind: "mainstay",
    imageUrl: "/menu-assets/banh-tom-chien.jpg",
    copy: {
      vi: {
        name: "Bánh Tôm Chiên",
        description: "Bánh tôm chiên giòn, làm theo mẻ.",
        price: "$5/4 cái",
        imageAlt: "Bánh tôm chiên",
      },
      en: {
        name: "Fried Shrimp Cakes",
        description: "Crispy fried shrimp cakes prepared in small batches.",
        price: "$5/4 pieces",
        imageAlt: "Vietnamese fried shrimp cakes",
      },
    },
  },
  {
    id: "thit-nuong",
    kind: "mainstay",
    imageUrl: "/menu-assets/thit-nuong.jpg",
    copy: {
      vi: {
        name: "Thịt Nướng",
        description: "Thịt nướng ướp thơm, nướng vàng và bán theo pound.",
        price: "$12/lb",
        imageAlt: "Thịt nướng Việt Nam",
      },
      en: {
        name: "Grilled Pork",
        description: "Marinated Vietnamese grilled pork, sold by the pound.",
        price: "$12/lb",
        imageAlt: "Vietnamese grilled pork",
      },
    },
  },
];

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function nextUtcWeekday(weekday: number): Date {
  const date = new Date();
  const daysUntil = (weekday - date.getUTCDay() + 7) % 7 || 7;
  date.setUTCDate(date.getUTCDate() + daysUntil);
  date.setUTCHours(12, 0, 0, 0);
  return date;
}

function shiftUtcDays(date: Date, days: number): Date {
  const shifted = new Date(date);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted;
}

export function getDefaultTemporaryDishes(): TemporaryMenuDish[] {
  const saturday = nextUtcWeekday(6);
  const sunday = nextUtcWeekday(0);

  return [
    {
      id: "temporary-1",
      slot: 1,
      kind: "temporary",
      isActive: true,
      deliveryDate: toDateKey(saturday),
      orderDeadline: toDateKey(shiftUtcDays(saturday, -2)),
      imageUrl: "",
      copy: {
        vi: {
          name: "Bún Bò Huế",
          description: "Món bún bò cay thơm mở bán theo mẻ trong tuần.",
          price: "$15/tô",
          imageAlt: "Bún bò Huế",
        },
        en: {
          name: "Bun Bo Hue",
          description: "A spicy, aromatic beef noodle soup available in this weekly batch.",
          price: "$15/bowl",
          imageAlt: "Bun Bo Hue",
        },
      },
    },
    {
      id: "temporary-2",
      slot: 2,
      kind: "temporary",
      isActive: true,
      deliveryDate: toDateKey(sunday),
      orderDeadline: toDateKey(shiftUtcDays(sunday, -2)),
      imageUrl: "",
      copy: {
        vi: {
          name: "Bánh Bèo",
          description: "Bánh bèo mềm với tôm chấy và nước mắm, mở bán theo mẻ.",
          price: "$10/khay",
          imageAlt: "Bánh bèo",
        },
        en: {
          name: "Banh Beo",
          description: "Steamed rice cakes with shrimp topping and fish sauce.",
          price: "$10/tray",
          imageAlt: "Banh Beo",
        },
      },
    },
  ];
}

function rowToTemporaryDish(row: TemporaryDishRow): TemporaryMenuDish {
  const slot = row.slot === 2 ? 2 : 1;

  return {
    id: `temporary-${slot}`,
    slot,
    kind: "temporary",
    isActive: row.is_active === 1,
    deliveryDate: row.delivery_date,
    orderDeadline: row.order_deadline,
    imageUrl: row.image_url ?? "",
    copy: {
      en: {
        name: row.name_en,
        description: row.description_en,
        price: row.price_en,
        imageAlt: row.image_alt_en,
      },
      vi: {
        name: row.name_vi,
        description: row.description_vi,
        price: row.price_vi,
        imageAlt: row.image_alt_vi,
      },
    },
  };
}

export async function listTemporaryMenuDishes(): Promise<TemporaryMenuDish[]> {
  const defaults = getDefaultTemporaryDishes();

  try {
    const rows = await dbAll<TemporaryDishRow>(
      `SELECT
        slot,
        is_active,
        name_en,
        name_vi,
        description_en,
        description_vi,
        price_en,
        price_vi,
        delivery_date,
        order_deadline,
        image_url,
        image_alt_en,
        image_alt_vi
       FROM menu_temporary_dishes
       ORDER BY slot ASC`,
    );

    if (rows.length === 0) {
      return defaults;
    }

    const bySlot = new Map(rows.map((row) => [row.slot, rowToTemporaryDish(row)]));
    return defaults.map((fallback) => bySlot.get(fallback.slot) ?? fallback);
  } catch {
    return defaults;
  }
}

export async function getMenuData(): Promise<MenuData> {
  return {
    mainstayDishes: MAINSTAY_MENU_DISHES,
    temporaryDishes: await listTemporaryMenuDishes(),
  };
}

export async function saveTemporaryMenuDishes(
  dishes: SaveTemporaryDishInput[],
): Promise<TemporaryMenuDish[]> {
  for (const dish of dishes) {
    await dbRun(
      `INSERT INTO menu_temporary_dishes (
        slot,
        is_active,
        name_en,
        name_vi,
        description_en,
        description_vi,
        price_en,
        price_vi,
        delivery_date,
        order_deadline,
        image_url,
        image_alt_en,
        image_alt_vi,
        updated_at_utc
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(slot) DO UPDATE SET
        is_active = excluded.is_active,
        name_en = excluded.name_en,
        name_vi = excluded.name_vi,
        description_en = excluded.description_en,
        description_vi = excluded.description_vi,
        price_en = excluded.price_en,
        price_vi = excluded.price_vi,
        delivery_date = excluded.delivery_date,
        order_deadline = excluded.order_deadline,
        image_url = excluded.image_url,
        image_alt_en = excluded.image_alt_en,
        image_alt_vi = excluded.image_alt_vi,
        updated_at_utc = CURRENT_TIMESTAMP`,
      [
        dish.slot,
        dish.isActive ? 1 : 0,
        dish.nameEn,
        dish.nameVi,
        dish.descriptionEn,
        dish.descriptionVi,
        dish.priceEn,
        dish.priceVi,
        dish.deliveryDate,
        dish.orderDeadline,
        dish.imageUrl.trim() || null,
        dish.imageAltEn,
        dish.imageAltVi,
      ],
    );
  }

  return listTemporaryMenuDishes();
}
