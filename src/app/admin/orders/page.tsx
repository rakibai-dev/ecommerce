import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderStatusSelect } from "./order-status-select";
import { requireAdmin } from "@/lib/require-admin";

export const metadata = { title: "Admin orders" };

export default function Page() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Orders</h2>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-muted" />}>
        <OrdersTable />
      </Suspense>
    </div>
  );
}

async function OrdersTable() {
  await requireAdmin();
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      items: { include: { product: { select: { name: true } } } },
    },
  });

  if (orders.length === 0) {
    return (
      <p className="rounded-lg border p-6 text-sm text-muted-foreground">
        No orders yet — place one from the store to see it here.
      </p>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Placed</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Items</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Ship to</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-mono text-xs">
                {order.orderNumber}
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {order.createdAt.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </TableCell>
              <TableCell>
                <div className="font-medium">{order.customerName}</div>
                <div className="text-xs text-muted-foreground">
                  {order.customerEmail}
                </div>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {order.items
                  .map((item) => `${item.quantity}× ${item.product.name}`)
                  .join(", ")}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatPrice(order.totalCents)}
              </TableCell>
              <TableCell className="max-w-48 truncate text-xs text-muted-foreground">
                {order.address}
              </TableCell>
              <TableCell>
                <OrderStatusSelect orderId={order.id} current={order.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
