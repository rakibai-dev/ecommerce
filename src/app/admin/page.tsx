import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { requireAdmin } from "@/lib/require-admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Admin overview" };

export default function Page() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-muted" />}>
      <Overview />
    </Suspense>
  );
}

async function Overview() {
  await requireAdmin();
  const [
    orderCount,
    invalidRevenue,
    productCount,
    lowStockCount,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: { totalCents: true },
      where: { status: { not: "CANCELLED" } },
    }),
    prisma.product.aggregate({ _count: true }),
    prisma.product.count({ where: { stock: { lt: 10 } } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { items: true },
    }),
  ]);

  const revenueCents = invalidRevenue._sum.totalCents ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Orders"
          value={String(orderCount)}
          hint="all statuses"
        />
        <StatCard
          title="Revenue"
          value={formatPrice(revenueCents)}
          hint="excluding cancelled"
        />
        <StatCard title="Products" value={String(productCount._count)} />
        <StatCard
          title="Low stock"
          value={String(lowStockCount)}
          hint="fewer than 10 units"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Latest orders</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>{order.customerEmail}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {order.items.reduce((n, item) => n + item.quantity, 0)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatPrice(order.totalCents)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{order.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}
