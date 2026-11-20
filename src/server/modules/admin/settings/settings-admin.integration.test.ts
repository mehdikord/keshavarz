import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/server/db/prisma";
import { createPublicId } from "@/server/identifiers/ulid";
import { RunJobSchema, SettingsSectionSaveSchema } from "@/server/modules/admin/settings/settings-admin.schemas";
import {
  getAdminSettings,
  getSystemStatus,
  resetSetting,
  runJobNow,
  saveSettingsSection,
} from "@/server/modules/admin/settings/settings-admin.service";
import { listCurrentProviderGallery } from "@/server/modules/provider/provider.service";
import { purchaseProviderSubscription } from "@/server/modules/subscriptions/subscriptions.service";
import { getPublicSettings } from "@/server/modules/system/public-settings.service";
import { findSettingDefinition, validateSettingValue } from "@/server/modules/system/settings-registry";
import { getSetting, invalidateSettingsCache } from "@/server/modules/system/settings.service";

const ADMIN_PHONE = "09996900099";
const PROVIDER_PHONE = "09996900001";
/** Registry rows this test writes; their previous state is restored afterwards. */
const TOUCHED = [
  ["app", "support_hours"],
  ["search", "candidate_limit"],
  ["search", "max_request_dates"],
  ["providers", "max_gallery_images"],
  ["subscriptions", "purchase_enabled"],
] as const;
const LOCKED_JOB = "subscription-expiration";

const request = new NextRequest("http://localhost/api/admins/v1/settings", {
  headers: { "user-agent": "vitest", "x-forwarded-for": "10.0.0.9" },
  method: "PATCH",
});

let actor: { adminId: bigint; request: NextRequest };
let providerUserId: bigint;
let savedRows: Awaited<ReturnType<typeof prisma.systemSetting.findMany>> = [];
let savedJob: Awaited<ReturnType<typeof prisma.jobRun.findUnique>> = null;

function touchedWhere() {
  return { OR: TOUCHED.map(([settingGroup, settingKey]) => ({ settingGroup, settingKey })) };
}

async function cleanupPeople() {
  const admins = await prisma.admin.findMany({ select: { id: true }, where: { phone: ADMIN_PHONE } });
  await prisma.adminAuditLog.deleteMany({ where: { adminId: { in: admins.map((row) => row.id) } } });
  await prisma.systemSetting.updateMany({
    data: { updatedByAdminId: null },
    where: { updatedByAdminId: { in: admins.map((row) => row.id) } },
  });
  await prisma.admin.deleteMany({ where: { phone: ADMIN_PHONE } });
  await prisma.providerProfile.deleteMany({ where: { user: { phone: PROVIDER_PHONE } } });
  await prisma.user.deleteMany({ where: { phone: PROVIDER_PHONE } });
}

describe.sequential("admin settings", () => {
  beforeAll(async () => {
    savedRows = await prisma.systemSetting.findMany({ where: touchedWhere() });
    savedJob = await prisma.jobRun.findUnique({ where: { jobName: LOCKED_JOB } });
    await prisma.systemSetting.deleteMany({ where: touchedWhere() });
    await cleanupPeople();
    invalidateSettingsCache();

    const admin = await prisma.admin.create({
      data: { name: "مدیر تنظیمات", password: "unused-hash", phone: ADMIN_PHONE, publicId: createPublicId() },
    });
    actor = { adminId: admin.id, request };
    const user = await prisma.user.create({ data: { name: "خدمات‌دهنده تنظیمات", phone: PROVIDER_PHONE, publicId: createPublicId() } });
    providerUserId = user.id;
    await prisma.providerProfile.create({ data: { userId: user.id } });
  }, 60_000);

  afterAll(async () => {
    await prisma.systemSetting.deleteMany({ where: touchedWhere() });
    for (const row of savedRows) {
      await prisma.systemSetting.create({
        data: {
          description: row.description,
          isPublic: row.isPublic,
          settingGroup: row.settingGroup,
          settingKey: row.settingKey,
          settingValue: row.settingValue as never,
          updatedByAdminId: row.updatedByAdminId,
          valueType: row.valueType,
        },
      });
    }
    await prisma.jobRun.deleteMany({ where: { jobName: LOCKED_JOB } });
    if (savedJob) await prisma.jobRun.create({ data: savedJob });
    await cleanupPeople();
    invalidateSettingsCache();
    await prisma.$disconnect();
  }, 60_000);

  it("validates values against the registry", () => {
    const phone = findSettingDefinition("app", "support_phone")!;
    expect(validateSettingValue(phone, "02112345678")).toEqual({ ok: true, value: "02112345678" });
    expect(validateSettingValue(phone, "")).toEqual({ ok: true, value: "" });
    expect(validateSettingValue(phone, "12345")).toMatchObject({ ok: false });

    const limit = findSettingDefinition("search", "candidate_limit")!;
    expect(validateSettingValue(limit, "50")).toEqual({ ok: true, value: 50 });
    expect(validateSettingValue(limit, 5)).toMatchObject({ ok: false });
    expect(validateSettingValue(limit, 2.5)).toMatchObject({ ok: false });

    const purchase = findSettingDefinition("subscriptions", "purchase_enabled")!;
    expect(validateSettingValue(purchase, "true")).toMatchObject({ ok: false });
    expect(SettingsSectionSaveSchema.safeParse({ values: { "x.y": { nested: true } } }).success).toBe(false);
  });

  it("falls back to defaults, and ignores invalid stored rows", async () => {
    expect(await getSetting("search.candidate_limit")).toBe(300);
    expect(await getSetting("subscriptions.purchase_enabled")).toBe(true);

    await prisma.systemSetting.create({
      data: { settingGroup: "search", settingKey: "candidate_limit", settingValue: "not-a-number", valueType: "integer" },
    });
    invalidateSettingsCache();
    expect(await getSetting("search.candidate_limit")).toBe(300);
    const overview = await getAdminSettings();
    const item = overview.sections.flatMap((section) => section.items).find((entry) => entry.id === "search.candidate_limit");
    expect(item).toMatchObject({ isCustom: true, isInvalidStored: true, value: 300 });
    await prisma.systemSetting.deleteMany({ where: { settingGroup: "search", settingKey: "candidate_limit" } });
  });

  it("saves a section, audits it and applies the new values right away", async () => {
    await expect(
      saveSettingsSection(actor, "search", { "search.candidate_limit": 5, "search.max_request_dates": 7 }),
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED", fields: { "search.candidate_limit": expect.any(Array) } });
    await expect(saveSettingsSection(actor, "search", { "app.support_hours": "x" })).rejects.toMatchObject({
      fields: { "app.support_hours": expect.any(Array) },
    });

    const result = await saveSettingsSection(actor, "search", { "search.candidate_limit": 50, "search.max_request_dates": 31 });
    // max_request_dates equals its default and has no row, so it is not written.
    expect(result.changed).toBe(1);
    expect(await getSetting("search.candidate_limit")).toBe(50);
    expect(await prisma.systemSetting.count({ where: { settingGroup: "search", settingKey: "max_request_dates" } })).toBe(0);

    const audit = await prisma.adminAuditLog.findFirst({ where: { action: "settings.update", adminId: actor.adminId } });
    expect(audit?.newValues).toEqual({ "search.candidate_limit": 50 });
    expect(audit?.oldValues).toEqual({ "search.candidate_limit": 300 });
  });

  it("exposes public settings only, with the registry's public flag", async () => {
    await saveSettingsSection(actor, "support", { "app.support_hours": "شنبه تا چهارشنبه" });
    const { settings } = await getPublicSettings();
    expect(settings.find((setting) => setting.key === "support_hours")?.settingValue).toBe("شنبه تا چهارشنبه");
    expect(settings.find((setting) => setting.key === "candidate_limit")).toBeUndefined();
  });

  it("drives app behaviour: gallery cap and subscription purchase switch", async () => {
    expect((await listCurrentProviderGallery(providerUserId)).maxImages).toBe(12);
    await saveSettingsSection(actor, "providers", { "providers.max_gallery_images": 3 });
    expect((await listCurrentProviderGallery(providerUserId)).maxImages).toBe(3);

    await saveSettingsSection(actor, "subscriptions", { "subscriptions.purchase_enabled": false });
    await expect(
      purchaseProviderSubscription(providerUserId, { planCode: "does-not-matter" }, `settings-test-${Date.now()}`),
    ).rejects.toMatchObject({ code: "CONFLICT", status: 409 });
  });

  it("resets a setting back to its default", async () => {
    await resetSetting(actor, "providers.max_gallery_images");
    expect(await getSetting("providers.max_gallery_images")).toBe(12);
    expect(await prisma.systemSetting.count({ where: { settingGroup: "providers", settingKey: "max_gallery_images" } })).toBe(0);
    await expect(resetSetting(actor, "nope.nothing")).rejects.toMatchObject({ status: 404 });
  });

  it("reports system status and guards manual job runs", async () => {
    const status = await getSystemStatus();
    expect(status.database.ok).toBe(true);
    expect(status.jobs.map((job) => job.name)).toEqual(expect.arrayContaining(["app-auth-cleanup", LOCKED_JOB]));
    expect(JSON.stringify(status)).not.toMatch(/TOKEN|SECRET|PEPPER/);

    expect(RunJobSchema.safeParse({ job: "drop-database" }).success).toBe(false);

    // Another runner holds the lease: the manual run must not run it twice.
    await prisma.jobRun.deleteMany({ where: { jobName: LOCKED_JOB } });
    await prisma.jobRun.create({
      data: {
        jobName: LOCKED_JOB,
        leaseExpiresAt: new Date(Date.now() + 60_000),
        leaseOwner: "another-host-1",
        runId: "settings-test-run",
        status: "running",
      },
    });
    const result = await runJobNow(actor, LOCKED_JOB);
    expect(result.jobs[LOCKED_JOB]).toMatchObject({ ok: true, skipped: true });
    expect(await prisma.adminAuditLog.count({ where: { action: "settings.jobs.run", adminId: actor.adminId } })).toBe(1);
  });
});
