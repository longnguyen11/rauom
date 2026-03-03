"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { Dish } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

export function HeroCarousel({ dishes }: { dishes: Dish[] }) {
  const [index, setIndex] = useState(0);

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

  return (
    <section className="hero-carousel" aria-label="Featured dishes">
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
        <p className="eyebrow">This Week&apos;s Featured Dish</p>
        <h1>{activeDish.name}</h1>
        <p>{activeDish.shortDescription}</p>
        <div className="hero-actions">
          <Link href={`/dishes/${activeDish.slug}`} className="btn-primary">
            View details
          </Link>
          <span className="hero-price">{formatCurrency(activeDish.priceCents)}</span>
        </div>

        <div className="carousel-dots" role="tablist" aria-label="Carousel controls">
          {dishes.map((dish, dishIndex) => (
            <button
              key={dish.id}
              type="button"
              role="tab"
              className={dishIndex === index ? "dot active" : "dot"}
              aria-label={`Show ${dish.name}`}
              aria-selected={dishIndex === index}
              onClick={() => setIndex(dishIndex)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
