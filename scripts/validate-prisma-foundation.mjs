import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const schemaPath = resolve(projectRoot, "prisma/schema.prisma");
const migrationPath = resolve(
  projectRoot,
  "prisma/migrations/20260803120000_initial_schema/migration.sql",
);
const referencePath = resolve(projectRoot, "../docs/database.schema");
const envExamplePath = resolve(projectRoot, ".env.example");
const packagePath = resolve(projectRoot, "package.json");

function fail(message) {
  throw new Error(`[prisma-foundation] ${message}`);
}

const [schema, migration, reference, envExample, packageSource] =
  await Promise.all([
    readFile(schemaPath, "utf8"),
    readFile(migrationPath, "utf8"),
    readFile(referencePath, "utf8"),
    readFile(envExamplePath, "utf8"),
    readFile(packagePath, "utf8"),
  ]);

const modelCount = [...schema.matchAll(/^model /gm)].length;
const modelMapCount = [...schema.matchAll(/^\s+@@map\("[a-z0-9_]+"\)$/gm)]
  .length;
const tableCount = [...reference.matchAll(/^CREATE TABLE IF NOT EXISTS /gm)]
  .length;
const viewCount = [
  ...reference.matchAll(/^CREATE (?:OR REPLACE )?VIEW /gm),
].length;
const packageJson = JSON.parse(packageSource);

if (modelCount !== 34 || modelMapCount < 34) {
  fail(`expected 34 mapped models, found ${modelCount} models and ${modelMapCount} maps`);
}

if (tableCount !== 34 || viewCount !== 2) {
  fail(`reference must contain 34 tables and 2 views`);
}

const migrationTables = new Set(
  [...migration.matchAll(/^CREATE TABLE IF NOT EXISTS ([a-z0-9_]+)/gm)].map(
    (match) => match[1],
  ),
);
for (const table of migrationTables) {
  if (!reference.includes(`CREATE TABLE IF NOT EXISTS ${table}`)) {
    fail(`reference is missing a table from the initial migration: ${table}`);
  }
}

for (const requiredSql of [
  "GENERATED ALWAYS AS",
  "uq_service_request_single_accepted",
  "uq_provider_subscriptions_one_active",
  "CREATE OR REPLACE VIEW v_searchable_provider_services",
  "CREATE OR REPLACE VIEW v_completed_service_request_financials",
  "CONSTRAINT chk_",
]) {
  if (!migration.includes(requiredSql)) {
    fail(`initial migration is missing: ${requiredSql}`);
  }
}

for (const environmentVariable of [
  "DATABASE_URL",
  "DIRECT_DATABASE_URL",
  "SHADOW_DATABASE_URL",
]) {
  if (!envExample.includes(environmentVariable)) {
    fail(`.env.example is missing ${environmentVariable}`);
  }
}

for (const dependency of [
  ["dependencies", "@prisma/client"],
  ["dependencies", "@prisma/adapter-mariadb"],
  ["dependencies", "mariadb"],
  ["devDependencies", "prisma"],
]) {
  const [group, name] = dependency;
  const version = packageJson[group]?.[name];

  if (typeof version !== "string" || /^[~^*]/.test(version)) {
    fail(`${name} must use an exact pinned version`);
  }
}

console.log(
  `[prisma-foundation] OK: ${modelCount} models, ${tableCount} tables, ${viewCount} views`,
);
