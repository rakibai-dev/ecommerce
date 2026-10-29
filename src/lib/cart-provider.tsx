"use client";

import Link from "next/link";
import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import { Button } from "@/components/ui/button";
import {
  add,
  clear,
  getServerSnapshot,
  getSnapshot,
  remove,
  setQty,
  subscribe,
  type CartLine,
} from "@/lib/cart-store";

export type { CartLine } from "@/lib/cart-store";

type CartApi = {
  /** False during SSR/hydration; true from the first fully-client render. */
  hydrated: boolean;
  lines: CartLine[];
  count: number;
  subtotalCents: number;
  add: (product: import("@/lib/cart-store").AddableProduct, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartApi | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  // The cart must be empty while prerendering/SSR and real on the client.
  // useSyncExternalStore does exactly that: the server snapshot (EMPTY) is
  // used during hydration, then React re-renders from getSnapshot(). This
  // replaces the "read localStorage in a mount effect" idiom, which trips the
  // react-hooks/set-state-in-effect rule and renders twice after mount.
  // Store logic itself lives in src/lib/cart-store.ts (unit-tested).
  const lines = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // Server snapshot false → hydration render false → client snapshot true.
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);

  const value = useMemo<CartApi>(() => {
    let count = 0;
    let subtotalCents = 0;
    for (const line of lines) {
      count += line.qty;
      subtotalCents += line.priceCents * line.qty;
    }
    return { hydrated, lines, count, subtotalCents, add, setQty, remove, clear };
  }, [lines, hydrated]);

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart(): CartApi {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("useCart must be used within <CartProvider>");
  return cart;
}

export function CartBadge() {
  const { count, hydrated } = useCart();
  return (
    <Button asChild variant="ghost" size="sm" className="relative">
      <Link href="/cart">
        Cart
        {hydrated && count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </Link>
    </Button>
  );
}
