import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");

function run(label, command, args) {
  process.stdout.write(`[release-check] ${label}\n`);
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    encoding: "utf8",
    shell: false,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(`${label} failed with exit ${result.status ?? "null"}`);
  }
}

try {
  run("no-mock-imports", "pnpm", ["check:no-mock-imports"]);
  run("admin-list-perf", "pnpm", ["check:admin-list-perf"]);
  run("frontend-security", "pnpm", ["check:frontend-security"]);
  run("secret-scan", "pnpm", ["check:secret-scan"]);
  run("api-contracts", "pnpm", ["check:api-contracts"]);
  run("api-boundaries", "pnpm", ["check:api-boundaries"]);
  run("api-tests", "pnpm", ["test:api"]);
  run("release-smoke", "pnpm", ["release:smoke"]);

  if (process.env.RELEASE_E2E === "1") {
    run("e2e", "pnpm", ["test:e2e"]);
  } else {
    process.stdout.write(
      "[release-check] e2e skipped (set RELEASE_E2E=1 with a running server to enable)\n",
    );
  }

  process.stdout.write("[release-check] OK\n");
} catch (error) {
  process.stderr.write(
    `[release-check] FAIL ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
}
