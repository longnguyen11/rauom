"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { useCart } from "@/components/cart-context";
import { formatCurrency } from "@/lib/format";

export function CartFab() {
  const [open, setOpen] = useState(false);
  const { items, itemCount, subtotalCents, updateQuantity, removeItem } = useCart();

  return (
    <>
      <button
        className="cart-fab"
        type="button"
        aria-label="Open cart"
        onClick={() => setOpen(true)}
      >
        Cart ({itemCount})
      </button>

      {open && (
        <div className="cart-drawer-backdrop" onClick={() => setOpen(false)} role="presentation">
          <aside
            className="cart-drawer"
            onClick={(event) => event.stopPropagation()}
            aria-label="Shopping cart"
          >
            <header className="cart-drawer-header">
              <h2>Your Cart</h2>
              <button type="button" onClick={() => setOpen(false)}>
                Close
              </button>
            </header>

            {items.length === 0 ? (
              <p className="cart-empty">No dishes selected yet.</p>
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
                        <p>{formatCurrency(item.priceCents)} each</p>
                      </div>
                      <div className="cart-item-controls">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.dishId, item.quantity - 1)}
                          aria-label={`Decrease quantity for ${item.name}`}
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.dishId, item.quantity + 1)}
                          aria-label={`Increase quantity for ${item.name}`}
                        >
                          +
                        </button>
                        <button type="button" onClick={() => removeItem(item.dishId)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <footer className="cart-footer">
              <div>
                <p>Subtotal</p>
                <strong>{formatCurrency(subtotalCents)}</strong>
              </div>
              <Link href="/checkout" className="btn-primary" onClick={() => setOpen(false)}>
                Checkout
              </Link>
            </footer>
          </aside>
        </div>
      )}
    </>
  );
}
