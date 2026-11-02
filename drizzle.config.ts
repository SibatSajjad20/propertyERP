import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env" });

const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error("DATABASE_URL or DIRECT_URL is required");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dbCredentials: {
    url: dbUrl,
  },
  strict: true,
  verbose: true,
  migrations: {
    schema: "public",
  },
});
