// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";

type Store = typeof import("@/lib/cart-store");
type Addable = import("@/lib/cart-store").AddableProduct;

/**
 * The module keeps module-level state (subscriber set + snapshot cache), so
 * every test gets a fresh module instance. localStorage is cleared alongside
 * it, mirroring a browser reload.
 */
let store: Store;

beforeEach(async () => {
  vi.resetModules();
  localStorage.clear();
  store = await import("@/lib/cart-store");
});

function product(id: string, overrides: Partial<Addable> = {}): Addable {
  return {
    id,
    slug: id,
    name: `Item ${id}`,
    priceCents: 1000,
    image: "https://example.com/i.jpg",
    stock: 10,
    ...overrides,
  };
}

describe("cart store: adding", () => {
  it("adds a new line with quantity 1 by default", () => {
    store.add(product("a"));
    expect(store.getSnapshot()).toHaveLength(1);
    expect(store.getSnapshot()[0]).toMatchObject({ id: "a", qty: 1, priceCents: 1000 });
  });

  it("adds a new line at the requested quantity", () => {
    store.add(product("a"), 4);
    expect(store.getSnapshot()[0].qty).toBe(4);
  });

  it("accumulates quantity for the same product id", () => {
    store.add(product("a"));
    store.add(product("a"));
    expect(store.getSnapshot()).toHaveLength(1);
    expect(store.getSnapshot()[0].qty).toBe(2);
  });

  it("clamps quantity to available stock when accumulating", () => {
    store.add(product("a", { stock: 3 }));
    store.add(product("a", { stock: 3 }), 10);
    expect(store.getSnapshot()[0].qty).toBe(3);
  });

  it("clamps the initial add to available stock but keeps at least 1", () => {
    store.add(product("a", { stock: 2 }), 8);
    expect(store.getSnapshot()[0].qty).toBe(2);
  });
});

describe("cart store: mutating", () => {
  beforeEach(() => {
    store.add(product("a", { priceCents: 1000 }));
    store.add(product("b", { priceCents: 250, stock: 5 }));
  });

  it("setQty updates the target line", () => {
    store.setQty("a", 3);
    expect(store.getSnapshot().find((l) => l.id === "a")?.qty).toBe(3);
  });

  it("setQty clamps to stock", () => {
    store.setQty("b", 99);
    expect(store.getSnapshot().find((l) => l.id === "b")?.qty).toBe(5);
  });

  it("setQty to 0 removes the line", () => {
    store.setQty("a", 0);
    expect(store.getSnapshot().map((l) => l.id)).toEqual(["b"]);
  });

  it("setQty does not touch other lines", () => {
    store.setQty("a", 4);
    expect(store.getSnapshot().find((l) => l.id === "b")?.qty).toBe(1);
  });

  it("remove deletes exactly the requested line", () => {
    store.remove("a");
    expect(store.getSnapshot().map((l) => l.id)).toEqual(["b"]);
  });

  it("clear empties the cart", () => {
    store.clear();
    expect(store.getSnapshot()).toHaveLength(0);
  });
});

describe("cart store: persistence and hydration", () => {
  it("persists every mutation to localStorage", () => {
    store.add(product("a"));
    const raw = localStorage.getItem("acme-cart-v1");
    expect(raw).toContain('"id":"a"');
    expect(JSON.parse(raw!)[0].qty).toBe(1);
  });

  it("round-trips through a fresh module load (like a browser reload)", async () => {
    store.add(product("a", { name: "Keeper" }));
    store.add(product("b"));

    vi.resetModules();
    const fresh: Store = await import("@/lib/cart-store");
    expect(fresh.getSnapshot().map((l) => l.name)).toEqual(["Keeper", "Item b"]);
  });

  it("server snapshot is stable and always empty", () => {
    store.add(product("a"));
    expect(store.getServerSnapshot()).toBe(store.EMPTY);
    expect(store.getServerSnapshot()).toHaveLength(0);
  });
});

describe("cart store: snapshot identity & robust parsing", () => {
  it("returns the same array when nothing changed, a new one after a change", () => {
    const first = store.getSnapshot();
    expect(store.getSnapshot()).toBe(first);

    store.add(product("a"));
    expect(store.getSnapshot()).not.toBe(first);
  });

  it("falls back to EMPTY on corrupted JSON", async () => {
    localStorage.setItem("acme-cart-v1", "{not json");
    vi.resetModules();
    const fresh: Store = await import("@/lib/cart-store");
    expect(fresh.getSnapshot()).toBe(fresh.EMPTY);
  });

  it("drops malformed entries instead of throwing", async () => {
    localStorage.setItem(
      "acme-cart-v1",
      JSON.stringify([{ id: 1, qty: 2, priceCents: 3 }, { id: "ok", qty: 2, priceCents: 3 }]),
    );
    vi.resetModules();
    const fresh: Store = await import("@/lib/cart-store");
    expect(fresh.getSnapshot().map((l) => l.id)).toEqual(["ok"]);
  });

  it("treats non-arrays as an empty cart", async () => {
    localStorage.setItem("acme-cart-v1", JSON.stringify({ nuke: true }));
    vi.resetModules();
    const fresh: Store = await import("@/lib/cart-store");
    expect(fresh.getSnapshot()).toHaveLength(0);
  });
});

describe("cart store: subscribers", () => {
  it("notifies listeners on commit and unsubscribes cleanly", () => {
    const heard: number[] = [];
    const unsubscribe = store.subscribe(() => heard.push(store.getSnapshot().length));

    store.add(product("a"));
    store.remove("a");

    unsubscribe();
    store.add(product("a")); // after unsubscribe this must not fire

    expect(heard).toEqual([1, 0]);
  });
});
