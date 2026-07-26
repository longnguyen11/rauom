import { MenuLanguageToggle } from "@/components/menu-language-toggle";
import { getCurrentLocale } from "@/lib/i18n";
import { getMenuData } from "@/lib/menu";

export const dynamic = "force-dynamic";

const MENU_TEXT = {
  en: {
    eyebrow: "Orlando · Vietnamese cooking",
    title: "Rau Om",
    subtitle:
      "Comforting Vietnamese dishes, thoughtfully prepared for pickup or delivery.",
    mainstayTitle: "Always Available",
    mainstayIntro: "House favorites prepared to order.",
    temporaryTitle: "This Week at Rau Om",
    featuredLabel: "Weekly special",
    availableDates: "Available 07/30 – 08/02",
    orderTitle: "Place an order",
    orderCopy: "Choose your dishes, then call or text us to confirm availability and fulfillment.",
    vietnameseCall: "Vietnamese · Call Ms. Ha",
    englishCall: "English · Call",
    englishText: "English · Text",
  },
  vi: {
    eyebrow: "Orlando · Món Việt",
    title: "Rau Om",
    subtitle:
      "Những món Việt thân thuộc được chuẩn bị chu đáo, có pickup hoặc delivery.",
    mainstayTitle: "Món Luôn Có",
    mainstayIntro: "Các món nhà làm được chuẩn bị theo đơn.",
    temporaryTitle: "Món Tuần Này",
    featuredLabel: "Món đặc biệt trong tuần",
    availableDates: "Có từ 07/30 – 08/02",
    orderTitle: "Đặt món",
    orderCopy: "Chọn món, sau đó gọi hoặc nhắn tin để xác nhận món và cách nhận hàng.",
    vietnameseCall: "Tiếng Việt · Gọi chị Hà",
    englishCall: "English · Call",
    englishText: "English · Text",
  },
} as const;

export default async function MenuPage() {
  const locale = await getCurrentLocale("vi");
  const text = MENU_TEXT[locale];
  const menu = await getMenuData();
  const temporaryDishes = menu.temporaryDishes.filter((dish) => dish.isActive);

  return (
    <main className="menu-public-page">
      <header className="menu-hero">
        <div className="menu-hero-topline">
          <p className="menu-kicker">{text.eyebrow}</p>
          <MenuLanguageToggle locale={locale} />
        </div>
        <div className="menu-brand-block">
          <h1>{text.title}</h1>
          <p>{text.subtitle}</p>
        </div>
        <div className="menu-contact-actions" aria-label={text.orderTitle}>
          <a className="menu-action" href="tel:+18325189699">
            {text.vietnameseCall}
            <span>(832) 518-9699</span>
          </a>
          <a className="menu-action" href="tel:+17147575778">
            {text.englishCall}
            <span>(714) 757-5778</span>
          </a>
          <a className="menu-action" href="sms:+17147575778">
            {text.englishText}
          </a>
        </div>
      </header>

      {temporaryDishes.length > 0 ? (
        <section className="menu-feature-section" aria-labelledby="temporary-menu-heading">
          <p className="menu-section-number">01</p>
          <h2 id="temporary-menu-heading">{text.temporaryTitle}</h2>
          {temporaryDishes.map((dish) => {
            const copy = dish.copy[locale];

            return (
              <article className="menu-feature" key={dish.id}>
                <div className="menu-feature-photo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={dish.imageUrl} alt={copy.imageAlt} />
                </div>
                <div className="menu-feature-copy">
                  <p className="menu-feature-label">{text.featuredLabel}</p>
                  <div className="menu-feature-title">
                    <h3>{copy.name}</h3>
                    <strong>{copy.price}</strong>
                  </div>
                  <p className="menu-feature-description">{copy.description}</p>
                  <p className="menu-availability">{text.availableDates}</p>
                  <div className="menu-feature-actions">
                    <a href="tel:+18325189699">{text.vietnameseCall}</a>
                    <a href="sms:+17147575778">{text.englishText}</a>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : null}

      <section className="menu-list-section" aria-labelledby="mainstay-menu-heading">
        <div className="menu-list-heading">
          <p className="menu-section-number">02</p>
          <div>
            <h2 id="mainstay-menu-heading">{text.mainstayTitle}</h2>
            <p>{text.mainstayIntro}</p>
          </div>
        </div>
        <div className="menu-editorial-list">
          {menu.mainstayDishes.map((dish) => {
            const copy = dish.copy[locale];

            return (
              <article className="menu-editorial-item" key={dish.id}>
                <div>
                  <h3>{copy.name}</h3>
                  <p>{copy.description}</p>
                </div>
                <strong>{copy.price}</strong>
              </article>
            );
          })}
        </div>
      </section>

      <section className="menu-order-section" aria-labelledby="menu-order-heading">
        <p className="menu-section-number">03</p>
        <div className="menu-order-copy">
          <h2 id="menu-order-heading">{text.orderTitle}</h2>
          <p>{text.orderCopy}</p>
        </div>
        <div className="menu-order-links">
          <a href="tel:+18325189699">
            <span>{text.vietnameseCall}</span>
            <strong>(832) 518-9699</strong>
          </a>
          <a href="tel:+17147575778">
            <span>{text.englishCall}</span>
            <strong>(714) 757-5778</strong>
          </a>
          <a href="sms:+17147575778">
            <span>{text.englishText}</span>
            <strong>(714) 757-5778</strong>
          </a>
        </div>
      </section>
    </main>
  );
}
