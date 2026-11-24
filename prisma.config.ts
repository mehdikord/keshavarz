import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Next reads `.env.local` before `.env`, the Prisma CLI does not. Take just the shadow
// database from it: when that equals the main database, every migrate command refuses to run.
// Precedence: shell > .env.local > .env. The migration target still comes from `.env`.
const localEnv: Record<string, string> = {};
config({ path: ".env.local", processEnv: localEnv, quiet: true });
if (localEnv.SHADOW_DATABASE_URL) {
  process.env.SHADOW_DATABASE_URL ??= localEnv.SHADOW_DATABASE_URL;
}
config({ quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DIRECT_DATABASE_URL"),
    shadowDatabaseUrl: env("SHADOW_DATABASE_URL"),
  },
});
