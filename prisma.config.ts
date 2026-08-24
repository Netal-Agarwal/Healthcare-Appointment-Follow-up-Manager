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
    url: process.env.DATABASE_URL || env("DATABASE_URL"),
  },
});