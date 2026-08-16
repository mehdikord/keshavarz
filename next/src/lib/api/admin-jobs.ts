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

const JobsRunResultSchema = z
  .object({
    jobs: z.record(z.string(), z.unknown()),
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
