import * as z from "zod";

import { adminApi } from "@/lib/api/admin-client";
import type { AdminCursorMeta, AdminListLimit } from "@/lib/admin/search-params";

export const AdminUserListItemSchema = z
  .object({
    createdAt: z.string(),
    image: z.string().nullable(),
    isActive: z.boolean(),
    lastLoginAt: z.string().nullable(),
    name: z.string(),
    phone: z.string(),
    userId: z.string(),
  })
  .strict();

export const AdminUserDetailSchema = AdminUserListItemSchema.extend({
  deletedAt: z.string().nullable(),
  locale: z.string(),
  phoneVerifiedAt: z.string().nullable(),
  providerProfile: z
    .object({
      active: z.boolean(),
      approved: z.boolean(),
      approvedAt: z.string().nullable(),
      available: z.boolean(),
    })
    .nullable(),
  timezone: z.string(),
  updatedAt: z.string(),
});

export const AdminModerationActionSchema = z
  .object({
    action: z.string(),
    adminId: z.string(),
    createdAt: z.string(),
    endsAt: z.string().nullable(),
    moderationActionId: z.string(),
    reason: z.string(),
    startsAt: z.string(),
  })
  .strict();

export type AdminUserListItem = z.infer<typeof AdminUserListItemSchema>;
export type AdminUserDetail = z.infer<typeof AdminUserDetailSchema>;
export type AdminModerationAction = z.infer<typeof AdminModerationActionSchema>;

export type UserModerationActionType =
  | "activate"
  | "deactivate"
  | "suspend"
  | "ban"
  | "unban"
  | "warning";

const CursorMetaSchema = z.object({
  hasMore: z.boolean(),
  limit: z.number(),
  nextCursor: z.string().nullable(),
});

export async function fetchAdminUsers(input: {
  cursor?: string | null;
  isActive?: "0" | "1";
  limit?: AdminListLimit;
  q?: string;
  signal?: AbortSignal;
}): Promise<{ items: AdminUserListItem[]; meta: AdminCursorMeta }> {
  const result = await adminApi.get<{ users: unknown[] }>("/users", {
    query: {
      cursor: input.cursor || undefined,
      isActive: input.isActive,
      limit: input.limit,
      q: input.q || undefined,
    },
    signal: input.signal,
  });

  return {
    items: z.array(AdminUserListItemSchema).parse(result.data.users),
    meta: CursorMetaSchema.parse(result.meta),
  };
}

export async function fetchAdminUser(
  userId: string,
  signal?: AbortSignal,
): Promise<AdminUserDetail> {
  const result = await adminApi.get<unknown>(`/users/${userId}`, { signal });
  return AdminUserDetailSchema.parse(result.data);
}

export async function patchAdminUser(
  userId: string,
  input: { locale?: string; name?: string; timezone?: string },
): Promise<AdminUserDetail> {
  const result = await adminApi.patch<unknown>(`/users/${userId}`, input);
  return AdminUserDetailSchema.parse(result.data);
}

export async function fetchUserModerationActions(input: {
  cursor?: string | null;
  limit?: AdminListLimit;
  signal?: AbortSignal;
  userId: string;
}): Promise<{ items: AdminModerationAction[]; meta: AdminCursorMeta }> {
  const result = await adminApi.get<{ moderationActions: unknown[] }>(
    `/users/${input.userId}/moderation-actions`,
    {
      query: {
        cursor: input.cursor || undefined,
        limit: input.limit,
      },
      signal: input.signal,
    },
  );

  return {
    items: z.array(AdminModerationActionSchema).parse(result.data.moderationActions),
    meta: CursorMetaSchema.parse(result.meta),
  };
}

export async function createUserModerationAction(
  userId: string,
  input: {
    action: UserModerationActionType;
    endsAt?: string;
    reason: string;
  },
): Promise<AdminModerationAction> {
  const result = await adminApi.post<unknown>(
    `/users/${userId}/moderation-actions`,
    input,
  );
  return AdminModerationActionSchema.parse(result.data);
}
