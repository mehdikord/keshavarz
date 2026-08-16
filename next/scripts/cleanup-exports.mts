import "dotenv/config";

import { prisma } from "../src/server/db/prisma";
import { runExportCleanupJob } from "../src/server/jobs/cleanup-exports";

try {
  const result = await runExportCleanupJob();
  process.stdout.write(
    `[cleanup-exports] expiredJobs=${result.expiredJobs} deletedFiles=${result.deletedFiles}\n`,
  );
} finally {
  await prisma.$disconnect();
}
