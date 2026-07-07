"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { Dish } from "@/lib/types";
import { getMessages, type Locale } from "@/lib/i18n-dictionary";
import { formatDishUnitPrice } from "@/lib/menu-pricing";

export function HeroCarousel({ dishes, locale }: { dishes: Dish[]; locale: Locale }) {
  const [index, setIndex] = useState(0);
  const t = getMessages(locale);

  useEffect(() => {
    if (dishes.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % dishes.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, [dishes.length]);

  if (dishes.length === 0) {
    return null;
  }

  const activeDish = dishes[index % dishes.length];
  const image =
    activeDish.images[0]?.url ??
    "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=1600&q=80";
  const menuCta = locale === "vi" ? "Xem thuc don" : "Order from menu";

  return (
    <section className="hero-carousel" aria-label={t.hero.sectionAria}>
      <div className="hero-image-wrap">
        <Image
          src={image}
          alt={activeDish.images[0]?.altText ?? activeDish.name}
          fill
          priority
          sizes="(max-width: 900px) 100vw, 60vw"
          className="hero-image"
        />
      </div>

      <div className="hero-overlay">
        <p className="eyebrow">{t.hero.eyebrow}</p>
        <h2>{activeDish.name}</h2>
        <p>{activeDish.shortDescription}</p>
        <div className="hero-actions">
          <Link href="#menu" className="btn-primary">
            {menuCta}
          </Link>
          <Link href={`/dishes/${activeDish.slug}`} className="btn-secondary hero-secondary-link">
            {t.common.viewDetails}
          </Link>
          <span className="hero-price">
            {formatDishUnitPrice({
              priceCents: activeDish.priceCents,
              currency: activeDish.currency,
              slug: activeDish.slug,
            })}
          </span>
        </div>

        <div className="carousel-dots" role="tablist" aria-label={t.hero.controlsAria}>
          {dishes.map((dish, dishIndex) => (
            <button
              key={dish.id}
              type="button"
              role="tab"
              className={dishIndex === index ? "dot active" : "dot"}
              aria-label={`${t.hero.showDishPrefix} ${dish.name}`}
              aria-selected={dishIndex === index}
              onClick={() => setIndex(dishIndex)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
