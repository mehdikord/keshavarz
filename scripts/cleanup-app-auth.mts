import "dotenv/config";

import { prisma } from "../src/server/db/prisma";
import { runAppAuthCleanupJob } from "../src/server/jobs/app-auth-cleanup";

try {
  const result = await runAppAuthCleanupJob();
  process.stdout.write(
    `[app-auth-cleanup] deleted otps=${result.otps} sessions=${result.sessions}\n`,
  );
} finally {
  await prisma.$disconnect();
}
