import { MenuDishImage } from "@/components/menu-dish-image";
import { MenuLanguageToggle } from "@/components/menu-language-toggle";
import { getCurrentLocale } from "@/lib/i18n";
import { getMenuData } from "@/lib/menu";

export const dynamic = "force-dynamic";

const MENU_TEXT = {
  en: {
    eyebrow: "Vietnamese cuisine",
    title: "Rau Om Menu",
    subtitle:
      "Small-batch dishes for pickup or delivery. To order, contact Ms. Ha at (832) 518-9699.",
    mainstayTitle: "Mainstay Dishes",
    temporaryTitle: "Temporary Dishes",
    deliveryDate: "Delivery date",
    orderDeadline: "Last day to order",
    contact: "Contact Ms. Ha: (832) 518-9699",
  },
  vi: {
    eyebrow: "Ẩm thực Việt",
    title: "Thực Đơn Rau Om",
    subtitle:
      "Món nấu theo mẻ nhỏ, có pickup hoặc delivery. Đặt món xin liên hệ chị Hà: (832) 518-9699.",
    mainstayTitle: "Món Cố Định",
    temporaryTitle: "Món Tạm Thời",
    deliveryDate: "Ngày giao",
    orderDeadline: "Ngày cuối đặt món",
    contact: "Liên hệ chị Hà: (832) 518-9699",
  },
} as const;

function formatDate(dateKey: string, locale: "en" | "vi"): string {
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${dateKey}T12:00:00`));
}

export default async function MenuPage() {
  const locale = await getCurrentLocale();
  const text = MENU_TEXT[locale];
  const menu = await getMenuData();
  const temporaryDishes = menu.temporaryDishes.filter((dish) => dish.isActive);

  return (
    <main className="menu-public-page">
      <header className="menu-hero">
        <div className="menu-brand-block">
          <p className="menu-kicker">{text.eyebrow}</p>
          <h1>{text.title}</h1>
          <p>{text.subtitle}</p>
        </div>
        <MenuLanguageToggle locale={locale} />
      </header>

      <section className="menu-section" aria-labelledby="mainstay-menu-heading">
        <div className="menu-section-heading">
          <h2 id="mainstay-menu-heading">{text.mainstayTitle}</h2>
          <p>{text.contact}</p>
        </div>
        <div className="menu-card-grid">
          {menu.mainstayDishes.map((dish) => {
            const copy = dish.copy[locale];

            return (
              <article className="menu-card" key={dish.id}>
                <div className="menu-card-photo">
                  <MenuDishImage src={dish.imageUrl} alt={copy.imageAlt} />
                </div>
                <div className="menu-card-body">
                  <div className="menu-card-title-row">
                    <h3>{copy.name}</h3>
                    <strong>{copy.price}</strong>
                  </div>
                  <p>{copy.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="menu-section" aria-labelledby="temporary-menu-heading">
        <div className="menu-section-heading">
          <h2 id="temporary-menu-heading">{text.temporaryTitle}</h2>
        </div>
        <div className="menu-card-grid menu-card-grid-temporary">
          {temporaryDishes.map((dish) => {
            const copy = dish.copy[locale];

            return (
              <article className="menu-card menu-card-temporary" key={dish.id}>
                <div className="menu-card-photo">
                  <MenuDishImage src={dish.imageUrl} alt={copy.imageAlt} />
                </div>
                <div className="menu-card-body">
                  <div className="menu-card-title-row">
                    <h3>{copy.name}</h3>
                    <strong>{copy.price}</strong>
                  </div>
                  <p>{copy.description}</p>
                  <dl className="menu-date-list">
                    <div>
                      <dt>{text.deliveryDate}</dt>
                      <dd>{formatDate(dish.deliveryDate, locale)}</dd>
                    </div>
                    <div>
                      <dt>{text.orderDeadline}</dt>
                      <dd>{formatDate(dish.orderDeadline, locale)}</dd>
                    </div>
                  </dl>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
