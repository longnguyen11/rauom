"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { formatCurrency } from "@/lib/format";
import type { Dish } from "@/lib/types";

interface DishFilterGridProps {
  dishes: Dish[];
  tagOptions: { code: string; label: string }[];
}

export function DishFilterGrid({ dishes, tagOptions }: DishFilterGridProps) {
  const [activeTag, setActiveTag] = useState<string>("all");

  const filtered = useMemo(() => {
    if (activeTag === "all") {
      return dishes;
    }

    return dishes.filter((dish) =>
      dish.dietaryTags.some((tag) => tag.code === activeTag),
    );
  }, [activeTag, dishes]);

  return (
    <section className="dish-grid-section" aria-labelledby="dish-grid-heading">
      <div className="section-header">
        <h2 id="dish-grid-heading">Browse Dishes</h2>
        <p>Fresh-cook model: kitchen starts after order confirmation.</p>
      </div>

      <div className="chip-row" role="tablist" aria-label="Filter dishes by dietary tags">
        <button
          type="button"
          role="tab"
          aria-selected={activeTag === "all"}
          className={activeTag === "all" ? "chip active" : "chip"}
          onClick={() => setActiveTag("all")}
        >
          All
        </button>

        {tagOptions.map((tag) => (
          <button
            key={tag.code}
            type="button"
            role="tab"
            aria-selected={activeTag === tag.code}
            className={activeTag === tag.code ? "chip active" : "chip"}
            onClick={() => setActiveTag(tag.code)}
          >
            {tag.label}
          </button>
        ))}
      </div>

      <div className="dish-grid">
        {filtered.map((dish) => {
          const image = dish.images[0];
          return (
            <article key={dish.id} className="dish-card">
              <Link href={`/dishes/${dish.slug}`} className="dish-card-image-link">
                <Image
                  src={
                    image?.url ??
                    "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=900&q=80"
                  }
                  alt={image?.altText ?? dish.name}
                  width={640}
                  height={800}
                  className="dish-card-image"
                />
              </Link>

              <div className="dish-card-body">
                <div className="dish-card-top">
                  <h3>{dish.name}</h3>
                  <p className="dish-price">{formatCurrency(dish.priceCents)}</p>
                </div>

                <p className="dish-description">{dish.shortDescription}</p>

                <p className="lead-time-line">Minimum lead time: {dish.leadTimeDays} day(s)</p>

                <ul className="tag-row" aria-label="Dietary tags">
                  {dish.dietaryTags.map((tag) => (
                    <li key={`${dish.id}-${tag.code}`} className="tag-pill">
                      {tag.label}
                    </li>
                  ))}
                </ul>

                <div className="dish-actions">
                  <Link href={`/dishes/${dish.slug}`} className="btn-secondary">
                    View details
                  </Link>

                  <AddToCartButton
                    className="btn-primary"
                    dish={{
                      id: dish.id,
                      slug: dish.slug,
                      name: dish.name,
                      priceCents: dish.priceCents,
                      leadTimeDays: dish.leadTimeDays,
                      imageUrl: image?.url ?? "",
                    }}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
