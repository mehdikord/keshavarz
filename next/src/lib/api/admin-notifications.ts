import * as z from "zod";

import type { AdminCursorMeta, AdminListLimit } from "@/lib/admin/search-params";
import { adminApi } from "@/lib/api/admin-client";

export const ADMIN_NOTIFICATION_TYPES = [
  "admin_broadcast",
  "payment_failed",
  "payment_paid",
  "request_accepted",
  "request_cancelled",
  "request_completed",
  "request_new",
  "request_rejected",
  "subscription_expired",
  "subscription_granted",
] as const;

export type AdminNotificationType = (typeof ADMIN_NOTIFICATION_TYPES)[number];

export const NOTIFICATION_CHANNELS = ["in_app", "sms", "push"] as const;
export type AdminNotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const AdminNotificationDeliverySchema = z
  .object({
    attemptsCount: z.number().int(),
    channel: z.string(),
    errorMessage: z.string().nullable(),
    status: z.string(),
  })
  .strict();

export const AdminNotificationSchema = z
  .object({
    body: z.string(),
    createdAt: z.string(),
    deepLink: z.string().nullable().optional(),
    deliveries: z.array(AdminNotificationDeliverySchema),
    notificationId: z.string(),
    readAt: z.string().nullable(),
    recipient: z
      .object({
        adminId: z.string().nullable(),
        type: z.string(),
        userId: z.string().nullable(),
      })
      .strict(),
    relatedRequestId: z.string().nullable().optional(),
    title: z.string(),
    type: z.string(),
  })
  .strict();

export type AdminNotification = z.infer<typeof AdminNotificationSchema>;

const CursorMetaSchema = z
  .object({
    hasMore: z.boolean(),
    limit: z.number().int(),
    nextCursor: z.string().nullable(),
  })
  .strict();

const SendResultSchema = z
  .object({
    batchKey: z.string(),
    createdCount: z.number().int(),
    notificationIds: z.array(z.string()),
  })
  .strict();

export async function fetchAdminNotifications(input: {
  cursor?: string | null;
  limit: AdminListLimit;
  recipientType?: "user" | "admin";
  signal?: AbortSignal;
  type?: AdminNotificationType;
}): Promise<{ items: AdminNotification[]; meta: AdminCursorMeta }> {
  const result = await adminApi.get<unknown>("/notifications", {
    query: {
      cursor: input.cursor ?? undefined,
      limit: input.limit,
      recipientType: input.recipientType,
      type: input.type,
    },
    signal: input.signal,
  });
  return z
    .object({
      items: z.array(AdminNotificationSchema),
      meta: CursorMetaSchema,
    })
    .parse(result.data);
}

export async function sendAdminNotification(input: {
  adminIds?: string[];
  body: string;
  channels?: AdminNotificationChannel[];
  deepLink?: string | null;
  title: string;
  type?: AdminNotificationType;
  userIds?: string[];
}): Promise<z.infer<typeof SendResultSchema>> {
  const result = await adminApi.post<unknown>("/notifications", {
    adminIds: input.adminIds,
    body: input.body,
    channels: input.channels ?? ["in_app"],
    deepLink: input.deepLink,
    title: input.title,
    type: input.type ?? "admin_broadcast",
    userIds: input.userIds,
  });
  return SendResultSchema.parse(result.data);
}
