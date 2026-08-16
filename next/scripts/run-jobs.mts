import "dotenv/config";

import { prisma } from "../src/server/db/prisma";
import { JOB_NAMES, runJobs, type JobName } from "../src/server/jobs/runner";

const requested = process.argv.slice(2);
const names = (
  requested.length > 0 ? requested : ["all"]
).filter((name): name is JobName =>
  (JOB_NAMES as readonly string[]).includes(name),
);

let shuttingDown = false;

function registerGracefulShutdown() {
  const shutdown = (signal: NodeJS.Signals) => {
    if (shuttingDown) return;
    shuttingDown = true;
    process.stdout.write(`[run-jobs] received ${signal}; shutting down\n`);
    void prisma.$disconnect().finally(() => {
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

registerGracefulShutdown();

if (names.length === 0) {
  process.stderr.write(
    `[run-jobs] unknown job. available: ${JOB_NAMES.join(", ")}\n`,
  );
  process.exitCode = 1;
} else {
  try {
    const result = await runJobs(names);
    process.stdout.write(`${JSON.stringify(result)}\n`);
    const failed = Object.values(result.jobs).some(
      (job) =>
        job &&
        typeof job === "object" &&
        "ok" in job &&
        (job as { ok: boolean }).ok === false,
    );
    if (failed) {
      process.exitCode = 1;
    }
  } finally {
    await prisma.$disconnect();
  }
}
