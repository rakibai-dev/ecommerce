"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createProduct,
  updateProduct,
  type ProductFormState,
} from "./product-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Existing = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  priceCents: number;
  image: string;
  stock: number;
};

const emptyState: ProductFormState = {};

export function ProductForm({ existing }: { existing?: Existing }) {
  const isEdit = Boolean(existing);
  const [state, formAction, pending] = useActionState(
    isEdit ? updateProduct : createProduct,
    emptyState,
  );
  const router = useRouter();

  // Both actions return { ok: true } after revalidating caches; send the
  // admin back to the list.
  useEffect(() => {
    if (state.ok) router.push("/admin/products");
  }, [state.ok, router]);

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      {existing && <input type="hidden" name="id" value={existing.id} />}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={existing?.name}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="price">Price (USD)</Label>
          <Input
            id="price"
            name="price"
            inputMode="decimal"
            required
            defaultValue={existing ? (existing.priceCents / 100).toFixed(2) : ""}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="stock">Stock</Label>
          <Input
            id="stock"
            name="stock"
            type="number"
            min={0}
            required
            defaultValue={existing?.stock ?? 0}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            name="category"
            defaultValue={existing?.category ?? ""}
            placeholder="e.g. Electronics"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="slug">URL slug (optional)</Label>
          <Input
            id="slug"
            name="slug"
            defaultValue={existing?.slug}
            placeholder="auto-generated from name"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="image">Image URL ({`https://…`})</Label>
        <Input
          id="image"
          name="image"
          required
          defaultValue={existing?.image}
          placeholder="https://example.com/photo.jpg"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          required
          rows={4}
          defaultValue={existing?.description}
        />
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : isEdit ? "Save changes" : "Create product"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
