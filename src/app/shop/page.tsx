import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/product-card";

export const metadata = { title: "Shop" };

export default function Page(props: PageProps<"/shop">) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:pt-14">
      {/* DB reads are uncached: they stream inside this boundary while the
          shell above prerenders. `?cat=` comes from the URL search params. */}
      <Suspense fallback={<ShelfSkeleton />}>
        <Catalog searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

/** Prerendered placeholder that ships with the static shell. */
function ShelfSkeleton() {
  return (
    <div
      className="flex flex-col gap-12"
      aria-busy="true"
      aria-label="Loading the shelf"
    >
      <div className="flex flex-col gap-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="h-24 w-2/3 max-w-md animate-pulse rounded bg-muted" />
        <div className="h-44 w-44 animate-pulse rounded-2xl bg-muted" />
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className="aspect-square animate-pulse rounded-2xl bg-muted" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** The featured item of the hero: photo tile with its price sticker. */
async function FeaturedItem() {
  const featured = await prisma.product.findFirst({
    where: { stock: { gt: 0 } },
    orderBy: { name: "asc" },
  });
  if (!featured) return null;

  return (
    <Link
      href={`/product/${featured.slug}`}
      className="group relative block w-fit pt-3 pl-3"
      aria-label={`${featured.name}, ${formatPrice(featured.priceCents)}`}
    >
      <span className="relative block aspect-square w-60 overflow-hidden rounded-2xl bg-card sm:w-72">
        <Image
          src={featured.image}
          alt={featured.name}
          fill
          sizes="288px"
          className="object-cover"
          priority
        />
      </span>
      <span className="sticker absolute top-0 left-0 rotate-[-5deg] px-5 py-2 text-2xl sm:text-3xl">
        {formatPrice(featured.priceCents)}
      </span>
      <span className="mt-3 block max-w-60 text-sm font-medium underline-offset-4 group-hover:underline sm:max-w-72">
        {featured.name}
      </span>
    </Link>
  );
}

async function Catalog({
  searchParams,
}: {
  searchParams: PageProps<"/shop">["searchParams"];
}) {
  const { cat } = await searchParams;
  const active = typeof cat === "string" && cat.length > 0 ? cat : null;

  // Same selection rule as the hero's FeaturedItem so the shelf can drop it.
  const featured = await prisma.product.findFirst({
    where: { stock: { gt: 0 } },
    orderBy: { name: "asc" },
    select: { id: true },
  });

  const [categoryRows, products] = await Promise.all([
    prisma.product.findMany({
      distinct: ["category"],
      select: { category: true },
      orderBy: { category: "asc" },
    }),
    prisma.product.findMany({
      where: {
        // Hide the hero item from the shelf (it is already on display above).
        ...(featured ? { id: { not: featured.id } } : {}),
        ...(active ? { category: active } : {}),
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
  ]);

  return (
    <div className="flex flex-col gap-14">
      <section className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between md:gap-10">
        <div className="max-w-2xl">
          <h1 className="font-heading text-[clamp(3rem,7vw,5.5rem)] font-bold leading-[0.92] tracking-[0.005em]">
            Everything for the desk, kitchen, and everyday carry.
          </h1>
          <p className="mt-5 max-w-md text-muted-foreground">
            Small, honest store. Checkout is a demo, so placing an order
            never charges anything.
          </p>
        </div>
        <FeaturedItem />
      </section>

      <section>
        <nav
          aria-label="Categories"
          className="flex flex-wrap items-baseline gap-x-3 gap-y-1 pb-3"
        >
          <TabLink href="/shop" active={!active} label="All" />
          {categoryRows.map(({ category }) => (
            <TabLink
              key={category}
              href={`/shop?cat=${encodeURIComponent(category)}`}
              active={active === category}
              label={category}
            />
          ))}
        </nav>

        {products.length === 0 ? (
          <p className="text-muted-foreground">
            {active
              ? `Nothing in "${active}" yet. Choose another shelf above.`
              : "The shelves are empty. An admin can add products under /admin."}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function TabLink({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-sm border-b-2 pb-1 text-[15px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
        active ? "border-sticker text-foreground" : "border-transparent",
      )}
    >
      {label}
    </Link>
  );
}
