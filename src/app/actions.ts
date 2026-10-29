"use server";

import { prisma } from "@/lib/prisma";

/**
 * Guest checkout. Stock-safe: re-validates every line against authoritative
 * DB stock and data, recomputes the total server-side, and decrements stock
 * atomically in a transaction. Payments are mocked — an order here is purely
 * a DB record that the admin ships by hand.
 */
export async function createGuestOrder(input: {
  customerName: string;
  customerEmail: string;
  address: string;
  note?: string;
  items: { id: string; qty: number }[];
}): Promise<{ error?: string; orderNumber?: string }> {
  const name = input.customerName?.trim() ?? "";
  const email = input.customerEmail?.trim().toLowerCase() ?? "";
  const address = input.address?.trim() ?? "";
  const note = input.note?.trim() || null;

  if (!name || !email || !address) {
    return { error: "Name, email, and address are required." };
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  const requested = (input.items ?? [])
    .map((item) => ({ id: String(item.id), qty: Math.floor(Number(item.qty)) }))
    .filter((item) => item.id && Number.isFinite(item.qty) && item.qty > 0);

  if (requested.length === 0) {
    return { error: "Your cart is empty." };
  }

  // Authoritative price/stock source: the DB, not the localStorage cart.
  const products = await prisma.product.findMany({
    where: { id: { in: requested.map((r) => r.id) } },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const missing = requested.filter((r) => !byId.has(r.id));
  if (missing.length > 0) {
    return {
      error: "Some items are no longer available. Please review your cart.",
    };
  }

  const overStock = requested.filter((r) => (byId.get(r.id)?.stock ?? 0) < r.qty);
  if (overStock.length > 0) {
    return {
      error:
        "Stock changed while you were shopping: " +
        overStock.map((r) => byId.get(r.id)?.name).join(", ") +
        " have fewer items than requested. Please review your cart.",
    };
  }

  const totalCents = requested.reduce(
    (sum, r) => sum + (byId.get(r.id)?.priceCents ?? 0) * r.qty,
    0,
  );
  if (totalCents <= 0) {
    return { error: "Cart total must be greater than $0." };
  }

  // Order numbers are time-based but uniqueness is enforced with a retry loop.
  for (let attempt = 0; attempt < 5; attempt++) {
    const orderNumber = generateOrderNumber();
    try {
      await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            orderNumber,
            customerName: name,
            customerEmail: email,
            address,
            note,
            totalCents,
          },
        });
        await tx.orderItem.createMany({
          data: requested.map((r) => ({
            orderId: order.id,
            productId: r.id,
            quantity: r.qty,
            priceCents: byId.get(r.id)?.priceCents ?? 0,
          })),
        });
        for (const r of requested) {
          await tx.product.update({
            where: { id: r.id },
            data: { stock: { decrement: r.qty } },
          });
        }
      });
      return { orderNumber };
    } catch (error) {
      const code = (error as { code?: string })?.code;
      if (code === "P2002") continue; // orderNumber collision, retry
      throw error;
    }
  }
  return { error: "Could not place the order. Please try again." };
}

function generateOrderNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${stamp}-${rand}`;
}
