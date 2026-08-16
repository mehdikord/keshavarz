import "dotenv/config";

import { prisma } from "../src/server/db/prisma";
import { runNotificationJobs } from "../src/server/jobs/notification-deliveries";

try {
  const result = await runNotificationJobs();
  process.stdout.write(
    `[notification-deliveries] processed=${result.processed} delivered=${result.delivered} skipped=${result.skipped} failed=${result.failed} deadLetter=${result.deadLetterCount}\n`,
  );
} finally {
  await prisma.$disconnect();
}
