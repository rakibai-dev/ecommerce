"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-provider";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/product";

/**
 * A shelf item: flat photo tile (no card chrome), the price as a sticker on
 * the photo, and a quiet Add control. The sticker carries the orange; the
 * tile itself stays in the paper/lid palette.
 */
export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const soldOut = product.stock <= 0;
  const lowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div className="group flex flex-col">
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-square overflow-hidden rounded-2xl bg-card"
        aria-label={`${product.name}, ${formatPrice(product.priceCents)}`}
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={cn("object-cover", soldOut && "opacity-60 saturate-50")}
        />
        <span
          className={cn(
            "sticker absolute bottom-3 left-3 rotate-[-4deg] text-lg",
            soldOut && "bg-secondary text-muted-foreground shadow-none",
          )}
        >
          {soldOut ? "Sold out" : formatPrice(product.priceCents)}
        </span>
      </Link>
      <div className="mt-3 flex flex-1 flex-col gap-1">
        <Link
          href={`/product/${product.slug}`}
          className="line-clamp-2 font-medium leading-snug underline-offset-4 hover:underline"
        >
          {product.name}
        </Link>
        <div className="mt-auto flex items-center gap-2 pt-1">
          <span
            className={cn(
              "text-xs",
              soldOut
                ? "text-muted-foreground"
                : lowStock
                  ? "text-stock"
                  : "text-muted-foreground",
            )}
          >
            {soldOut
              ? "Back soon"
              : lowStock
                ? `Only ${product.stock} left`
                : "In stock"}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto font-semibold"
            disabled={soldOut}
            onClick={() =>
              add({
                id: product.id,
                slug: product.slug,
                name: product.name,
                priceCents: product.priceCents,
                image: product.image,
                stock: product.stock,
              })
            }
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
