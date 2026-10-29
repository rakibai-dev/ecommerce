// Single PrismaClient instance for Next.js server code.
// In dev the instance is cached on globalThis so route reloads (HMR) don't exhaust connections.
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
