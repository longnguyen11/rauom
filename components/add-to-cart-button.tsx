"use client";

import { useState } from "react";

import { useCart } from "@/components/cart-context";

interface AddToCartButtonProps {
  dish: {
    id: string;
    slug: string;
    name: string;
    priceCents: number;
    leadTimeDays: number;
    imageUrl: string;
  };
  className?: string;
}

export function AddToCartButton({ dish, className }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        addItem(
          {
            dishId: dish.id,
            slug: dish.slug,
            name: dish.name,
            priceCents: dish.priceCents,
            leadTimeDays: dish.leadTimeDays,
            imageUrl: dish.imageUrl,
          },
          1,
        );

        setJustAdded(true);
        window.setTimeout(() => setJustAdded(false), 1200);
      }}
    >
      {justAdded ? "Added" : "Add to Cart"}
    </button>
  );
}
