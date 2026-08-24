import "dotenv/config";
import path from "node:path";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),

  migrations: {
    path: path.join("prisma", "migrations"),
  },

  datasource: {
    // Prefer process.env which Vercel injects during build; fall back to prisma/config's env helper.
    // If no DATABASE_URL is available during build (CI), fall back to a harmless placeholder
    // so `prisma generate` can run. Runtime will still use the actual env var when available.
    url:
      process.env.DATABASE_URL ||
      (typeof env === "function" ? env("DATABASE_URL") : undefined) ||
      "postgresql://user:pass@localhost:5432/db?schema=public",
  },
});