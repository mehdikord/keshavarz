import { readFile, readdir } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";

/**
 * Lightweight SAST gate: scans first-party source for hardcoded secrets and
 * insecure signing patterns. Never reads .env or generated artifacts.
 */

const projectRoot = resolve(import.meta.dirname, "..");
const scanRoots = [
  resolve(projectRoot, "src"),
  resolve(projectRoot, "scripts"),
  resolve(projectRoot, "prisma"),
  resolve(projectRoot, "e2e"),
];

const supportedExtensions = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs"]);
const skipDirectories = new Set([
  "generated",
  "node_modules",
  ".next",
  "test",
  "tests",
  "fixtures",
]);

const patterns = [
  {
    id: "private-key-block",
    re: /-----BEGIN (?:RSA |EC |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/,
    description: "بلاک کلید خصوصی در سورس",
  },
  {
    id: "aws-access-key",
    re: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/,
    description: "کلید دسترسی AWS هاردکد",
  },
  {
    id: "generic-api-key-assignment",
    re: /(?:api[_-]?key|apikey|api_token|access[_-]?token|refresh[_-]?token|secret[_-]?key|client[_-]?secret)\s*[:=]\s*["'][^"']{12,}["']/i,
    description: "کلید/توکن API به‌صورت هاردکد",
  },
  {
    id: "hardcoded-password",
    re: /(?:password|passwd|pwd|secret)\s*[:=]\s*["'][^"']{8,}["']/i,
    description: "رمز/secret هاردکد در کد",
  },
  {
    id: "hardcoded-bearer",
    re: /\bBearer\s+[A-Za-z0-9._~+/=-]{20,}/i,
    description: "توکن Bearer هاردکد",
  },
  {
    id: "connection-string-credentials",
    re: /(?:mysql|postgres):\/\/[^:/\s]+:[^@\s/]+@/i,
    description: "credential دیتابیس در رشته اتصال",
  },
];

const allowlist = [
  {
    id: "hardcoded-password",
    file: (name) => name.includes(".test.") || name.includes(".spec."),
  },
  {
    id: "generic-api-key-assignment",
    file: (name) =>
      name.includes(".test.") || name.includes(".spec.") || name.includes(".fixtures"),
  },
  {
    id: "hardcoded-bearer",
    file: (name) => name.includes(".test.") || name.includes(".spec."),
  },
];

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      if (skipDirectories.has(entry.name)) continue;
      files.push(...(await collectFiles(path)));
    } else if (supportedExtensions.has(extname(entry.name))) {
      files.push(path);
    }
  }
  return files;
}

const violations = [];

for (const root of scanRoots) {
  const files = await collectFiles(root);
  for (const file of files) {
    const name = relative(projectRoot, file).replaceAll("\\", "/");
    const source = await readFile(file, "utf8");

    for (const rule of patterns) {
      const allowed = allowlist.some(
        (entry) => entry.id === rule.id && entry.file(name),
      );
      if (allowed) continue;

      const match = rule.re.exec(source);
      if (match) {
        const line = source.slice(0, match.index).split("\n").length;
        violations.push(`${name}:${line} :: ${rule.id} (${rule.description})`);
      }
    }
  }
}

if (violations.length > 0) {
  process.stderr.write(`[secret-scan] FAIL\n${violations.map((v) => ` - ${v}`).join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write("[secret-scan] OK\n");
}
