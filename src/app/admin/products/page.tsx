import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteProduct } from "./product-actions";
import { requireAdmin } from "@/lib/require-admin";

export const metadata = { title: "Admin products" };

export default function Page() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Products</h2>
        <Button asChild size="sm">
          <Link href="/admin/products/new">New product</Link>
        </Button>
      </div>

      <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-muted" />}>
        <ProductsTable />
      </Suspense>
    </div>
  );
}

async function ProductsTable() {
  await requireAdmin();
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
  });

  if (products.length === 0) {
    return (
      <p className="rounded-lg border p-6 text-sm text-muted-foreground">
        No products yet — create the first one.
      </p>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">Photo</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            <TableHead className="w-32 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <Image
                  src={product.image}
                  alt=""
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded object-cover"
                />
              </TableCell>
              <TableCell>
                <Link
                  href={`/product/${product.slug}`}
                  className="font-medium hover:underline"
                >
                  {product.name}
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{product.category}</Badge>
              </TableCell>
              <TableCell className="text-right">
                {formatPrice(product.priceCents)}
              </TableCell>
              <TableCell
                className={
                  product.stock < 10
                    ? "text-right font-medium text-destructive"
                    : "text-right"
                }
              >
                {product.stock}
              </TableCell>
              <TableCell className="flex items-center justify-end gap-1 py-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/admin/products/${product.id}`}>Edit</Link>
                </Button>
                <form action={deleteProduct}>
                  <input type="hidden" name="id" value={product.id} />
                  <Button variant="ghost" size="sm" type="submit">
                    Delete
                  </Button>
                </form>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
