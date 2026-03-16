import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { getDishBySlug, mapDishesBySlug } from "@/lib/dishes";
import { formatCurrency } from "@/lib/format";
import { getCurrentMessages } from "@/lib/i18n";
import type { DishBulkDiscountTier } from "@/lib/types";

interface DishPageProps {
  params: Promise<{ slug: string }>;
}

function formatDishBulkDiscountLine(
  tiers: DishBulkDiscountTier[],
  locale: "en" | "vi",
): string[] {
  if (tiers.length === 0) {
    return [];
  }

  return tiers
    .slice()
    .sort((a, b) => a.minQuantity - b.minQuantity)
    .map((tier) =>
      locale === "vi"
        ? `Từ ${tier.minQuantity} phần giảm ${tier.discountPercent}%`
        : `${tier.minQuantity}+ servings save ${tier.discountPercent}%`,
    );
}

export async function generateMetadata({ params }: DishPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { locale } = await getCurrentMessages();
  const dish = await getDishBySlug(slug, locale);

  if (!dish) {
    return {
      title: "Dish not found | Rau Om",
    };
  }

  return {
    title: `${dish.name} | Rau Om`,
    description: dish.shortDescription,
    openGraph: {
      title: `${dish.name} | Rau Om`,
      description: dish.shortDescription,
      type: "article",
      images: dish.images[0] ? [{ url: dish.images[0].url }] : undefined,
    },
  };
}

export async function generateStaticParams() {
  const map = await mapDishesBySlug();
  return [...map.keys()].map((slug) => ({ slug }));
}

export default async function DishPage({ params }: DishPageProps) {
  const { slug } = await params;
  const { locale, messages } = await getCurrentMessages();
  const dish = await getDishBySlug(slug, locale);

  if (!dish) {
    notFound();
  }

  const image =
    dish.images[0]?.url ??
    "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=1400&q=80";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: dish.name,
    description: dish.longDescription,
    image: dish.images.map((item) => item.url),
    offers: {
      "@type": "Offer",
      priceCurrency: dish.currency,
      price: (dish.priceCents / 100).toFixed(2),
      availability:
        dish.status === "live"
          ? "https://schema.org/InStock"
          : "https://schema.org/LimitedAvailability",
    },
  };

  return (
    <article className="page-prose">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <p>
        <Link href="/">{messages.dishPage.backToDishes}</Link>
      </p>

      <h1>{dish.name}</h1>
      <p>{dish.shortDescription}</p>

      <div className="dish-detail-grid">
        <Image
          src={image}
          alt={dish.images[0]?.altText ?? dish.name}
          width={1200}
          height={900}
          priority
          style={{ borderRadius: "16px", objectFit: "cover", width: "100%" }}
        />

        <div style={{ display: "grid", gap: "0.8rem", alignContent: "start" }}>
          <p>
            <strong>{formatCurrency(dish.priceCents)}</strong>
          </p>
          <p>{dish.longDescription}</p>
          {(dish.category === "bundle" || dish.isAnchorDish) && (
            <ul className="tag-row">
              {dish.category === "bundle" && (
                <li className="tag-pill tag-pill-bundle">{messages.dishGrid.bundleMealBadge}</li>
              )}
              {dish.isAnchorDish && (
                <li className="tag-pill tag-pill-anchor">{messages.dishGrid.anchorDishBadge}</li>
              )}
            </ul>
          )}
          <p>
            <strong>{messages.dishPage.leadTime}:</strong> {dish.leadTimeDays} {messages.common.daySuffix}
          </p>
          <div className="dish-bulk-discount-line">
            <strong>{messages.dishGrid.bulkDiscountLabel}:</strong>
            {dish.bulkDiscountTiers.length > 0 ? (
              <ul className="dish-bulk-discount-list">
                {formatDishBulkDiscountLine(dish.bulkDiscountTiers, locale).map((line) => (
                  <li key={`${dish.id}-${line}`}>{line}</li>
                ))}
              </ul>
            ) : (
              <p>{messages.dishGrid.bulkDiscountNone}</p>
            )}
          </div>

          <div>
            <h2>{messages.dishPage.dietaryTags}</h2>
            <ul className="tag-row" style={{ marginTop: "0.4rem" }}>
              {dish.dietaryTags.map((tag) => (
                <li key={tag.code} className="tag-pill">
                  {tag.label}
                </li>
              ))}
            </ul>
          </div>

          <AddToCartButton
            className="btn-primary"
            locale={locale}
            dish={{
              id: dish.id,
              slug: dish.slug,
              name: dish.name,
              priceCents: dish.priceCents,
              leadTimeDays: dish.leadTimeDays,
              imageUrl: image,
              bulkDiscountTiers: dish.bulkDiscountTiers,
            }}
          />
        </div>
      </div>

      <section>
        <h2>{messages.dishPage.ingredients}</h2>
        <ul>
          {dish.ingredients.map((ingredient) => (
            <li key={ingredient.name}>
              {ingredient.name}
              {ingredient.isAllergen ? ` ${messages.dishPage.allergenSuffix}` : ""}
            </li>
          ))}
        </ul>
      </section>

      {dish.nutrition && (
        <section>
          <h2>{messages.dishPage.nutritionOptional}</h2>
          <ul>
            <li>{messages.dishPage.calories}: {dish.nutrition.calories ?? messages.dishPage.na}</li>
            <li>{messages.dishPage.protein}: {dish.nutrition.proteinG ?? messages.dishPage.na}g</li>
            <li>{messages.dishPage.carbs}: {dish.nutrition.carbsG ?? messages.dishPage.na}g</li>
            <li>{messages.dishPage.fat}: {dish.nutrition.fatG ?? messages.dishPage.na}g</li>
            <li>{messages.dishPage.sodium}: {dish.nutrition.sodiumMg ?? messages.dishPage.na}mg</li>
          </ul>
          {dish.nutrition.notes && <p>{dish.nutrition.notes}</p>}
        </section>
      )}
    </article>
  );
}
