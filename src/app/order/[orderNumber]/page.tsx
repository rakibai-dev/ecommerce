import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Order confirmation" };

export default function Page(props: PageProps<"/order/[orderNumber]">) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-16 pt-10">
      <Suspense
        fallback={
          <div className="h-64 animate-pulse rounded-2xl bg-muted" aria-hidden />
        }
      >
        <OrderContent orderNumber={props.params} />
      </Suspense>
    </div>
  );
}

async function OrderContent({
  orderNumber: params,
}: {
  orderNumber: PageProps<"/order/[orderNumber]">["params"];
}) {
  const { orderNumber } = await params;
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: { include: { product: true } } },
  });

  if (!order) notFound();

  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="font-heading text-[clamp(2.6rem,6vw,4rem)] font-bold leading-[0.95]">
          Thanks, {order.customerName}. Your order is in.
        </h1>
        <p className="text-sm text-muted-foreground">
          Order {order.orderNumber} placed{" "}
          {order.createdAt.toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
          . A confirmation was “sent” to {order.customerEmail} (demo — nothing is
          actually emailed). Status: {order.status.toLowerCase()}.
        </p>
      </header>

      <section className="flex flex-col">
        <h2 className="pb-2 text-sm font-medium text-muted-foreground">
          What you ordered
        </h2>
        <ul className="flex flex-col">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 border-b py-3 text-sm last:border-b-0"
            >
              <Link
                href={`/product/${item.product.slug}`}
                className="truncate underline-offset-4 hover:underline"
              >
                {item.quantity}× {item.product.name}
              </Link>
              <span className="shrink-0 font-medium">
                {formatPrice(item.priceCents * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="sticker rotate-[-3deg] px-5 py-2 text-2xl">
            {formatPrice(order.totalCents)}
          </span>
        </div>
      </section>

      <section className="text-sm">
        <h2 className="text-sm font-medium text-muted-foreground">Ship to</h2>
        <p className="mt-1 whitespace-pre-line">{order.address}</p>
        {order.note && (
          <p className="mt-1 text-muted-foreground">Delivery note: {order.note}</p>
        )}
      </section>

      <div>
        <Link
          href="/shop"
          className="text-sm font-medium underline underline-offset-4 transition-opacity hover:opacity-70"
        >
          Continue shopping
        </Link>
      </div>
    </article>
  );
}
