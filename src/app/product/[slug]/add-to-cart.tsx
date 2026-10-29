"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-provider";
import { Button } from "@/components/ui/button";

export function AddToCart({
  product,
}: {
  product: { id: string; slug: string; name: string; priceCents: number; image: string; stock: number };
}) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const soldOut = product.stock <= 0;

  if (soldOut) {
    return <Button disabled className="w-full sm:w-auto">Out of stock</Button>;
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center">
        <button
          type="button"
          aria-label="Decrease quantity"
          className="size-9 rounded-lg text-lg leading-none text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
        >
          −
        </button>
        <span className="w-9 text-center text-sm font-medium">{qty}</span>
        <button
          type="button"
          aria-label="Increase quantity"
          className="size-9 rounded-lg text-lg leading-none text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
        >
          +
        </button>
      </div>

      <Button
        className="flex-1 font-semibold sm:flex-none sm:px-6"
        onClick={() => {
          add(product, qty);
          setJustAdded(true);
          window.setTimeout(() => setJustAdded(false), 2500);
        }}
      >
        {justAdded ? (
          <Link
            href="/cart"
            className="text-primary-foreground underline underline-offset-4 hover:opacity-80"
          >
            Added — go to cart
          </Link>
        ) : (
          "Add to cart"
        )}
      </Button>
    </div>
  );
}
