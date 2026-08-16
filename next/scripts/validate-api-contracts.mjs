import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const catalogPath = resolve(projectRoot, "../docs/api-tasks/endpoint-catalog.md");
const databaseSchemaPath = resolve(projectRoot, "../docs/database.schema");
const domainMappingPath = resolve(projectRoot, "../docs/openapi/domain-mapping.md");
const openApiPath = resolve(projectRoot, "../docs/openapi/openapi.json");

const HTTP_METHODS = new Set(["get", "post", "put", "patch", "delete"]);
const REQUIRED_TAGS = new Set([
  "App Auth",
  "Provider",
  "Consumer",
  "Admin Auth",
  "Admin Management",
]);

function fail(message) {
  throw new Error(`[api-contracts] ${message}`);
}

function endpointKey(method, path) {
  return `${method.toUpperCase()} ${path}`;
}

function extractCatalogEndpoints(markdown) {
  const endpoints = new Set();
  const pattern = /^\| `(GET|POST|PUT|PATCH|DELETE)` \| `([^`]+)` \|/gm;

  for (const match of markdown.matchAll(pattern)) {
    const method = match[1];
    const path = match[2];

    if (method && path) {
      endpoints.add(endpointKey(method, path));
    }
  }

  return endpoints;
}

function extractStorageObjects(schema) {
  const objects = new Set();
  const pattern =
    /^CREATE (?:TABLE IF NOT EXISTS|(?:OR REPLACE )?VIEW) ([a-z0-9_]+)/gm;

  for (const match of schema.matchAll(pattern)) {
    const name = match[1];

    if (name) {
      objects.add(name);
    }
  }

  return objects;
}

function getOpenApiOperations(document) {
  const operations = new Map();

  for (const [path, pathItem] of Object.entries(document.paths ?? {})) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (HTTP_METHODS.has(method)) {
        operations.set(endpointKey(method, path), operation);
      }
    }
  }

  return operations;
}

function assertSameInventory(catalogEndpoints, operations) {
  const openApiEndpoints = new Set(operations.keys());
  const missing = [...catalogEndpoints].filter((endpoint) => !openApiEndpoints.has(endpoint));
  const extra = [...openApiEndpoints].filter((endpoint) => !catalogEndpoints.has(endpoint));

  if (missing.length > 0 || extra.length > 0) {
    fail(`endpoint inventory mismatch\nMissing: ${missing.join(", ") || "-"}\nExtra: ${extra.join(", ") || "-"}`);
  }
}

function assertOperations(operations) {
  const operationIds = new Set();

  for (const [key, operation] of operations) {
    if (typeof operation.operationId !== "string" || operation.operationId.length === 0) {
      fail(`${key} has no operationId`);
    }

    if (operationIds.has(operation.operationId)) {
      fail(`duplicate operationId: ${operation.operationId}`);
    }

    operationIds.add(operation.operationId);

    if (!Array.isArray(operation.tags) || operation.tags.length === 0) {
      fail(`${key} has no tag`);
    }

    if (!operation.responses || Object.keys(operation.responses).length === 0) {
      fail(`${key} has no responses`);
    }

    if (!Object.hasOwn(operation, "security")) {
      fail(`${key} must declare security explicitly`);
    }
  }
}

function assertPathParameters(document) {
  for (const [path, pathItem] of Object.entries(document.paths ?? {})) {
    const expected = [...path.matchAll(/\{([^}]+)\}/g)]
      .map((match) => match[1])
      .filter(Boolean);
    const declared = new Set(
      (pathItem.parameters ?? [])
        .filter((parameter) => parameter.in === "path")
        .map((parameter) => parameter.name),
    );

    for (const parameter of expected) {
      if (!declared.has(parameter)) {
        fail(`${path} does not declare path parameter ${parameter}`);
      }
    }
  }
}

function assertRequiredTags(document) {
  const tags = new Set((document.tags ?? []).map((tag) => tag.name));

  for (const tag of REQUIRED_TAGS) {
    if (!tags.has(tag)) {
      fail(`required tag is missing: ${tag}`);
    }
  }
}

function assertDomainMapping(storageObjects, domainMapping) {
  const missing = [...storageObjects].filter(
    (objectName) => !domainMapping.includes(`\`${objectName}\``),
  );

  if (missing.length > 0) {
    fail(`storage objects missing from domain mapping: ${missing.join(", ")}`);
  }
}

const [catalog, databaseSchema, domainMapping, openApiSource] = await Promise.all([
  readFile(catalogPath, "utf8"),
  readFile(databaseSchemaPath, "utf8"),
  readFile(domainMappingPath, "utf8"),
  readFile(openApiPath, "utf8"),
]);

const openApiDocument = JSON.parse(openApiSource);
const catalogEndpoints = extractCatalogEndpoints(catalog);
const operations = getOpenApiOperations(openApiDocument);
const storageObjects = extractStorageObjects(databaseSchema);
const tableCount = [
  ...databaseSchema.matchAll(/^CREATE TABLE IF NOT EXISTS /gm),
].length;
const viewCount = [
  ...databaseSchema.matchAll(/^CREATE (?:OR REPLACE )?VIEW /gm),
].length;

if (tableCount !== 31 || viewCount !== 2) {
  fail(
    `expected 31 tables and 2 views, found ${tableCount} tables and ${viewCount} views`,
  );
}

if (openApiDocument.openapi !== "3.1.0") {
  fail("OpenAPI version must be 3.1.0");
}

assertSameInventory(catalogEndpoints, operations);
assertOperations(operations);
assertPathParameters(openApiDocument);
assertRequiredTags(openApiDocument);
assertDomainMapping(storageObjects, domainMapping);

console.log(
  `[api-contracts] OK: ${operations.size} operations, ${tableCount} tables, ${viewCount} views`,
);
