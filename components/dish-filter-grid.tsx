"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { getMessages, type Locale } from "@/lib/i18n-dictionary";
import { formatDishUnitPrice } from "@/lib/menu-pricing";
import type { Dish } from "@/lib/types";

interface DishFilterGridProps {
  dishes: Dish[];
  locale: Locale;
}

export function DishFilterGrid({ dishes, locale }: DishFilterGridProps) {
  const t = getMessages(locale);
  const [query, setQuery] = useState("");
  const orderedDishes = useMemo(() => {
    return [...dishes].sort((a, b) => {
      const anchorRankA = a.isAnchorDish ? 1 : 0;
      const anchorRankB = b.isAnchorDish ? 1 : 0;
      return anchorRankB - anchorRankA || a.name.localeCompare(b.name);
    });
  }, [dishes]);
  const visibleDishes = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) {
      return orderedDishes;
    }

    return orderedDishes.filter((dish) => {
      const searchableText = [
        dish.name,
        dish.shortDescription,
        ...dish.ingredients.map((ingredient) => ingredient.name),
      ]
        .join(" ")
        .toLocaleLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [orderedDishes, query]);

  return (
    <section className="dish-grid-section" id="menu" aria-labelledby="dish-grid-heading">
      <div className="menu-toolbar">
        <div className="section-header">
          <p className="section-kicker">Current batch menu</p>
          <h2 id="dish-grid-heading">{t.dishGrid.title}</h2>
          <p>{t.dishGrid.subtitle}</p>
        </div>

        <label className="menu-search">
          <span className="sr-only">Search menu</span>
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="m14.2 14.2 3.1 3.1M8.6 15.1a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="search"
            placeholder="Search Rau Om"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>

      <div className="dish-grid">
        {visibleDishes.map((dish) => {
          const image = dish.images[0];
          const imageUrl =
            image?.url ??
            "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=900&q=80";
          const allergens = dish.ingredients.filter((ingredient) => ingredient.isAllergen);

          return (
            <article key={dish.id} className="dish-card">
              <div className="dish-card-body">
                <Link href={`/dishes/${dish.slug}`} className="dish-card-copy">
                  <div className="dish-card-top">
                    <h3>{dish.name}</h3>
                    {dish.isAnchorDish ? (
                      <span className="anchor-note">Anchor</span>
                    ) : null}
                  </div>

                  <p className="dish-price">
                    {formatDishUnitPrice({
                      priceCents: dish.priceCents,
                      currency: dish.currency,
                      slug: dish.slug,
                    })}
                  </p>

                  <p className="dish-description">{dish.shortDescription}</p>

                  <p className="dish-meta-line">
                    <strong>Ingredients:</strong>{" "}
                    {dish.ingredients.map((ingredient) => ingredient.name).join(", ")}
                  </p>
                  <p
                    className={
                      allergens.length > 0
                        ? "dish-meta-line allergen-warning"
                        : "dish-meta-line"
                    }
                  >
                    <strong>Allergy warning:</strong>{" "}
                    {allergens.length > 0
                      ? `Contains: ${allergens.map((ingredient) => ingredient.name).join(", ")}`
                      : "No major allergens listed. Please contact us if you have a severe allergy."}
                  </p>
                </Link>
              </div>

              <div className="dish-card-media">
                <Link href={`/dishes/${dish.slug}`} className="dish-card-image-link">
                  <Image
                    src={imageUrl}
                    alt={image?.altText ?? dish.name}
                    width={320}
                    height={220}
                    className="dish-card-image"
                  />
                </Link>

                <AddToCartButton
                  variant="compact"
                  locale={locale}
                  dish={{
                    id: dish.id,
                    slug: dish.slug,
                    name: dish.name,
                    priceCents: dish.priceCents,
                    leadTimeDays: dish.leadTimeDays,
                    imageUrl,
                    bulkDiscountTiers: dish.bulkDiscountTiers,
                  }}
                />
              </div>
            </article>
          );
        })}
      </div>

      {visibleDishes.length === 0 ? (
        <p className="menu-empty">No dishes match this search.</p>
      ) : null}
    </section>
  );
}
