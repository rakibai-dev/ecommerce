"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function updateOrderStatus(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/login?callbackUrl=/admin");
  }

  const orderId = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const valid = ["PENDING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
  if (!orderId || !valid.some((s) => s === status)) return;

  await prisma.order.update({ where: { id: orderId }, data: { status: status as (typeof valid)[number] } });
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}
