import Link from "next/link";

import { DishFilterGrid } from "@/components/dish-filter-grid";
import { HeroCarousel } from "@/components/hero-carousel";
import { NewsletterForm } from "@/components/newsletter-form";
import { getDietaryTagOptions, getFeaturedDishes, listLiveDishes } from "@/lib/dishes";
import { getCurrentMessages } from "@/lib/i18n";

export default async function HomePage() {
  const [{ locale, messages }, dishes, featured, tagOptions] = await Promise.all([
    getCurrentMessages(),
    listLiveDishes(),
    getFeaturedDishes(4),
    getDietaryTagOptions(),
  ]);

  return (
    <>
      <HeroCarousel locale={locale} dishes={featured.length > 0 ? featured : dishes.slice(0, 4)} />

      <DishFilterGrid locale={locale} dishes={dishes} tagOptions={tagOptions} />

      <section className="page-prose" style={{ marginTop: "1.2rem" }}>
        <h2>{messages.home.trustTitle}</h2>
        <p>{messages.home.trustBody}</p>
        <ul>
          <li>{messages.home.trustBulletLeadTime}</li>
          <li>{messages.home.trustBulletDelivery}</li>
          <li>{messages.home.trustBulletPayment}</li>
        </ul>
        <p>
          <Link href="/how-ordering-works" className="btn-secondary">
            {messages.home.readFlow}
          </Link>
        </p>
      </section>

      <NewsletterForm locale={locale} />
    </>
  );
}
