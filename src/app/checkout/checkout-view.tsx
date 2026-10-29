"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createGuestOrder } from "@/app/actions";
import { useCart } from "@/lib/cart-provider";
import { formatPrice } from "@/lib/format";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CheckoutView() {
  const cart = useCart();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!cart.hydrated) {
    return (
      <div className="h-64 animate-pulse rounded-2xl bg-muted" aria-hidden />
    );
  }

  if (cart.lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-card p-12 text-center">
        <p className="font-medium">Nothing to check out — your cart is empty.</p>
        <Link href="/shop" className={buttonVariants({ variant: "outline" })}>
          Browse the shelves
        </Link>
      </div>
    );
  }

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createGuestOrder({
        customerName: String(formData.get("name") ?? ""),
        customerEmail: String(formData.get("email") ?? ""),
        address: String(formData.get("address") ?? ""),
        note: String(formData.get("note") ?? ""),
        items: cart.lines.map((l) => ({ id: l.id, qty: l.qty })),
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      // Order placed: empty the cart *before* navigating so the badge and any
      // subsequent render don't flash stale items.
      cart.clear();
      router.push(`/order/${result.orderNumber}`);
    });
  }

  return (
    <form action={submit} className="grid gap-12 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" name="name" required autoComplete="name" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="address">Shipping address</Label>
          <Textarea
            id="address"
            name="address"
            required
            rows={3}
            placeholder="Street, number, city, ZIP"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="note">Delivery note (optional)</Label>
          <Textarea id="note" name="note" rows={2} placeholder="e.g. leave at the door" />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-destructive/30 bg-card p-3.5 text-sm text-destructive"
          >
            {error}
          </p>
        )}
      </div>

      <aside className="flex h-fit flex-col gap-4 rounded-2xl bg-card p-5 lg:sticky lg:top-8">
        <ul className="flex flex-col gap-2 text-sm">
          {cart.lines.map((line) => (
            <li key={line.id} className="flex justify-between gap-3">
              <span className="truncate text-muted-foreground">
                {line.qty}× {line.name}
              </span>
              <span className="shrink-0">{formatPrice(line.priceCents * line.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between pt-3">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="sticker rotate-[-3deg] px-5 py-2 text-2xl">
            {formatPrice(cart.subtotalCents)}
          </span>
        </div>
        <Button type="submit" size="lg" disabled={pending} className="mt-1 font-semibold">
          {pending ? "Placing order…" : "Place order"}
        </Button>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Mock payment: no card is collected and nothing is charged.
        </p>
      </aside>
    </form>
  );
}
