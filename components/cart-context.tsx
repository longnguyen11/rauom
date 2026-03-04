"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { DishBulkDiscountTier } from "@/lib/types";

interface CartItem {
  dishId: string;
  slug: string;
  name: string;
  priceCents: number;
  leadTimeDays: number;
  imageUrl: string;
  bulkDiscountTiers: DishBulkDiscountTier[];
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotalCents: number;
  maxLeadTimeDays: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (dishId: string, quantity: number) => void;
  removeItem: (dishId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "rauom_cart_v1";

function normalizeBulkDiscountTiers(
  value: unknown,
): DishBulkDiscountTier[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      const row = entry as {
        minQuantity?: unknown;
        discountPercent?: unknown;
      };
      const minQuantity = Number(row.minQuantity);
      const discountPercent = Number(row.discountPercent);
      if (!Number.isFinite(minQuantity) || !Number.isFinite(discountPercent)) {
        return null;
      }

      return {
        minQuantity: Math.max(2, Math.floor(minQuantity)),
        discountPercent: Math.max(1, Math.min(90, Math.floor(discountPercent))),
      };
    })
    .filter((entry): entry is DishBulkDiscountTier => Boolean(entry))
    .sort((a, b) => a.minQuantity - b.minQuantity);
}

function readStorage(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as Array<{
      dishId?: unknown;
      slug?: unknown;
      name?: unknown;
      priceCents?: unknown;
      leadTimeDays?: unknown;
      imageUrl?: unknown;
      quantity?: unknown;
      bulkDiscountTiers?: unknown;
    }>;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((row) => {
        const dishId = String(row.dishId ?? "").trim();
        const name = String(row.name ?? "").trim();
        const slug = String(row.slug ?? "").trim();
        const imageUrl = String(row.imageUrl ?? "").trim();
        const priceCents = Number(row.priceCents ?? 0);
        const leadTimeDays = Number(row.leadTimeDays ?? 1);
        const quantity = Number(row.quantity ?? 1);
        if (!dishId || !name || !slug || !imageUrl || !Number.isFinite(priceCents)) {
          return null;
        }

        return {
          dishId,
          slug,
          name,
          priceCents: Math.max(0, Math.round(priceCents)),
          leadTimeDays: Math.max(1, Math.floor(leadTimeDays)),
          imageUrl,
          bulkDiscountTiers: normalizeBulkDiscountTiers(row.bulkDiscountTiers),
          quantity: Math.max(1, Math.min(25, Math.floor(quantity))),
        } as CartItem;
      })
      .filter((row): row is CartItem => Boolean(row));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => readStorage());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">, quantity = 1) => {
      setItems((current) => {
        const existing = current.find((entry) => entry.dishId === item.dishId);
        if (existing) {
          return current.map((entry) =>
            entry.dishId === item.dishId
              ? {
                  ...entry,
                  ...item,
                  quantity: Math.min(entry.quantity + quantity, 25),
                }
              : entry,
          );
        }

        return [...current, { ...item, quantity: Math.min(quantity, 25) }];
      });
    },
    [],
  );

  const updateQuantity = useCallback((dishId: string, quantity: number) => {
    setItems((current) => {
      if (quantity <= 0) {
        return current.filter((entry) => entry.dishId !== dishId);
      }

      return current.map((entry) =>
        entry.dishId === dishId ? { ...entry, quantity: Math.min(quantity, 25) } : entry,
      );
    });
  }, []);

  const removeItem = useCallback((dishId: string) => {
    setItems((current) => current.filter((entry) => entry.dishId !== dishId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotalCents = items.reduce(
      (sum, item) => sum + item.priceCents * item.quantity,
      0,
    );
    const maxLeadTimeDays =
      items.length > 0 ? Math.max(...items.map((item) => item.leadTimeDays)) : 1;

    return {
      items,
      itemCount,
      subtotalCents,
      maxLeadTimeDays,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    };
  }, [addItem, clearCart, items, removeItem, updateQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }

  return context;
}

export type { CartItem };
