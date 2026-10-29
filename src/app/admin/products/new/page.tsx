import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductForm } from "../product-form";
import { requireAdmin } from "@/lib/require-admin";

export const metadata = { title: "New product" };

export default function Page() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">New product</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Form fields themselves need no session; the gate is for consistent
            UX (redirect to login instead of a form anyone can stare at). The
            createProduct server action re-verifies the role regardless. */}
        <Suspense fallback={null}>
          <Gate>
            <ProductForm />
          </Gate>
        </Suspense>
      </CardContent>
    </Card>
  );
}

async function Gate({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}
