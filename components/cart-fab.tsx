"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { useCart } from "@/components/cart-context";
import { formatCurrency } from "@/lib/format";
import { getMessages, type Locale } from "@/lib/i18n-dictionary";
import type { DishBulkDiscountTier } from "@/lib/types";

function getDiscountPercentForQuantity(
  quantity: number,
  tiers: DishBulkDiscountTier[],
): number {
  let discountPercent = 0;
  for (const tier of tiers) {
    if (quantity >= tier.minQuantity) {
      discountPercent = Math.max(discountPercent, tier.discountPercent);
    }
  }

  return discountPercent;
}

function formatTierSummary(
  tiers: DishBulkDiscountTier[],
  locale: Locale,
  noneLabel: string,
): string {
  if (tiers.length === 0) {
    return noneLabel;
  }

  return tiers
    .slice()
    .sort((a, b) => a.minQuantity - b.minQuantity)
    .map((tier) =>
      locale === "vi"
        ? `Từ ${tier.minQuantity} phần giảm ${tier.discountPercent}%`
        : `${tier.minQuantity}+ servings save ${tier.discountPercent}%`,
    )
    .join(" · ");
}

export function CartFab({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const { items, itemCount, subtotalCents, updateQuantity, removeItem } = useCart();
  const t = getMessages(locale);
  const cartBulkDiscountCents = items.reduce((sum, item) => {
    const lineSubtotalCents = item.priceCents * item.quantity;
    const discountPercent = getDiscountPercentForQuantity(
      item.quantity,
      item.bulkDiscountTiers,
    );
    const lineDiscountCents = Math.round((lineSubtotalCents * discountPercent) / 100);
    return sum + lineDiscountCents;
  }, 0);
  const subtotalAfterDiscountCents = Math.max(0, subtotalCents - cartBulkDiscountCents);

  if (itemCount === 0) {
    return null;
  }

  return (
    <>
      <button
        className="cart-fab"
        type="button"
        aria-label={t.cart.openAria}
        onClick={() => setOpen(true)}
      >
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
        <span className="cart-fab-label">{t.cart.buttonLabel}</span>
      </button>

      {open && itemCount > 0 && (
        <div className="cart-drawer-backdrop" onClick={() => setOpen(false)} role="presentation">
          <aside
            className="cart-drawer"
            onClick={(event) => event.stopPropagation()}
            aria-label={t.cart.drawerAria}
          >
            <header className="cart-drawer-header">
              <h2>{t.cart.title}</h2>
              <button type="button" onClick={() => setOpen(false)}>
                {t.cart.close}
              </button>
            </header>

            <ul className="cart-list">
              {items.map((item) => (
                <li key={item.dishId} className="cart-item">
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    width={72}
                    height={72}
                    className="cart-item-image"
                  />
                  <div className="cart-item-content">
                    <div>
                      <h3>{item.name}</h3>
                      <p>
                        {formatCurrency(item.priceCents)} {t.common.each}
                      </p>
                      <p className="cart-item-bulk-line">
                        {t.dishGrid.bulkDiscountLabel}:{" "}
                        {formatTierSummary(
                          item.bulkDiscountTiers,
                          locale,
                          t.dishGrid.bulkDiscountNone,
                        )}
                      </p>
                      {(() => {
                        const lineSubtotalCents = item.priceCents * item.quantity;
                        const discountPercent = getDiscountPercentForQuantity(
                          item.quantity,
                          item.bulkDiscountTiers,
                        );
                        const lineDiscountCents = Math.round(
                          (lineSubtotalCents * discountPercent) / 100,
                        );

                        if (lineDiscountCents <= 0) {
                          return null;
                        }

                        return (
                          <p className="cart-item-discount-line">
                            {t.checkout.bulkDiscount}: -{formatCurrency(lineDiscountCents)} (
                            {discountPercent}%)
                          </p>
                        );
                      })()}
                    </div>
                    <div className="cart-item-controls">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.dishId, item.quantity - 1)}
                        aria-label={`${t.cart.decreaseQtyPrefix} ${item.name}`}
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.dishId, item.quantity + 1)}
                        aria-label={`${t.cart.increaseQtyPrefix} ${item.name}`}
                      >
                        +
                      </button>
                      <button type="button" onClick={() => removeItem(item.dishId)}>
                        {t.cart.remove}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="cart-footer">
              <div>
                <p>{t.cart.subtotal}</p>
                <strong>{formatCurrency(subtotalCents)}</strong>
                {cartBulkDiscountCents > 0 && (
                  <>
                    <p className="cart-footer-discount">
                      {t.checkout.bulkDiscount}: -{formatCurrency(cartBulkDiscountCents)}
                    </p>
                    <p className="cart-footer-after-discount">
                      {t.checkout.subtotalAfterDiscount}:{" "}
                      <strong>{formatCurrency(subtotalAfterDiscountCents)}</strong>
                    </p>
                  </>
                )}
              </div>
              <Link href="/checkout" className="btn-primary" onClick={() => setOpen(false)}>
                {t.cart.checkout}
              </Link>
            </footer>
          </aside>
        </div>
      )}
    </>
  );
}
