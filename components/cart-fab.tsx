"use client";

import Link from "next/link";

import { useCart } from "@/components/cart-context";
import { getMessages, type Locale } from "@/lib/i18n-dictionary";

export function CartFab({ locale }: { locale: Locale }) {
  const { itemCount } = useCart();
  const t = getMessages(locale);

  if (itemCount === 0) {
    return null;
  }

  return (
    <Link className="cart-fab" href="/checkout" aria-label={t.cart.openAria}>
      <span className="cart-fab-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" role="presentation">
          <path
            d="M4 5h2l2.1 9.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H7.2"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="10" cy="19" r="1.35" fill="currentColor" />
          <circle cx="17" cy="19" r="1.35" fill="currentColor" />
        </svg>
      </span>
      <span className="cart-fab-count" aria-hidden="true">
        {itemCount}
      </span>
      <span className="cart-fab-label">{t.cart.checkout}</span>
    </Link>
  );
}
