import { systemClock } from "@/server/clock/clock";
import { cleanupExpiredExports } from "@/server/modules/exports/exports.service";

export async function runExportCleanupJob() {
  const result = await cleanupExpiredExports();
  return {
    ...result,
    ranAt: systemClock.now().toISOString(),
  };
}
