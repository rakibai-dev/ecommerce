import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { AddToCart } from "@/app/product/[slug]/add-to-cart";

/**
 * The store's front door: brand statement plus a live glimpse of the shop.
 * Everything that touches the DB streams inside one boundary below the
 * static hero; /shop carries the full catalog.
 */
export default function Page() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 pb-20 pt-10 sm:pt-16">
      <section className="md:grid md:grid-cols-[1.05fr_0.95fr] md:items-end md:gap-14">
        <div className="max-w-2xl">
          <h1 className="font-heading text-[clamp(3.4rem,9vw,7rem)] font-bold leading-[0.92] tracking-[0.005em]">
            A small store with honest prices.
          </h1>
          <p className="mt-6 max-w-md text-lg text-muted-foreground">
            Acme is a corner shop online. Walk the shelves, drop things in
            your cart, and check out in minutes.
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-flex h-11 items-center rounded-lg bg-primary px-6 text-[15px] font-semibold text-primary-foreground transition-opacity hover:opacity-80"
          >
            Browse the shelves
          </Link>
        </div>
        <Suspense fallback={<DirectorySkeleton />}>
          <ShelvesBoard />
        </Suspense>
      </section>

      <Suspense fallback={null}>
        <TheRest />
      </Suspense>
    </div>
  );
}

type ShelfRow = {
  category: string;
  count: number;
  image: string;
};

function DirectorySkeleton() {
  return (
    <div
      className="rounded-2xl bg-card p-3"
      aria-busy="true"
      aria-label="Loading the shelf directory"
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b px-3.5 py-3 last:border-b-0">
          <div className="size-12 animate-pulse rounded-lg bg-muted" />
          <div className="h-6 w-28 animate-pulse rounded bg-muted" />
          <div className="ml-auto h-4 w-14 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

/** The aisle directory: every shelf, its item count, and a peek of the top item. */
async function ShelvesBoard() {
  const products = await prisma.product.findMany({
    select: { category: true, image: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  if (products.length === 0) return null;

  const shelves = new Map<string, ShelfRow>();
  for (const p of products) {
    const row = shelves.get(p.category);
    if (row) {
      row.count++;
    } else {
      shelves.set(p.category, { category: p.category, count: 1, image: p.image });
    }
  }

  return (
    <div className="rounded-2xl bg-card p-2.5">
      <ul>
        {[...shelves.values()].map(({ category, count, image }) => (
          <li key={category}>
            <Link
              href={`/shop?cat=${encodeURIComponent(category)}`}
              className="flex items-center gap-4 rounded-xl px-3.5 py-2.5 transition-colors hover:bg-muted"
            >
              <span className="relative block size-12 overflow-hidden rounded-lg bg-muted">
                <Image
                  src={image}
                  alt=""
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </span>
              <span className="font-heading text-2xl font-bold uppercase leading-none">
                {category}
              </span>
              <span className="ml-auto text-sm text-muted-foreground">
                {count} {count === 1 ? "item" : "items"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Second batch of streamed content: today's pick and the store-rules board. */
async function TheRest() {
  const [pick, all] = await Promise.all([
    prisma.product.findFirst({
      where: { stock: { gt: 0 } },
      orderBy: { name: "desc" },
    }),
    prisma.product.findMany({ select: { category: true } }),
  ]);

  const shelfCount = new Set(all.map((p) => p.category)).size;

  return (
    <>
      {pick && (
        <section className="md:grid md:grid-cols-[0.9fr_1.1fr] md:items-center md:gap-14">
          <Link
            href={`/product/${pick.slug}`}
            className="group relative block w-fit pt-4 pl-4"
            aria-label={`${pick.name}, ${formatPrice(pick.priceCents)}`}
          >
            <span className="relative block aspect-square w-64 overflow-hidden rounded-2xl bg-card sm:w-80">
              <Image
                src={pick.image}
                alt={pick.name}
                fill
                sizes="320px"
                className="object-cover"
              />
            </span>
            <span className="sticker absolute top-0 left-0 rotate-[-5deg] px-5 py-2.5 text-3xl">
              {formatPrice(pick.priceCents)}
            </span>
          </Link>
          <div className="mt-8 md:mt-0">
            <h2 className="font-heading text-[clamp(2.4rem,5vw,4rem)] font-bold leading-[0.95]">
              {pick.name}
            </h2>
            <p className="mt-4 max-w-prose text-[15px] leading-relaxed text-foreground/80">
              {pick.description}
            </p>
            <div className="mt-8">
              <AddToCart
                product={{
                  id: pick.id,
                  slug: pick.slug,
                  name: pick.name,
                  priceCents: pick.priceCents,
                  image: pick.image,
                  stock: pick.stock,
                }}
              />
            </div>
          </div>
        </section>
      )}

      <section className="rounded-2xl bg-primary px-7 py-10 text-primary-foreground sm:px-10">
        <h2 className="font-heading text-3xl font-bold uppercase leading-none">
          How this store works
        </h2>
        <div className="mt-6 max-w-prose">
          <p className="border-b border-primary-foreground/15 pb-3 text-[15px] leading-relaxed">
            Orders reserve the item on the shelf. Payments are mocked, so
            nothing is ever charged.
          </p>
          <p className="border-b border-primary-foreground/15 py-3 text-[15px] leading-relaxed">
            Accounts are optional — the cart and checkout work just as well
            signed out.
          </p>
          <p className="pt-3 text-[15px] leading-relaxed">
            The cart math is real: totals and stock counts come from the same
            shelf the admin runs.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="/shop"
            className="inline-flex h-11 items-center rounded-lg bg-card px-6 text-[15px] font-semibold text-primary transition-opacity hover:opacity-80"
          >
            Browse the shelves
          </Link>
          {all.length > 0 && (
            <p className="text-sm text-primary-foreground/70">
              {all.length} items on {shelfCount} shelves today.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
