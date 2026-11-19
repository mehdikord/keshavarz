import * as z from "zod";

import { adminApi } from "@/lib/api/admin-client";

export const ADMIN_JOB_NAMES = [
  "app-auth-cleanup",
  "subscription-expiration",
  "payment-reconciliation",
  "payment-dead-letter-drain",
  "notification-deliveries",
  "export-cleanup",
  "rbac-expiry",
  "all",
] as const;

export type AdminJobName = (typeof ADMIN_JOB_NAMES)[number];

export const ADMIN_JOB_LABELS: Record<AdminJobName, string> = {
  "app-auth-cleanup": "پاک‌سازی نشست‌ها و کدهای ورود",
  "subscription-expiration": "انقضای اشتراک‌ها",
  "payment-reconciliation": "تطبیق پرداخت‌ها",
  "payment-dead-letter-drain": "پردازش صف خطای پرداخت",
  "notification-deliveries": "ارسال اعلان‌ها",
  "export-cleanup": "پاک‌سازی خروجی‌های منقضی",
  "rbac-expiry": "انقضای استثناهای دسترسی",
  all: "همه",
};

export const PaymentDeadLetterSchema = z
  .object({
    attempts: z.number().int(),
    enqueuedAt: z.string(),
    id: z.string(),
    lastError: z.string().nullable().optional(),
  })
  .passthrough();

export const NotificationDeadLetterSchema = z
  .object({
    attemptsCount: z.number().int(),
    channel: z.string(),
    deliveryId: z.string(),
    errorMessage: z.string().nullable(),
    failedAt: z.string().nullable(),
    notificationId: z.string(),
    title: z.string(),
    type: z.string(),
    updatedAt: z.string(),
  })
  .passthrough();

export type PaymentDeadLetter = z.infer<typeof PaymentDeadLetterSchema>;
export type NotificationDeadLetter = z.infer<typeof NotificationDeadLetterSchema>;

export const JobRunOutcomeSchema = z
  .object({
    durationMs: z.number(),
    error: z.string().optional(),
    ok: z.boolean(),
    reason: z.string().optional(),
    runId: z.string().optional(),
    skipped: z.boolean().optional(),
  })
  .passthrough();

export type JobRunOutcome = z.infer<typeof JobRunOutcomeSchema>;

const JobsRunResultSchema = z
  .object({
    jobs: z.record(z.string(), JobRunOutcomeSchema),
    ranAt: z.string(),
  })
  .strict();

export async function fetchPaymentDeadLetters(
  signal?: AbortSignal,
): Promise<PaymentDeadLetter[]> {
  const result = await adminApi.get<unknown>("/jobs/dead-letters/payments", {
    signal,
  });
  return z
    .object({ items: z.array(PaymentDeadLetterSchema) })
    .parse(result.data).items;
}

export async function fetchNotificationDeadLetters(
  signal?: AbortSignal,
): Promise<NotificationDeadLetter[]> {
  const result = await adminApi.get<unknown>(
    "/jobs/dead-letters/notifications",
    { signal },
  );
  return z
    .object({ items: z.array(NotificationDeadLetterSchema) })
    .parse(result.data).items;
}

export async function replayPaymentDeadLetter(deadLetterId: string) {
  const result = await adminApi.post<unknown>(
    `/jobs/dead-letters/payments/${encodeURIComponent(deadLetterId)}/replay`,
  );
  return result.data;
}

export async function replayNotificationDeadLetter(deliveryId: string) {
  const result = await adminApi.post<unknown>(
    `/jobs/dead-letters/notifications/${encodeURIComponent(deliveryId)}/replay`,
  );
  return result.data;
}

export async function runAdminJobs(jobs: AdminJobName[]) {
  const result = await adminApi.post<unknown>("/jobs/run", { jobs });
  return JobsRunResultSchema.parse(result.data);
}
