import type { NextRequest } from "next/server";

import { getSecurityEnvironment } from "@/server/config/env";
import { runInTransaction } from "@/server/db/transaction";
import { API_ERROR_CODES, ApiError } from "@/server/errors";
import { JOB_NAMES, type JobName, runJobs } from "@/server/jobs/runner";
import { recordAdminAudit } from "@/server/modules/admin/audit/admin-audit.service";
import {
  countDeliveriesByStatus,
  deleteSettingRow,
  findSettingRow,
  listJobRunRows,
  listSettingRows,
  pingDatabase,
  upsertSettingRow,
} from "@/server/modules/admin/settings/settings-admin.repository";
import {
  coerceStoredValue,
  findSettingDefinition,
  SETTING_SECTIONS,
  type SettingDefinition,
  type SettingSectionId,
  type SettingValue,
  SETTINGS_REGISTRY,
  settingId,
  validateSettingValue,
} from "@/server/modules/system/settings-registry";
import { invalidateSettingsCache } from "@/server/modules/system/settings.service";
import { getMetricsSnapshot } from "@/server/observability/metrics";

interface Actor {
  adminId: bigint;
  request?: NextRequest;
}

const MODULE = "settings";
const DEFINITIONS = SETTINGS_REGISTRY as readonly SettingDefinition[];

// ====================================================================== general

export interface AdminSettingItem {
  definition: SettingDefinition;
  id: string;
  /** A saved row exists (otherwise the default applies). */
  isCustom: boolean;
  /** The saved row holds a value that no longer fits the definition; the default is in effect. */
  isInvalidStored: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
  value: SettingValue;
}

export interface AdminOtherSetting {
  description: string | null;
  group: string;
  isPublic: boolean;
  key: string;
  updatedAt: string;
  value: string;
  valueType: string;
}

export interface AdminSettingsOverview {
  others: AdminOtherSetting[];
  sections: Array<{ description: string; id: SettingSectionId; items: AdminSettingItem[]; title: string }>;
}

export async function getAdminSettings(): Promise<AdminSettingsOverview> {
  const rows = await listSettingRows();
  const byId = new Map(rows.map((row) => [`${row.settingGroup}.${row.settingKey}`, row]));

  const sections = SETTING_SECTIONS.map((section) => ({
    description: section.description,
    id: section.id,
    items: DEFINITIONS.filter((definition) => definition.section === section.id).map<AdminSettingItem>((definition) => {
      const id = settingId(definition);
      const row = byId.get(id);
      const stored = row ? coerceStoredValue(definition, row.settingValue) : undefined;
      return {
        definition,
        id,
        isCustom: Boolean(row),
        isInvalidStored: Boolean(row) && stored === undefined,
        updatedAt: row?.updatedAt.toISOString() ?? null,
        updatedBy: row?.updatedByAdmin?.name ?? null,
        value: stored ?? definition.default,
      };
    }),
    title: section.title,
  }));

  const others = rows
    .filter((row) => !findSettingDefinition(row.settingGroup, row.settingKey))
    .map<AdminOtherSetting>((row) => ({
      description: row.description,
      group: row.settingGroup,
      isPublic: row.isPublic === 1,
      key: row.settingKey,
      updatedAt: row.updatedAt.toISOString(),
      value: JSON.stringify(row.settingValue, null, 2),
      valueType: row.valueType,
    }));

  return { others, sections };
}

export async function saveSettingsSection(
  actor: Actor,
  section: SettingSectionId,
  values: Record<string, unknown>,
): Promise<{ changed: number }> {
  const definitions = DEFINITIONS.filter((definition) => definition.section === section);
  const fields: Record<string, string[]> = {};
  const accepted: Array<{ definition: SettingDefinition; value: SettingValue }> = [];

  for (const [id, raw] of Object.entries(values)) {
    const definition = definitions.find((candidate) => settingId(candidate) === id);
    if (!definition) {
      fields[id] = ["این تنظیم در این بخش وجود ندارد."];
      continue;
    }
    const result = validateSettingValue(definition, raw);
    if (result.ok) accepted.push({ definition, value: result.value });
    else fields[id] = [result.message];
  }

  if (Object.keys(fields).length > 0) {
    throw new ApiError(400, API_ERROR_CODES.validationFailed, "برخی مقادیر معتبر نیستند.", { fields });
  }

  const changed = await runInTransaction(async (transaction) => {
    const oldValues: Record<string, unknown> = {};
    const newValues: Record<string, unknown> = {};
    for (const { definition, value } of accepted) {
      const row = await findSettingRow(transaction, definition.group, definition.key);
      const current = row ? coerceStoredValue(definition, row.settingValue) : undefined;
      // Untouched fields are not written, so "custom" only marks values an admin actually set.
      if (row && current === value) continue;
      if (!row && value === definition.default) continue;
      await upsertSettingRow(transaction, {
        adminId: actor.adminId,
        description: definition.label,
        group: definition.group,
        isPublic: definition.isPublic,
        key: definition.key,
        value,
        valueType: definition.type,
      });
      const id = settingId(definition);
      oldValues[id] = current ?? definition.default;
      newValues[id] = value;
    }
    if (Object.keys(newValues).length > 0) {
      await recordAdminAudit(
        { action: "settings.update", adminId: actor.adminId, metadata: { section }, module: MODULE, newValues, oldValues, request: actor.request },
        transaction,
      );
    }
    return Object.keys(newValues).length;
  });

  invalidateSettingsCache();
  return { changed };
}

/** Deletes the saved value so the code default applies again. */
export async function resetSetting(actor: Actor, id: string): Promise<void> {
  const [group, key] = id.split(".") as [string, string];
  const definition = findSettingDefinition(group, key);
  if (!definition) throw new ApiError(404, API_ERROR_CODES.notFound, "تنظیم پیدا نشد.");

  await runInTransaction(async (transaction) => {
    const row = await findSettingRow(transaction, group, key);
    if (!row) return;
    await deleteSettingRow(transaction, row.id);
    await recordAdminAudit(
      {
        action: "settings.reset",
        adminId: actor.adminId,
        module: MODULE,
        newValues: { [id]: definition.default },
        oldValues: { [id]: row.settingValue },
        request: actor.request,
      },
      transaction,
    );
  });
  invalidateSettingsCache();
}

// ======================================================================= system

export type RunnableJob = Exclude<JobName, "all">;

export const JOB_LABELS: Record<RunnableJob, { description: string; label: string }> = {
  "app-auth-cleanup": { description: "پاک‌سازی کدهای تأیید و نشست‌های منقضی‌شده کاربران.", label: "پاک‌سازی ورود کاربران" },
  "notification-deliveries": { description: "ارسال اعلان‌های در صف و تلاش دوباره برای ارسال‌های ناموفق.", label: "ارسال اعلان‌ها" },
  "payment-dead-letter-drain": { description: "پردازش دوباره بازگشت‌های درگاه که با خطا روبه‌رو شده بودند.", label: "پردازش دوباره بازگشت‌های درگاه" },
  "payment-reconciliation": { description: "تطبیق پرداخت‌های بلاتکلیف با درگاه و بستن پرداخت‌های رهاشده.", label: "تطبیق پرداخت‌ها" },
  "subscription-expiration": { description: "پایان دادن به اشتراک‌هایی که زمانشان گذشته است.", label: "انقضای اشتراک‌ها" },
};

export interface AdminJobStatus {
  completedAt: string | null;
  description: string;
  durationMs: number | null;
  errorMessage: string | null;
  label: string;
  leaseExpiresAt: string | null;
  leaseOwner: string | null;
  /** Still in `job_runs` but no longer registered in the runner. */
  legacy: boolean;
  name: string;
  startedAt: string | null;
  /** never | running | completed | failed | stale (running with an expired lease) */
  status: string;
}

export interface AdminSystemStatus {
  app: { appEnv: string; nodeEnv: string; nodeVersion: string; serverTime: string; timeZone: string; uptimeSeconds: number; version: string };
  checkedAt: string;
  database: { error: string | null; latencyMs: number | null; ok: boolean; version: string | null };
  deliveries: {
    byStatus: Array<{ channel: string; count: number; status: string }>;
    failed: number;
    oldestQueuedAt: string | null;
    queued: number;
  };
  integrations: Array<{ detail: string; id: string; label: string; mode: string; tone: "success" | "warning" | "info" }>;
  jobs: AdminJobStatus[];
  metrics: Array<{ name: string; value: number }>;
}

function hostOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

export async function getSystemStatus(now: Date = new Date()): Promise<AdminSystemStatus> {
  let database: AdminSystemStatus["database"];
  try {
    const ping = await pingDatabase();
    database = { error: null, latencyMs: ping.latencyMs, ok: true, version: ping.version };
  } catch (error) {
    database = { error: error instanceof Error ? error.message.slice(0, 200) : "خطای ناشناخته", latencyMs: null, ok: false, version: null };
  }

  const [jobRows, deliveries] = database.ok
    ? await Promise.all([listJobRunRows(), countDeliveriesByStatus()])
    : [[], { oldestQueuedAt: null, rows: [] }];

  const environment = getSecurityEnvironment();
  const storageHost = hostOf(environment.OBJECT_STORAGE_GATEWAY_URL);
  const smsHost = hostOf(environment.SMS_QUEUE_URL);

  const integrations: AdminSystemStatus["integrations"] = [
    storageHost && environment.OBJECT_STORAGE_GATEWAY_TOKEN
      ? { detail: `درگاه ذخیره‌سازی: ${storageHost}`, id: "storage", label: "ذخیره‌سازی تصاویر", mode: "سرویس ذخیره‌سازی", tone: "success" }
      : {
          detail: "تصاویر روی دیسک همین سرور (پوشه next/storage) ذخیره می‌شوند؛ برای چند سرور یا پشتیبان‌گیری، درگاه ذخیره‌سازی را تنظیم کنید.",
          id: "storage",
          label: "ذخیره‌سازی تصاویر",
          mode: "دیسک محلی",
          tone: "warning",
        },
    {
      // app-auth.service.ts always uses ConsoleSmsQueue today, whatever the env says.
      detail: smsHost
        ? `صف پیامک (${smsHost}) تنظیم شده، اما ارسال کد ورود هنوز به آن وصل نیست و کد در لاگ سرور نوشته می‌شود.`
        : "کد ورود به‌جای پیامک در لاگ سرور نوشته می‌شود.",
      id: "sms",
      label: "پیامک کد ورود",
      mode: "کنسول (بدون ارسال واقعی)",
      tone: "warning",
    },
    {
      detail: "پرداخت‌ها با درگاه آزمایشی شبیه‌سازی می‌شوند و پولی جابه‌جا نمی‌شود.",
      id: "payment",
      label: "درگاه پرداخت",
      mode: "درگاه آزمایشی (mock)",
      tone: "warning",
    },
    environment.UPSTASH_REDIS_REST_URL && environment.UPSTASH_REDIS_REST_TOKEN
      ? { detail: `Redis: ${hostOf(environment.UPSTASH_REDIS_REST_URL) ?? "—"}`, id: "rate-limit", label: "محدودیت نرخ درخواست", mode: "Redis مشترک", tone: "success" }
      : {
          detail: "شمارنده‌ها در حافظه همین پروسه‌اند؛ با چند پروسه یا سرور، محدودیت‌ها بین آن‌ها مشترک نیست.",
          id: "rate-limit",
          label: "محدودیت نرخ درخواست",
          mode: "حافظه پروسه",
          tone: "info",
        },
  ];

  const runnable = JOB_NAMES.filter((name): name is RunnableJob => name !== "all");
  const rowByName = new Map(jobRows.map((row) => [row.jobName, row]));
  const toStatus = (name: string, legacy: boolean): AdminJobStatus => {
    const row = rowByName.get(name);
    const label = legacy ? { description: "این کار دیگر در سامانه ثبت نیست؛ فقط آخرین اجرای آن نمایش داده می‌شود.", label: name } : JOB_LABELS[name as RunnableJob];
    const stale = row?.status === "running" && row.leaseExpiresAt <= now;
    return {
      completedAt: row?.completedAt?.toISOString() ?? null,
      description: label.description,
      durationMs: row?.durationMs === null || row?.durationMs === undefined ? null : Number(row.durationMs),
      errorMessage: row?.errorMessage ?? null,
      label: label.label,
      leaseExpiresAt: row?.leaseExpiresAt.toISOString() ?? null,
      leaseOwner: row?.leaseOwner ?? null,
      legacy,
      name,
      startedAt: row?.startedAt.toISOString() ?? null,
      status: !row ? "never" : stale ? "stale" : row.status,
    };
  };
  const jobs = [
    ...runnable.map((name) => toStatus(name, false)),
    ...jobRows.filter((row) => !(runnable as string[]).includes(row.jobName)).map((row) => toStatus(row.jobName, true)),
  ];

  const byStatus = deliveries.rows.map((row) => ({ channel: row.channel, count: row._count._all, status: row.status }));

  return {
    app: {
      appEnv: environment.APP_ENV,
      nodeEnv: process.env.NODE_ENV ?? "—",
      nodeVersion: process.version,
      serverTime: now.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      uptimeSeconds: Math.round(process.uptime()),
      version: process.env.NEXT_PUBLIC_APP_VERSION ?? "—",
    },
    checkedAt: now.toISOString(),
    database,
    deliveries: {
      byStatus,
      failed: byStatus.filter((row) => row.status === "failed").reduce((sum, row) => sum + row.count, 0),
      oldestQueuedAt: deliveries.oldestQueuedAt?.toISOString() ?? null,
      queued: byStatus.filter((row) => row.status === "queued").reduce((sum, row) => sum + row.count, 0),
    },
    integrations,
    jobs,
    metrics: Object.entries(getMetricsSnapshot())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

/** Runs one background job (or all) in this request, under the runner's lease. */
export async function runJobNow(actor: Actor, job: JobName) {
  const result = await runJobs([job]);
  await recordAdminAudit({
    action: "settings.jobs.run",
    adminId: actor.adminId,
    metadata: { job, results: result.jobs },
    module: MODULE,
    request: actor.request,
  });
  return result;
}
