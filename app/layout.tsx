import type { Metadata } from "next";
import Link from "next/link";
import { Fraunces, Manrope } from "next/font/google";

import { CartFab } from "@/components/cart-fab";
import { CartProvider } from "@/components/cart-context";
import { BRAND_NAME, BRAND_SUBTITLE } from "@/lib/constants";
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
  title: `${BRAND_NAME} | Orlando Vietnamese Home-Cooked Dishes`,
  description:
    "Browse featured Vietnamese and Asian home-cooked dishes from Rau Om in Orlando. Place delivery or pickup orders with lead-time protected checkout.",
  metadataBase: new URL("https://rau-om.example.com"),
  openGraph: {
    title: `${BRAND_NAME} | Orlando Vietnamese Home-Cooked Dishes`,
    description:
      "Fresh, cook-to-order Vietnamese and Asian dishes in Orlando. Delivery and pickup with clear lead-time scheduling.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${headingFont.variable} ${bodyFont.variable}`}>
        <CartProvider>
          <div className="site-shell">
            <header className="site-header">
              <Link href="/" className="brand-lockup" aria-label="Rau Om homepage">
                <span className="brand-name">{BRAND_NAME}</span>
                <span className="brand-subtitle">{BRAND_SUBTITLE}</span>
              </Link>

              <nav className="site-nav" aria-label="Main navigation">
                <Link href="/">Home</Link>
                <Link href="/archive">Archive</Link>
                <Link href="/how-ordering-works">How Ordering Works</Link>
                <Link href="/checkout">Checkout</Link>
                <Link href="/admin">Admin</Link>
              </nav>
            </header>

            <main>{children}</main>

            <footer className="site-footer">
              <p>
                {BRAND_NAME} | 720 Orange Ave, Longwood, FL 32750 | Delivery and pickup
                in Orlando area
              </p>
              <div className="footer-links">
                <Link href="/allergens">Allergens</Link>
                <Link href="/delivery-fees">Delivery Fees</Link>
                <Link href="/fresh-cook-policy">Fresh-Cook Policy</Link>
              </div>
            </footer>
          </div>

          <CartFab />
        </CartProvider>
      </body>
    </html>
  );
}
