/**
 * Idempotent seed: `npm run db:seed` (or `npx tsx prisma/seed.ts`).
 * Creates the admin user and the demo catalog. Safe to re-run.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type SeedProduct = {
  name: string;
  slug: string;
  description: string;
  category: string;
  priceCents: number;
  stock: number;
};

const PRODUCTS: SeedProduct[] = [
  {
    name: "K2 Mechanical Keyboard",
    slug: "k2-mechanical-keyboard",
    description:
      "Hot-swappable, tactile brown switches, white backlighting, and a sturdy aluminum frame. Connects over USB-C or Bluetooth.",
    category: "Electronics",
    priceCents: 8990,
    stock: 24,
  },
  {
    name: "WH-50 Wireless Headphones",
    slug: "wh-50-wireless-headphones",
    description:
      "Over-ear ANC headphones with 35 hour battery life and multipoint pairing.",
    category: "Electronics",
    priceCents: 14990,
    stock: 15,
  },
  {
    name: "4K Webcam Pro",
    slug: "4k-webcam-pro",
    description:
      "Compact 4K webcam with auto-focus, privacy shutter, and dual noise-canceling mics.",
    category: "Electronics",
    priceCents: 11990,
    stock: 30,
  },
  {
    name: "Ceramic Coffee Mug Set",
    slug: "ceramic-coffee-mug-set",
    description:
      "Set of two 12oz stoneware mugs with a matte speckled glaze. Dishwasher and microwave safe.",
    category: "Home",
    priceCents: 3490,
    stock: 40,
  },
  {
    name: "Linen Throw Pillow",
    slug: "linen-throw-pillow",
    description:
      "Stonewashed linen cover with a feather insert. 18x18 inches, made to look better with age.",
    category: "Home",
    priceCents: 2990,
    stock: 50,
  },
  {
    name: "Oak Desk Organizer",
    slug: "oak-desk-organizer",
    description:
      "Solid oak organizer with a phone stand, pen wells, and drawer. Finished with linseed oil.",
    category: "Home",
    priceCents: 4590,
    stock: 22,
  },
  {
    name: "A5 Dot Grid Notebook",
    slug: "a5-dot-grid-notebook",
    description:
      "160 pages of 120gsm dot grid paper, lay-flat binding, and an elastic closure.",
    category: "Stationery",
    priceCents: 1290,
    stock: 100,
  },
  {
    name: "Fine-Liner Pen Set (10)",
    slug: "fine-liner-pen-set",
    description:
      "Technical drawing pens in 0.1mm to 0.7mm nibs with waterproof, fade-proof ink.",
    category: "Stationery",
    priceCents: 2490,
    stock: 60,
  },
  {
    name: "Merino Wool Beanie",
    slug: "merino-wool-beanie",
    description:
      "Midweight merino beanie, double-layered cuff, itch-free and machine washable.",
    category: "Apparel",
    priceCents: 2590,
    stock: 35,
  },
  {
    name: "Everyday Cotton Tee",
    slug: "everyday-cotton-tee",
    description:
      "Heavyweight organic cotton t-shirt, boxy fit, garment-dyed in muted colors.",
    category: "Apparel",
    priceCents: 1990,
    stock: 80,
  },
  {
    name: "Leather Card Wallet",
    slug: "leather-card-wallet",
    description:
      "Slim full-grain leather wallet with RFID shielding and card slots on both sides.",
    category: "Accessories",
    priceCents: 3990,
    stock: 45,
  },
  {
    name: "Stainless Water Bottle 750ml",
    slug: "stainless-water-bottle",
    description:
      "Double-walled vacuum bottle that keeps drinks cold 24h. Powder-coated finish.",
    category: "Accessories",
    priceCents: 3290,
    stock: 55,
  },
];

async function main() {
  // Admin login: admin@shop.local / admin1234
  await prisma.user.upsert({
    where: { email: "admin@shop.local" },
    update: {},
    create: {
      email: "admin@shop.local",
      name: "Store Admin",
      passwordHash: await bcrypt.hash("admin1234", 10),
      role: "ADMIN",
    },
  });

  for (const product of PRODUCTS) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: {
        ...product,
        image: `https://picsum.photos/seed/${product.slug}/800/800`,
      },
    });
  }

  const productCount = await prisma.product.count();
  console.log(
    `Seed complete: ${productCount} products, admin user admin@shop.local.`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
