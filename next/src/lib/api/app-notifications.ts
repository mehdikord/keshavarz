import * as z from "zod";

import type { AdminCursorMeta, AdminListLimit } from "@/lib/admin/search-params";
import { appApi } from "@/lib/api/app-client";

export const AppNotificationSchema = z
  .object({
    body: z.string(),
    createdAt: z.string(),
    deepLink: z.string().nullable().optional(),
    notificationId: z.string(),
    readAt: z.string().nullable(),
    relatedRequestId: z.string().nullable().optional(),
    title: z.string(),
    type: z.string(),
  })
  .strict();

export type AppNotification = z.infer<typeof AppNotificationSchema>;

const CursorMetaSchema = z
  .object({
    hasMore: z.boolean(),
    limit: z.number().int(),
    nextCursor: z.string().nullable(),
  })
  .strict();

export async function fetchAppNotifications(input?: {
  cursor?: string | null;
  limit?: AdminListLimit;
  readStatus?: "all" | "read" | "unread";
  signal?: AbortSignal;
}): Promise<{ items: AppNotification[]; meta: AdminCursorMeta }> {
  const limit = input?.limit ?? 20;
  const result = await appApi.get<unknown>("/notifications", {
    query: {
      cursor: input?.cursor ?? undefined,
      limit,
      readStatus: input?.readStatus ?? "all",
    },
    signal: input?.signal,
  });
  const data = z
    .object({ notifications: z.array(AppNotificationSchema) })
    .parse(result.data);
  return {
    items: data.notifications,
    meta: CursorMetaSchema.parse(
      result.meta ?? { hasMore: false, limit, nextCursor: null },
    ),
  };
}

export async function fetchAppUnreadNotificationCount(
  signal?: AbortSignal,
): Promise<number> {
  const result = await appApi.get<unknown>("/notifications/unread-count", {
    signal,
  });
  return z.object({ unreadCount: z.number().int() }).parse(result.data)
    .unreadCount;
}

export async function markAppNotificationRead(
  notificationId: string,
): Promise<void> {
  await appApi.post(`/notifications/${notificationId}/read`, {});
}

export async function markAllAppNotificationsRead(
  until: string = new Date().toISOString(),
): Promise<number> {
  const result = await appApi.post<unknown>("/notifications/read-all", {
    until,
  });
  return z.object({ updated: z.number().int() }).parse(result.data).updated;
}

/** Map API deepLink / relatedRequestId to real Next app routes. */
export function resolveAppNotificationHref(
  notification: AppNotification,
  viewer: "consumer" | "provider",
): string {
  if (notification.relatedRequestId) {
    return viewer === "provider"
      ? `/providers/requests/${notification.relatedRequestId}`
      : `/users/requests/${notification.relatedRequestId}`;
  }

  const deepLink = notification.deepLink?.trim();
  if (!deepLink) {
    return viewer === "provider" ? "/providers/home" : "/users/home";
  }

  if (deepLink.startsWith("/provider/")) {
    return deepLink.replace("/provider/", "/providers/");
  }
  if (
    deepLink === "/users/subscription" ||
    deepLink.startsWith("/users/subscription")
  ) {
    return "/providers/subscription";
  }
  if (deepLink.startsWith("/users/payments")) {
    return "/providers/subscription";
  }

  return deepLink;
}
