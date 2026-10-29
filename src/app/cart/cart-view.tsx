"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-provider";
import { formatPrice } from "@/lib/format";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CartView() {
  const { hydrated, lines, subtotalCents, setQty, remove } = useCart();

  if (!hydrated) {
    return (
      <div className="h-48 animate-pulse rounded-2xl bg-muted" aria-hidden />
    );
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-card p-12 text-center">
        <p className="font-medium">Your cart is empty.</p>
        <Link href="/shop" className={buttonVariants({ variant: "outline" })}>
          Browse the shelves
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 lg:grid lg:grid-cols-[1fr_300px] lg:gap-14">
      <ul className="flex flex-col">
        {lines.map((line) => (
          <li
            key={line.id}
            className="flex items-center gap-4 border-b py-4 first:pt-0 last:border-b-0 last:pb-0"
          >
            <Image
              src={line.image}
              alt={line.name}
              width={72}
              height={72}
              className="h-16 w-16 shrink-0 rounded-xl bg-card object-cover sm:h-18 sm:w-18"
            />
            <div className="min-w-0 flex-1">
              <Link
                href={`/product/${line.slug}`}
                className="truncate font-medium underline-offset-4 hover:underline"
              >
                {line.name}
              </Link>
              <p className="text-sm text-muted-foreground">
                {formatPrice(line.priceCents)} each
              </p>
            </div>
            <div className="flex shrink-0 items-center">
              <button
                type="button"
                aria-label={`Decrease ${line.name}`}
                className="size-8 rounded-lg text-lg leading-none text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                onClick={() => setQty(line.id, line.qty - 1)}
              >
                −
              </button>
              <span className="w-8 text-center text-sm font-medium">
                {line.qty}
              </span>
              <button
                type="button"
                aria-label={`Increase ${line.name}`}
                className="size-8 rounded-lg text-lg leading-none text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                disabled={line.qty >= line.stock}
                onClick={() => setQty(line.id, line.qty + 1)}
              >
                +
              </button>
            </div>
            <span className="hidden w-24 shrink-0 text-right font-semibold sm:block">
              {formatPrice(line.priceCents * line.qty)}
            </span>
            <button
              type="button"
              className="shrink-0 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              onClick={() => remove(line.id)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <aside className="flex h-fit flex-col gap-4 lg:sticky lg:top-8">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {lines.length === 1 ? "1 item" : `${lines.length} items`}
          </span>
          <span className="sticker rotate-[-3deg] px-5 py-2 text-2xl">
            {formatPrice(subtotalCents)}
          </span>
        </div>
        <Link
          href="/checkout"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "w-full font-semibold",
          )}
        >
          Checkout
        </Link>
        <p className="text-center text-xs text-muted-foreground lg:text-left">
          Demo checkout — nothing is charged.
        </p>
      </aside>
    </div>
  );
}
