"use client";

import { useState } from "react";

import { useCart } from "@/components/cart-context";
import { getMessages, type Locale } from "@/lib/i18n-dictionary";
import { getDishQuantityLabel } from "@/lib/menu-pricing";
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
  variant?: "full" | "compact";
}

export function AddToCartButton({
  dish,
  locale,
  className,
  variant = "full",
}: AddToCartButtonProps) {
  const { addItem, items, updateQuantity } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const t = getMessages(locale);
  const cartQuantity = items.find((item) => item.dishId === dish.id)?.quantity ?? 0;
  const resolvedClassName = className
    ? `${className} add-to-cart-button`
    : "btn-primary add-to-cart-button";

  const addToCart = (amount: number) => {
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
      amount,
    );

    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 900);
  };

  if (variant === "compact") {
    return (
      <div
        className={cartQuantity > 0 ? "quick-add-control active" : "quick-add-control"}
        data-added={justAdded ? "true" : "false"}
      >
        {cartQuantity > 0 ? (
          <>
            <button
              type="button"
              className="quick-add-step"
              aria-label={`Decrease quantity for ${dish.name}`}
              onClick={() => updateQuantity(dish.id, cartQuantity - 1)}
            >
              -
            </button>
            <span aria-label={`${cartQuantity} in cart`}>{cartQuantity}</span>
            <button
              type="button"
              className="quick-add-step"
              aria-label={`Increase quantity for ${dish.name}`}
              onClick={() => addToCart(1)}
            >
              +
            </button>
          </>
        ) : (
          <button
            type="button"
            className="quick-add-main"
            aria-label={`Add ${dish.name} to cart`}
            onClick={() => addToCart(1)}
          >
            +
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="add-to-cart-control">
      <label className="add-to-cart-quantity">
        {getDishQuantityLabel(dish.slug)}
        <input
          type="number"
          min={1}
          max={25}
          value={quantity}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (!Number.isFinite(next)) {
              return;
            }
            setQuantity(Math.max(1, Math.min(25, Math.floor(next))));
          }}
        />
      </label>

      <button
        type="button"
        className={resolvedClassName}
        onClick={() => addToCart(quantity)}
      >
        {justAdded ? t.common.added : t.common.addToCart}
      </button>
    </div>
  );
}
