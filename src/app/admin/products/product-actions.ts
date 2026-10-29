"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { slugify, dollarsToCents } from "@/lib/format";

export type ProductFormState = { error?: string; ok?: boolean };

/** Every admin mutation re-verifies the session server-side. */
async function assertAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/login?callbackUrl=/admin");
  }
}

export async function createProduct(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await assertAdmin();
  const parsed = parseProductForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const slug = parsed.slug ?? slugify(parsed.name);
  if (!slug) return { error: "Could not derive a slug from the name." };

  try {
    await prisma.product.create({
      data: {
        name: parsed.name,
        slug,
        description: parsed.description,
        category: parsed.category,
        priceCents: parsed.priceCents,
        image:
          parsed.image ?? `https://picsum.photos/seed/${slug}/800/800`,
        stock: parsed.stock,
      },
    });
  } catch (error) {
    if ((error as { code?: string })?.code === "P2002") {
      return { error: `A product with the slug "${slug}" already exists.` };
    }
    throw error;
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  return { ok: true };
}

export async function updateProduct(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing product id." };

  const parsed = parseProductForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const slug = parsed.slug ?? slugify(parsed.name);
  if (!slug) return { error: "Could not derive a slug from the name." };

  try {
    await prisma.product.update({
      where: { id },
      data: {
        name: parsed.name,
        slug,
        description: parsed.description,
        category: parsed.category,
        priceCents: parsed.priceCents,
        image: parsed.image,
        stock: parsed.stock,
      },
    });
  } catch (error) {
    if ((error as { code?: string })?.code === "P2002") {
      return { error: `A product with the slug "${slug}" already exists.` };
    }
    throw error;
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteProduct(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin/products");
  revalidatePath("/");
}

type Parsed = {
  name: string;
  slug?: string;
  description: string;
  category: string;
  priceCents: number;
  image?: string;
  stock: number;
};

function parseProductForm(formData: FormData): Parsed | { error: string } {
  const name = String(formData.get("name") ?? "").trim();
  const slugRaw = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || "General";
  const imageRaw = String(formData.get("image") ?? "").trim();
  const stock = Math.floor(Number(formData.get("stock") ?? "0"));
  const priceCents = dollarsToCents(String(formData.get("price") ?? ""));

  if (!name) return { error: "Name is required." };
  if (!description) return { error: "Description is required." };
  if (priceCents <= 0) return { error: "Price must be greater than $0." };
  if (!Number.isFinite(stock) || stock < 0) return { error: "Stock must be 0 or more." };

  let image: string | undefined;
  if (imageRaw) {
    try {
      const url = new URL(imageRaw);
      if (url.protocol !== "https:") {
        return { error: "Image URL must start with https://" };
      }
      image = imageRaw;
    } catch {
      return { error: "Image must be a valid URL." };
    }
  }

  return {
    name,
    slug: slugRaw ? slugify(slugRaw) : undefined,
    description,
    category,
    priceCents,
    image,
    stock,
  };
}
