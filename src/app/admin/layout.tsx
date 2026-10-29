import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Static admin nav + the segment shell. Actual protection lives in each page's
 * data component (`requireAdmin()` inside page-level Suspense) and inside
 * every server action — layout-level auth reads proved unreliable to reveal.
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-2 border-b pb-4">
          <h1 className="mr-auto text-xl font-semibold tracking-tight">Admin</h1>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin">Overview</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/products">Products</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/orders">Orders</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/">View store</Link>
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
