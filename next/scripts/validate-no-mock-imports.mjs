import { readFile, readdir } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";

/**
 * Ban `@/lib/mock` (and relative `lib/mock`) imports from production UI/lib paths.
 * Fixtures belong under `src/test` / `e2e` / `*.test.ts` only.
 * Server payment gateway mock lives under `src/server/integrations` (out of scope).
 */

const projectRoot = resolve(import.meta.dirname, "..");
const bannedRoots = [
  resolve(projectRoot, "src/app"),
  resolve(projectRoot, "src/components"),
  resolve(projectRoot, "src/hooks"),
  resolve(projectRoot, "src/stores"),
  resolve(projectRoot, "src/lib"),
];
const supportedExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);
const mockImportPattern =
  /(?:from|import)\s*["'](?:@\/lib\/mock(?:\/[^"']*)?|(?:\.\.\/)+lib\/mock(?:\/[^"']*)?)["']/;

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

const violations = [];

for (const root of bannedRoots) {
  const files = await collectFiles(root);
  for (const file of files) {
    const source = await readFile(file, "utf8");
    if (mockImportPattern.test(source) || source.includes("@/lib/mock")) {
      violations.push(sourceName(file));
    }
  }
}

// Also fail if the mock package directory still contains runtime modules.
const mockDir = resolve(projectRoot, "src/lib/mock");
try {
  const mockEntries = await readdir(mockDir, { withFileTypes: true });
  const runtimeFiles = mockEntries.filter(
    (entry) =>
      entry.isFile() &&
      supportedExtensions.has(extname(entry.name)) &&
      entry.name !== ".gitkeep",
  );
  if (runtimeFiles.length > 0) {
    for (const entry of runtimeFiles) {
      violations.push(`src/lib/mock/${entry.name}`);
    }
  }
} catch {
  // missing mock dir is fine
}

if (violations.length > 0) {
  process.stderr.write(
    `[no-mock-imports] FAIL\n${violations.map((v) => ` - ${v}`).join("\n")}\n`,
  );
  process.exitCode = 1;
} else {
  process.stdout.write("[no-mock-imports] OK\n");
}
