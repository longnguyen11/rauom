import type { Metadata } from "next";
import Link from "next/link";
import { Fraunces, Manrope } from "next/font/google";

import { CartFab } from "@/components/cart-fab";
import { CartProvider } from "@/components/cart-context";
import { LocaleToggle } from "@/components/locale-toggle";
import { BRAND_NAME, BRAND_SUBTITLE } from "@/lib/constants";
import { getCurrentMessages } from "@/lib/i18n";
import "./globals.css";

const headingFont = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: `${BRAND_NAME} | Weekly Batch-Cooked Vietnamese Home Meals`,
  description:
    "Order Monday-Friday from Rau Om's weekly menu, then receive Saturday batch-cooked Vietnamese home meals in Orlando.",
  metadataBase: new URL("https://rau-om.example.com"),
  openGraph: {
    title: `${BRAND_NAME} | Weekly Batch-Cooked Vietnamese Home Meals`,
    description:
      "Weekly batch-cooked Vietnamese home meals in Orlando with Saturday fulfillment and early-order discounts.",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale, messages } = await getCurrentMessages();

  return (
    <html lang={locale}>
      <body className={`${headingFont.variable} ${bodyFont.variable}`}>
        <CartProvider>
          <div className="site-shell">
            <header className="site-header">
              <Link href="/" className="brand-lockup" aria-label={messages.layout.brandAria}>
                <span className="brand-name">{BRAND_NAME}</span>
                <span className="brand-subtitle">{BRAND_SUBTITLE}</span>
              </Link>

              <div className="header-right">
                <nav className="site-nav" aria-label={messages.layout.mainNavigationAria}>
                  <Link href="/">{messages.layout.navHome}</Link>
                  <Link href="/how-ordering-works">{messages.layout.navHowOrdering}</Link>
                  <Link href="/checkout">{messages.layout.navCheckout}</Link>
                </nav>
                <LocaleToggle locale={locale} />
              </div>
            </header>

            <main>{children}</main>

            <footer className="site-footer">
              <p>{messages.layout.footerLine}</p>
              <div className="footer-links">
                <Link href="/allergens">{messages.layout.footerAllergens}</Link>
                <Link href="/delivery-fees">{messages.layout.footerDeliveryFees}</Link>
                <Link href="/fresh-cook-policy">{messages.layout.footerFreshCook}</Link>
              </div>
            </footer>
          </div>

          <CartFab locale={locale} />
        </CartProvider>
      </body>
    </html>
  );
}
