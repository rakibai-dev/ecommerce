import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AddToCart } from "./add-to-cart";

export default function Page(props: PageProps<"/product/[slug]">) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:pt-10">
      <Suspense fallback={<ProductSkeleton />}>
        <ProductDetail params={props.params} />
      </Suspense>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div
      className="grid gap-10 md:grid-cols-2"
      aria-busy="true"
      aria-label="Loading product"
    >
      <div className="aspect-square animate-pulse rounded-2xl bg-muted" />
      <div className="flex flex-col gap-3">
        <div className="h-14 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-16 w-36 animate-pulse rounded-full bg-muted" />
        <div className="h-28 w-full animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

async function ProductDetail({
  params,
}: {
  params: PageProps<"/product/[slug]">["params"];
}) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) notFound();

  const soldOut = product.stock <= 0;

  return (
    <article>
      <nav className="mb-8 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
        <Link
          href="/shop"
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          All products
        </Link>
        <Link
          href={`/shop?cat=${encodeURIComponent(product.category)}`}
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          {product.category}
        </Link>
      </nav>

      <div className="grid gap-10 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-card">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className={cn("object-cover", soldOut && "opacity-60 saturate-50")}
            priority
          />
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <h1 className="font-heading text-[clamp(2.6rem,5vw,4.25rem)] font-bold leading-[0.95]">
              {product.name}
            </h1>
            {/* The price, as the one sticker the page leads with. */}
            <span
              className={cn(
                "sticker mt-6 rotate-[-3deg] px-6 py-2.5 text-4xl",
                soldOut && "bg-secondary text-muted-foreground shadow-none",
              )}
            >
              {soldOut ? "Sold out" : formatPrice(product.priceCents)}
            </span>
          </div>

          <p
            className={cn(
              "text-sm",
              soldOut
                ? "text-destructive"
                : product.stock <= 5
                  ? "text-stock"
                  : "text-muted-foreground",
            )}
          >
            {soldOut
              ? "Out of stock — check back soon."
              : product.stock <= 5
                ? `Only ${product.stock} left on the shelf.`
                : "In stock and ready to ship."}
          </p>

          <p className="max-w-prose text-[15px] leading-relaxed text-foreground/80">
            {product.description}
          </p>

          <AddToCart
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              priceCents: product.priceCents,
              image: product.image,
              stock: product.stock,
            }}
          />

          <p className="text-xs text-muted-foreground">
            Demo checkout: an order reserves the item but nothing is charged.
          </p>
        </div>
      </div>
    </article>
  );
}
