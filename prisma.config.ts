import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),

  migrations: {
    path: path.join("prisma", "migrations"),
  },

  datasource: {
    // Use process.env first (Vercel injects this during build). If not present in the
    // build environment, fall back to a harmless placeholder so `prisma generate` can run.
    url: process.env.DATABASE_URL || "postgresql://user:pass@localhost:5432/db?schema=public",
  },
});