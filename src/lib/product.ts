/**
 * Minimal product shape used by storefront list code (shelf tiles, cart
 * lines, the landing pick). Prisma's full product row satisfies it
 * structurally, so `prisma.product.findMany` results can be passed as-is.
 */
export type Product = {
  id: string;
  name: string;
  slug: string;
  priceCents: number;
  image: string;
  stock: number;
  category: string;
};
