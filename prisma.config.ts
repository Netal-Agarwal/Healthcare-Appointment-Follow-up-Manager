import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrate: {
    async adapter() {
      const { PrismaPg } = await import("@prisma/adapter-pg");
      const { default: pg } = await import("pg");
      const connectionString = process.env.DATABASE_URL ?? "";
      const pool = new pg.Pool({ connectionString });
      return new PrismaPg(pool) as any;
    },
  },
} as any);
