import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { getDishBySlug, mapDishesBySlug } from "@/lib/dishes";
import { getCurrentMessages } from "@/lib/i18n";
import { formatDishUnitPrice, getDishRequiredLeadTimeDays } from "@/lib/menu-pricing";

interface DishPageProps {
  params: Promise<{ slug: string }>;
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
  const requiredLeadTimeDays = getDishRequiredLeadTimeDays(dish.slug);

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
            <strong>
              {formatDishUnitPrice({
                priceCents: dish.priceCents,
                currency: dish.currency,
                slug: dish.slug,
              })}
            </strong>
          </p>
          <p>{dish.longDescription}</p>
          {dish.isAnchorDish && (
            <ul className="tag-row">
              <li className="tag-pill tag-pill-anchor">{messages.dishGrid.anchorDishBadge}</li>
            </ul>
          )}
          {requiredLeadTimeDays > 0 ? (
            <p>
              <strong>{messages.dishPage.leadTime}:</strong> {requiredLeadTimeDays}{" "}
              {messages.common.daySuffix}
            </p>
          ) : null}

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
