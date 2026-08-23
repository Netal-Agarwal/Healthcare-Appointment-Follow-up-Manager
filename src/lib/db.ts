import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const connectionString = process.env.DATABASE_URL || "";
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ||
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new PrismaClient({ adapter: adapter as any });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

