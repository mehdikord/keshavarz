import { runAppAuthCleanupJob } from "@/server/jobs/app-auth-cleanup";
import { runExportCleanupJob } from "@/server/jobs/cleanup-exports";
import { runNotificationJobs } from "@/server/jobs/notification-deliveries";
import { runRbacExpiryJobSafe } from "@/server/jobs/rbac-expiry";
import {
  runPaymentDeadLetterDrainJob,
  runPaymentReconciliationJob,
  runSubscriptionExpirationJob,
} from "@/server/jobs/subscriptions-payments";
import { emitAlert } from "@/server/observability/alerts";
import { incrementMetric } from "@/server/observability/metrics";
import { prisma } from "@/server/db/prisma";
import { systemClock } from "@/server/clock/clock";
import { createRequestId } from "@/server/observability/request-id";

export const JOB_NAMES = [
  "app-auth-cleanup",
  "subscription-expiration",
  "payment-reconciliation",
  "payment-dead-letter-drain",
  "notification-deliveries",
  "export-cleanup",
  "rbac-expiry",
  "all",
] as const;

export type JobName = (typeof JOB_NAMES)[number];

const DEFAULT_LEASE_MS = 10 * 60 * 1000; // 10 minutes
const LEASE_OWNER = `${process.env.HOSTNAME ?? "local"}-${process.pid}`;

interface JobRunRecord {
  jobName: string;
  runId: string;
  leaseOwner: string;
  status: string;
  startedAt: Date;
  leaseExpiresAt: Date;
  completedAt: Date | null;
  durationMs: bigint | null;
  errorMessage: string | null;
}

async function tryAcquireLease(jobName: string): Promise<JobRunRecord | null> {
  const runId = createRequestId();
  const now = systemClock.now();
  const leaseExpiresAt = new Date(now.getTime() + DEFAULT_LEASE_MS);

  try {
    const created = await prisma.jobRun.create({
      data: {
        jobName,
        runId,
        leaseOwner: LEASE_OWNER,
        status: "running",
        startedAt: now,
        leaseExpiresAt,
      },
    });

    return {
      jobName: created.jobName,
      runId: created.runId,
      leaseOwner: created.leaseOwner,
      status: created.status,
      startedAt: created.startedAt,
      leaseExpiresAt: created.leaseExpiresAt,
      completedAt: created.completedAt,
      durationMs: created.durationMs,
      errorMessage: created.errorMessage,
    };
  } catch (error: unknown) {
    const isUniqueConstraint =
      error instanceof Error &&
      (error.message.includes("uq_job_runs_name") ||
        error.message.includes("Duplicate entry") ||
        error.message.includes("P2002"));

    if (isUniqueConstraint) {
      const existing = await prisma.jobRun.findUnique({
        where: { jobName },
      });

      if (!existing) return null;

      const leaseStillValid =
        existing.status === "running" &&
        existing.leaseExpiresAt > now &&
        existing.leaseOwner !== LEASE_OWNER;

      if (leaseStillValid) {
        return null; // another active run holds the lease
      }

      // lease expired or same owner — steal/renew it
      const renewed = await prisma.jobRun.update({
        where: { jobName },
        data: {
          runId,
          leaseOwner: LEASE_OWNER,
          status: "running",
          startedAt: now,
          leaseExpiresAt,
          completedAt: null,
          durationMs: null,
          errorMessage: null,
        },
      });

      return {
        jobName: renewed.jobName,
        runId: renewed.runId,
        leaseOwner: renewed.leaseOwner,
        status: renewed.status,
        startedAt: renewed.startedAt,
        leaseExpiresAt: renewed.leaseExpiresAt,
        completedAt: renewed.completedAt,
        durationMs: renewed.durationMs,
        errorMessage: renewed.errorMessage,
      };
    }

    throw error;
  }
}

async function releaseLease(
  jobName: string,
  runId: string,
  ok: boolean,
  durationMs: number,
  errorMessage?: string,
): Promise<void> {
  await prisma.jobRun.updateMany({
    where: { jobName, runId },
    data: {
      status: ok ? "completed" : "failed",
      completedAt: systemClock.now(),
      durationMs: BigInt(durationMs),
      errorMessage: errorMessage ?? null,
    },
  });
}

async function runNamedJob(name: Exclude<JobName, "all">) {
  switch (name) {
    case "app-auth-cleanup":
      return runAppAuthCleanupJob();
    case "subscription-expiration":
      return runSubscriptionExpirationJob();
    case "payment-reconciliation":
      return runPaymentReconciliationJob();
    case "payment-dead-letter-drain":
      return runPaymentDeadLetterDrainJob();
    case "notification-deliveries":
      return runNotificationJobs();
    case "export-cleanup":
      return runExportCleanupJob();
    case "rbac-expiry":
      return runRbacExpiryJobSafe();
  }
}

export async function runJobs(names: JobName[] = ["all"]) {
  const selected = names.includes("all")
    ? (JOB_NAMES.filter((name) => name !== "all") as Array<
        Exclude<JobName, "all">
      >)
    : (names.filter((name) => name !== "all") as Array<
        Exclude<JobName, "all">
      >);

  const results: Record<string, unknown> = {};

  for (const name of selected) {
    const lease = await tryAcquireLease(name);

    if (!lease) {
      results[name] = {
        durationMs: 0,
        ok: true,
        skipped: true,
        reason: "lease held by another runner",
      };
      continue;
    }

    const started = Date.now();
    let ok = false;
    let errorMessage: string | undefined;

    try {
      await runNamedJob(name);
      ok = true;
      incrementMetric("jobs_completed_total", { job: name });
    } catch (error) {
      incrementMetric("jobs_failed_total", { job: name });
      errorMessage =
        error instanceof Error ? error.message : String(error);
      emitAlert("job_failure", {
        job: name,
        message: errorMessage,
      });
    } finally {
      const durationMs = Date.now() - started;
      await releaseLease(name, lease.runId, ok, durationMs, errorMessage);
      results[name] = {
        durationMs,
        error: errorMessage,
        ok,
        runId: lease.runId,
      };
    }
  }

  return {
    jobs: results,
    ranAt: new Date().toISOString(),
  };
}
