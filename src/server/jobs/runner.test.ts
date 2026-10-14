import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/server/db/prisma";
import { runJobs } from "@/server/jobs/runner";
import { systemClock } from "@/server/clock/clock";

describe.sequential("job lease mechanism", () => {
  beforeAll(async () => {
    await prisma.jobRun.deleteMany({
      where: { jobName: "app-auth-cleanup" },
    });
  });

  afterAll(async () => {
    await prisma.jobRun.deleteMany({
      where: { jobName: "app-auth-cleanup" },
    });
  });

  it("records a completed run for a job", async () => {
    const result = await runJobs(["app-auth-cleanup"]);

    expect(result.jobs["app-auth-cleanup"]).toMatchObject({
      error: undefined,
      ok: true,
    });

    const run = await prisma.jobRun.findUnique({
      where: { jobName: "app-auth-cleanup" },
    });

    expect(run).not.toBeNull();
    expect(run!.status).toBe("completed");
    expect(run!.runId).toBe(result.jobs["app-auth-cleanup"]!.runId);
    expect(run!.durationMs).not.toBeNull();
  });

  it("skips a job while another runner holds an active lease", async () => {
    const activeLeaseOwner = "another-host-12345";
    await prisma.jobRun.upsert({
      where: { jobName: "app-auth-cleanup" },
      update: {
        runId: "lease-held-test",
        leaseOwner: activeLeaseOwner,
        status: "running",
        startedAt: systemClock.now(),
        leaseExpiresAt: new Date(
          systemClock.now().getTime() + 10 * 60 * 1000,
        ),
        completedAt: null,
        durationMs: null,
        errorMessage: null,
      },
      create: {
        jobName: "app-auth-cleanup",
        runId: "lease-held-test",
        leaseOwner: activeLeaseOwner,
        status: "running",
        startedAt: systemClock.now(),
        leaseExpiresAt: new Date(
          systemClock.now().getTime() + 10 * 60 * 1000,
        ),
      },
    });

    const result = await runJobs(["app-auth-cleanup"]);

    expect(result.jobs["app-auth-cleanup"]).toMatchObject({
      ok: true,
      skipped: true,
    });

    const run = await prisma.jobRun.findUnique({
      where: { jobName: "app-auth-cleanup" },
    });
    expect(run!.status).toBe("running");
    expect(run!.leaseOwner).toBe(activeLeaseOwner);
  });

  it("steals an expired lease", async () => {
    await prisma.jobRun.upsert({
      where: { jobName: "app-auth-cleanup" },
      update: {
        runId: "stale-lease",
        leaseOwner: "stale-host",
        status: "running",
        startedAt: new Date(systemClock.now().getTime() - 60_000),
        leaseExpiresAt: new Date(systemClock.now().getTime() - 1_000),
        completedAt: null,
        durationMs: null,
        errorMessage: null,
      },
      create: {
        jobName: "app-auth-cleanup",
        runId: "stale-lease",
        leaseOwner: "stale-host",
        status: "running",
        startedAt: new Date(systemClock.now().getTime() - 60_000),
        leaseExpiresAt: new Date(systemClock.now().getTime() - 1_000),
      },
    });

    const result = await runJobs(["app-auth-cleanup"]);

    expect(result.jobs["app-auth-cleanup"]).toMatchObject({ ok: true });

    const run = await prisma.jobRun.findUnique({
      where: { jobName: "app-auth-cleanup" },
    });
    expect(run!.status).toBe("completed");
    expect(run!.leaseOwner).not.toBe("stale-host");
  });
});
