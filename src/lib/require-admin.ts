import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Server-side gate used inside every admin page's data component (they live
 * in page-level Suspense boundaries, which reveal reliably) and re-checked in
 * every admin server action. Layout-level guards alone are not enough.
 */
export async function requireAdmin() {
  await connection();
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/login?callbackUrl=/admin");
  }
}
