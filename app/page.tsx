import Link from "next/link";

import { DishFilterGrid } from "@/components/dish-filter-grid";
import { HeroCarousel } from "@/components/hero-carousel";
import { NewsletterForm } from "@/components/newsletter-form";
import { getDietaryTagOptions, getFeaturedDishes, listLiveDishes } from "@/lib/dishes";

export default async function HomePage() {
  const [dishes, featured, tagOptions] = await Promise.all([
    listLiveDishes(),
    getFeaturedDishes(4),
    getDietaryTagOptions(),
  ]);

  return (
    <>
      <HeroCarousel dishes={featured.length > 0 ? featured : dishes.slice(0, 4)} />

      <DishFilterGrid dishes={dishes} tagOptions={tagOptions} />

      <section className="page-prose" style={{ marginTop: "1.2rem" }}>
        <h2>Trust and Freshness</h2>
        <p>
          Every order is prepared after confirmation. Rau Om does not batch-cook for
          instant dispatch, so quality and timing stay consistent.
        </p>
        <ul>
          <li>Lead-time protected scheduling (1-3 days by dish complexity)</li>
          <li>Delivery range checks with pickup fallback</li>
          <li>Manual payment support at launch: cash, Zelle, Venmo</li>
        </ul>
        <p>
          <Link href="/how-ordering-works" className="btn-secondary">
            Read the full ordering flow
          </Link>
        </p>
      </section>

      <NewsletterForm />
    </>
  );
}
