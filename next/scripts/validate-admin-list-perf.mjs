import { readFile, readdir } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";

/**
 * Static performance guard for admin list screens:
 * high-traffic list pages must use cursor pagination helpers.
 */

const projectRoot = resolve(import.meta.dirname, "..");
const listsRoot = resolve(
  projectRoot,
  "src/components/admin-panel",
);

const requiredListHints = [
  {
    file: "users/admin-users-list-page.tsx",
    mustInclude: ["AdminCursorPagination", "nextCursor", "hasMore"],
  },
  {
    file: "providers/admin-providers-list-page.tsx",
    mustInclude: ["AdminCursorPagination", "nextCursor", "hasMore"],
  },
  {
    file: "requests/admin-service-requests-list-page.tsx",
    mustInclude: ["AdminCursorPagination", "nextCursor", "hasMore"],
  },
  {
    file: "payments/admin-payments-list-page.tsx",
    mustInclude: ["AdminCursorPagination", "nextCursor", "hasMore"],
  },
  {
    file: "audit/admin-audit-logs-list-page.tsx",
    mustInclude: ["AdminCursorPagination", "nextCursor", "hasMore"],
  },
  {
    file: "subscriptions/admin-provider-subscriptions-page.tsx",
    mustInclude: ["AdminCursorPagination", "nextCursor", "hasMore"],
  },
  {
    file: "rbac/admin-admins-list-page.tsx",
    mustInclude: ["AdminCursorPagination", "nextCursor", "hasMore"],
  },
  {
    file: "notifications/admin-notifications-page.tsx",
    mustInclude: ["AdminCursorPagination", "nextCursor", "hasMore"],
  },
];

const bannedPatterns = [
  { label: "offset pagination", re: /\boffset\s*[:=]/ },
  { label: "page number API", re: /\bpage(Number|Index)?\s*[:=]/ },
];

const failures = [];

for (const item of requiredListHints) {
  const path = resolve(listsRoot, item.file);
  let source = "";
  try {
    source = await readFile(path, "utf8");
  } catch {
    failures.push(`missing ${item.file}`);
    continue;
  }

  for (const hint of item.mustInclude) {
    if (!source.includes(hint)) {
      failures.push(`${item.file} missing cursor hint: ${hint}`);
    }
  }

  for (const banned of bannedPatterns) {
    if (banned.re.test(source)) {
      failures.push(`${item.file} uses banned ${banned.label}`);
    }
  }
}

// Catalog is allowed to load full lists (small dataset) — document only.
const catalogNote =
  "catalog categories/services may load full lists (small catalog exception)";

if (failures.length > 0) {
  process.stderr.write(
    `[admin-list-perf] FAIL\n${failures.map((f) => ` - ${f}`).join("\n")}\n`,
  );
  process.exitCode = 1;
} else {
  process.stdout.write(
    `[admin-list-perf] OK (${requiredListHints.length} cursor lists; note: ${catalogNote})\n`,
  );
}

// Ensure lib/mock directory has no runtime modules (defense in depth with no-mock).
async function collectTs(directory) {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) files.push(...(await collectTs(path)));
      else if ([".ts", ".tsx"].includes(extname(entry.name))) files.push(path);
    }
    return files;
  } catch {
    return [];
  }
}

const mockFiles = await collectTs(resolve(projectRoot, "src/lib/mock"));
if (mockFiles.length > 0) {
  process.stderr.write(
    `[admin-list-perf] unexpected mock modules:\n${mockFiles
      .map((f) => ` - ${relative(projectRoot, f)}`)
      .join("\n")}\n`,
  );
  process.exitCode = 1;
}
