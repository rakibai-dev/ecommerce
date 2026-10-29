import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createProduct,
  deleteProduct,
  updateProduct,
} from "@/app/admin/products/product-actions";

const mocks = vi.hoisted(() => {
  const prisma = {
    product: {
      create: vi.fn(async (args: { data: Record<string, unknown> }) => args.data),
      update: vi.fn(async (args: { where: { id: string }; data: Record<string, unknown> }) => ({
        ...args,
      })),
      delete: vi.fn(async () => ({})),
    },
  };
  const auth = vi.fn();
  const revalidatePath = vi.fn();
  const redirect = vi.fn((url: string): never => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  });
  return { prisma, auth, revalidatePath, redirect };
});

vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const fullCreate = {
  name: "Test Gadget X",
  price: "9.99",
  stock: "7",
  category: "Electronics",
  image: "https://example.com/gadget.jpg",
  description: "A smoke-test product.",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { role: "ADMIN" } });
});

describe("createProduct", () => {
  it("creates with a derived slug, cents price, and revalidates", async () => {
    const result = await createProduct({}, form(fullCreate));

    expect(result).toEqual({ ok: true });
    expect(mocks.prisma.product.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "Test Gadget X",
        slug: "test-gadget-x",
        description: "A smoke-test product.",
        category: "Electronics",
        priceCents: 999, // $9.99 -> cents
        image: "https://example.com/gadget.jpg",
        stock: 7,
      }),
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/products");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/");
  });

  it("falls back to a seeded picsum image when none is given", async () => {
    await createProduct({}, form({ ...fullCreate, image: "" }));

    expect(mocks.prisma.product.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        slug: "test-gadget-x",
        image: "https://picsum.photos/seed/test-gadget-x/800/800",
      }),
    });
  });

  it("honors and normalizes a custom slug", async () => {
    await createProduct({}, form({ ...fullCreate, slug: "Custom Slug!" }));

    expect(mocks.prisma.product.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ slug: "custom-slug" }),
    });
  });

  it("surfaces a friendly error on slug collisions (P2002)", async () => {
    mocks.prisma.product.create.mockRejectedValueOnce({ code: "P2002" });

    const result = await createProduct({}, form(fullCreate));
    expect(result.error).toBe(`A product with the slug "test-gadget-x" already exists.`);
  });

  it("rejects non-https image URLs", async () => {
    const result = await createProduct({}, form({ ...fullCreate, image: "http://example.com/i.jpg" }));
    expect(result.error).toBe("Image URL must start with https://");
    expect(mocks.prisma.product.create).not.toHaveBeenCalled();
  });

  it("rejects unparseable image URLs", async () => {
    const result = await createProduct({}, form({ ...fullCreate, image: "not a url" }));
    expect(result.error).toBe("Image must be a valid URL.");
  });

  it("requires name and description", async () => {
    expect((await createProduct({}, form({ ...fullCreate, name: "" }))).error).toBe(
      "Name is required.",
    );
    expect((await createProduct({}, form({ ...fullCreate, description: "" }))).error).toBe(
      "Description is required.",
    );
  });

  it("requires a price above $0 and a non-negative stock", async () => {
    expect((await createProduct({}, form({ ...fullCreate, price: "0" }))).error).toContain(
      "Price must be greater than $0.",
    );
    expect((await createProduct({}, form({ ...fullCreate, price: "abc" }))).error).toContain(
      "Price must be greater than $0.",
    );
    expect((await createProduct({}, form({ ...fullCreate, stock: "-2" }))).error).toBe(
      "Stock must be 0 or more.",
    );
  });

  it("redirects non-admins before any database write", async () => {
    mocks.auth.mockResolvedValue({ user: { role: "USER" } });

    await expect(createProduct({}, form(fullCreate))).rejects.toThrow(
      "NEXT_REDIRECT:/login?callbackUrl=/admin",
    );
    expect(mocks.prisma.product.create).not.toHaveBeenCalled();
  });
});

describe("updateProduct", () => {
  it("updates the row identified by the hidden id", async () => {
    const result = await updateProduct({}, form({ ...fullCreate, id: "p-123" }));

    expect(result).toEqual({ ok: true });
    expect(mocks.prisma.product.update).toHaveBeenCalledWith({
      where: { id: "p-123" },
      data: expect.objectContaining({ name: "Test Gadget X", priceCents: 999 }),
    });
  });

  it("errors when the id is missing", async () => {
    const result = await updateProduct({}, form(fullCreate));
    expect(result.error).toBe("Missing product id.");
    expect(mocks.prisma.product.update).not.toHaveBeenCalled();
  });

  it("surfaces a friendly error on slug collisions (P2002)", async () => {
    mocks.prisma.product.update.mockRejectedValueOnce({ code: "P2002" });

    const result = await updateProduct({}, form({ ...fullCreate, id: "p-1", slug: "dup" }));
    expect(result.error).toBe(`A product with the slug "dup" already exists.`);
  });
});

describe("deleteProduct", () => {
  it("deletes by id and revalidates", async () => {
    await deleteProduct(form({ id: "p-9" }));

    expect(mocks.prisma.product.delete).toHaveBeenCalledWith({ where: { id: "p-9" } });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/products");
  });

  it("does nothing without an id", async () => {
    await deleteProduct(form({}));
    expect(mocks.prisma.product.delete).not.toHaveBeenCalled();
  });

  it("redirects non-admins before deleting", async () => {
    mocks.auth.mockResolvedValue({ user: { role: "USER" } });

    await expect(deleteProduct(form({ id: "p-9" }))).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.prisma.product.delete).not.toHaveBeenCalled();
  });
});
