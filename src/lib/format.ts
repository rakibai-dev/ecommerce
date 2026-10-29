/** Small shared display + id helpers. Safe to import from client components. */

export function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

/** Parse a user-entered dollar string ("12.50") into integer cents. */
export function dollarsToCents(input: string): number {
  const n = Number(input.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 100);
}

export const STORE_NAME = "Acme Store";
export const SUPPORT_EMAIL = "support@shop.local";
