import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductForm } from "../product-form";
import { requireAdmin } from "@/lib/require-admin";

export const metadata = { title: "Edit product" };

export default function Page(props: PageProps<"/admin/products/[id]">) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="animate-pulse text-base text-muted-foreground">
          Loading product…
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-40 items-center justify-center">
        <Suspense fallback={null}>
          <EditProduct params={props.params} />
        </Suspense>
      </CardContent>
    </Card>
  );
}

async function EditProduct({
  params,
}: {
  params: PageProps<"/admin/products/[id]">["params"];
}) {
  await requireAdmin();
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) notFound();

  return (
    <div className="w-full">
      <h2 className="mb-4 text-base font-medium">Edit: {product.name}</h2>
      <ProductForm existing={{ ...product }} />
    </div>
  );
}
