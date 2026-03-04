"use client";

import { useState } from "react";

import { useCart } from "@/components/cart-context";
import { getMessages, type Locale } from "@/lib/i18n-dictionary";
import type { DishBulkDiscountTier } from "@/lib/types";

interface AddToCartButtonProps {
  dish: {
    id: string;
    slug: string;
    name: string;
    priceCents: number;
    leadTimeDays: number;
    imageUrl: string;
    bulkDiscountTiers: DishBulkDiscountTier[];
  };
  locale: Locale;
  className?: string;
}

export function AddToCartButton({ dish, locale, className }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const t = getMessages(locale);
  const resolvedClassName = className
    ? `${className} add-to-cart-button`
    : "btn-primary add-to-cart-button";

  return (
    <button
      type="button"
      className={resolvedClassName}
      onClick={() => {
        addItem(
          {
            dishId: dish.id,
            slug: dish.slug,
            name: dish.name,
            priceCents: dish.priceCents,
            leadTimeDays: dish.leadTimeDays,
            imageUrl: dish.imageUrl,
            bulkDiscountTiers: dish.bulkDiscountTiers,
          },
          1,
        );

        setJustAdded(true);
        window.setTimeout(() => setJustAdded(false), 1200);
      }}
    >
      {justAdded ? t.common.added : t.common.addToCart}
    </button>
  );
}
