import { readFile, readdir } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const sourceRoot = resolve(projectRoot, "src");
const supportedExtensions = new Set([".ts", ".tsx"]);

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = resolve(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(path)));
    } else if (supportedExtensions.has(extname(entry.name))) {
      files.push(path);
    }
  }

  return files;
}

function sourceName(path) {
  return relative(projectRoot, path).replaceAll("\\", "/");
}

function extractImports(source) {
  return [
    ...source.matchAll(
      /(?:import|export)\s+(?:type\s+)?(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g,
    ),
  ].map((match) => match[1]).filter(Boolean);
}

function fail(message) {
  throw new Error(`[api-boundaries] ${message}`);
}

const files = await collectFiles(sourceRoot);
const graph = new Map();

for (const file of files) {
  const name = sourceName(file);
  const source = await readFile(file, "utf8");
  const imports = extractImports(source);

  if (
    name.startsWith("src/app/api/") &&
    imports.some(
      (specifier) =>
        specifier.includes("generated/prisma") ||
        specifier.endsWith("/db/prisma"),
    )
  ) {
    fail(`${name} imports Prisma directly`);
  }

  if (
    name.endsWith(".service.ts") &&
    imports.some(
      (specifier) =>
        specifier.includes("generated/prisma") ||
        specifier.endsWith("/db/prisma"),
    )
  ) {
    fail(`${name} bypasses its repository`);
  }

  graph.set(
    name,
    imports
      .filter((specifier) => specifier.startsWith("@/"))
      .map((specifier) => {
        const relativeImport = `src/${specifier.slice(2)}`;
        return files
          .map(sourceName)
          .find(
            (candidate) =>
              candidate === `${relativeImport}.ts` ||
              candidate === `${relativeImport}.tsx` ||
              candidate === `${relativeImport}/index.ts`,
          );
      })
      .filter(Boolean),
  );
}

const visiting = new Set();
const visited = new Set();

function visit(node, path = []) {
  if (visiting.has(node)) {
    fail(`dependency cycle: ${[...path, node].join(" -> ")}`);
  }

  if (visited.has(node)) {
    return;
  }

  visiting.add(node);

  for (const dependency of graph.get(node) ?? []) {
    visit(dependency, [...path, node]);
  }

  visiting.delete(node);
  visited.add(node);
}

for (const file of graph.keys()) {
  visit(file);
}

process.stdout.write(
  `[api-boundaries] OK: ${files.length} TypeScript files checked\n`,
);
