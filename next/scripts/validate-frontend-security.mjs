import { readFile, readdir } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";

/**
 * Lightweight frontend security static checks for Phase 13.04.
 */

const projectRoot = resolve(import.meta.dirname, "..");
const scanRoots = [
  resolve(projectRoot, "src/app"),
  resolve(projectRoot, "src/components"),
  resolve(projectRoot, "src/hooks"),
  resolve(projectRoot, "src/lib"),
  resolve(projectRoot, "src/stores"),
];

const supportedExtensions = new Set([".ts", ".tsx"]);

const banned = [
  {
    id: "dangerouslySetInnerHTML",
    re: /dangerouslySetInnerHTML/,
    allow: [],
  },
  {
    id: "token-localStorage",
    re: /localStorage\.(setItem|getItem)\([^)]*(token|accessToken|refreshToken|sessionToken)/i,
    allow: [],
  },
  {
    id: "password-hash-ui",
    re: /\bpasswordHash\b/,
    allow: ["src/server/"],
  },
];

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "server") continue;
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
    if (name.startsWith("src/server/")) continue;
    const source = await readFile(file, "utf8");
    for (const rule of banned) {
      if (rule.allow.some((prefix) => name.startsWith(prefix))) continue;
      if (rule.re.test(source)) {
        violations.push(`${name} :: ${rule.id}`);
      }
    }
  }
}

if (violations.length > 0) {
  process.stderr.write(
    `[frontend-security] FAIL\n${violations.map((v) => ` - ${v}`).join("\n")}\n`,
  );
  process.exitCode = 1;
} else {
  process.stdout.write("[frontend-security] OK\n");
}
