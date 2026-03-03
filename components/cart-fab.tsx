"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { useCart } from "@/components/cart-context";
import { formatCurrency } from "@/lib/format";
import { getMessages, type Locale } from "@/lib/i18n-dictionary";

export function CartFab({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const { items, itemCount, subtotalCents, updateQuantity, removeItem } = useCart();
  const t = getMessages(locale);

  return (
    <>
      <button
        className="cart-fab"
        type="button"
        aria-label={t.cart.openAria}
        onClick={() => setOpen(true)}
      >
        {t.cart.buttonLabel} ({itemCount})
      </button>

      {open && (
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

            {items.length === 0 ? (
              <p className="cart-empty">{t.cart.empty}</p>
            ) : (
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
            )}

            <footer className="cart-footer">
              <div>
                <p>{t.cart.subtotal}</p>
                <strong>{formatCurrency(subtotalCents)}</strong>
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
