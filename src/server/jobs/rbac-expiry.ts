import { systemClock } from "@/server/clock/clock";
import { prisma } from "@/server/db/prisma";
import { invalidateAdminPermissionCache } from "@/server/modules/admin-rbac/permission-cache";
import { emitAlert } from "@/server/observability/alerts";
import { incrementMetric } from "@/server/observability/metrics";

export async function runRbacExpiryJob() {
  const now = systemClock.now();

  const [expiredAssignments, expiredOverrides] = await Promise.all([
    prisma.adminRoleAssignment.count({
      where: {
        expiresAt: { lte: now },
      },
    }),
    prisma.adminPermissionOverride.count({
      where: {
        expiresAt: { lte: now },
      },
    }),
  ]);

  invalidateAdminPermissionCache();
  incrementMetric("rbac_cache_invalidations_total");

  return {
    expiredAssignments,
    expiredOverrides,
    invalidatedCache: true,
    ranAt: now.toISOString(),
  };
}

export async function runRbacExpiryJobSafe() {
  try {
    return await runRbacExpiryJob();
  } catch (error) {
    emitAlert("job_failure", {
      job: "rbac-expiry",
      message: error instanceof Error ? error.message : "unknown",
    });
    throw error;
  }
}
