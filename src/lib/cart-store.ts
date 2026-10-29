/**
 * Framework-agnostic cart store: the shopping cart persisted in localStorage,
 * exposed through a tiny subscribe/getSnapshot API suited to React's
 * `useSyncExternalStore` (see cart-provider.tsx). Deliberately free of React
 * imports so the logic is directly unit-testable (tests/cart-store.test.ts).
 *
 * Semantics preserved from the original implementation:
 * - Server/prerendered renders see `EMPTY`; the first client render after
 *   hydration parses localStorage via getSnapshot().
 * - Snapshots are referentially stable: cached per distinct raw string.
 */
export type CartLine = {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  image: string;
  stock: number;
  qty: number;
};

export type AddableProduct = Omit<CartLine, "qty">;

/** Stable empty snapshot (never re-created) — identity is part of the contract. */
export const EMPTY: CartLine[] = [];

const STORAGE_KEY = "acme-cart-v1";

const listeners = new Set<() => void>();
let cache: { raw: string | null; lines: CartLine[] } | null = null;

export function parseCart(raw: string | null): CartLine[] {
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed.filter(
      (l): l is CartLine =>
        typeof l === "object" &&
        l !== null &&
        typeof (l as CartLine).id === "string" &&
        typeof (l as CartLine).qty === "number" &&
        typeof (l as CartLine).priceCents === "number",
    );
  } catch {
    return EMPTY;
  }
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Referentially stable snapshot: parsed once per distinct raw string. */
export function getSnapshot(): CartLine[] {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!cache || cache.raw !== raw) {
    cache = { raw, lines: parseCart(raw) };
  }
  return cache.lines;
}

export function getServerSnapshot(): CartLine[] {
  return EMPTY;
}

/** Write + notify every subscriber. Callers pass the full next-line list. */
export function commit(next: CartLine[]) {
  const raw = JSON.stringify(next);
  window.localStorage.setItem(STORAGE_KEY, raw);
  cache = { raw, lines: next };
  for (const listener of listeners) listener();
}

export function add(product: AddableProduct, qty = 1) {
  const prev = getSnapshot();
  const existing = prev.find((l) => l.id === product.id);
  if (existing) {
    commit(
      prev.map((l) =>
        l.id === product.id ? { ...l, qty: Math.min(l.qty + qty, l.stock) } : l,
      ),
    );
    return;
  }
  commit([...prev, { ...product, qty: Math.min(qty, product.stock || 1) }]);
}

export function setQty(id: string, qty: number) {
  commit(
    getSnapshot().flatMap((l) => {
      if (l.id !== id) return [l];
      const clamped = Math.max(0, Math.min(qty, l.stock));
      return clamped === 0 ? [] : [{ ...l, qty: clamped }];
    }),
  );
}

export function remove(id: string) {
  commit(getSnapshot().filter((l) => l.id !== id));
}

export function clear() {
  commit([]);
}
