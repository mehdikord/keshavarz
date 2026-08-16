import "dotenv/config";

import { prisma } from "../src/server/db/prisma";
import {
  runPaymentDeadLetterDrainJob,
  runPaymentReconciliationJob,
  runSubscriptionExpirationJob,
} from "../src/server/jobs/subscriptions-payments";

try {
  const expired = await runSubscriptionExpirationJob();
  const reconciled = await runPaymentReconciliationJob();
  const deadLetter = await runPaymentDeadLetterDrainJob();
  process.stdout.write(
    `[subscriptions-payments] expired=${expired.expired} reconciled=${reconciled.failed}/${reconciled.scanned} deadLetterProcessed=${deadLetter.processed} deadLetterFailed=${deadLetter.failed}\n`,
  );
} finally {
  await prisma.$disconnect();
}
