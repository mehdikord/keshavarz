import * as z from "zod";

import type { AdminCursorMeta, AdminListLimit } from "@/lib/admin/search-params";
import { adminApi } from "@/lib/api/admin-client";

export const AdminAuditLogSchema = z
  .object({
    action: z.string(),
    adminId: z.string().nullable(),
    auditLogId: z.string(),
    auditableId: z.string().nullable(),
    auditableType: z.string().nullable(),
    createdAt: z.string(),
    httpMethod: z.string().nullable(),
    ipAddress: z.string().nullable(),
    metadata: z.unknown(),
    module: z.string(),
    newValues: z.unknown(),
    oldValues: z.unknown(),
    route: z.string().nullable(),
    userAgent: z.string().nullable(),
  })
  .strict();

export type AdminAuditLog = z.infer<typeof AdminAuditLogSchema>;

const CursorMetaSchema = z
  .object({
    hasMore: z.boolean(),
    limit: z.number().int(),
    nextCursor: z.string().nullable(),
  })
  .strict();

export async function fetchAdminAuditLogs(input: {
  action?: string;
  adminId?: string;
  cursor?: string | null;
  from?: string;
  limit: AdminListLimit;
  module?: string;
  signal?: AbortSignal;
  to?: string;
}): Promise<{ items: AdminAuditLog[]; meta: AdminCursorMeta }> {
  const result = await adminApi.get<unknown>("/audit-logs", {
    query: {
      action: input.action,
      adminId: input.adminId,
      cursor: input.cursor ?? undefined,
      from: input.from,
      limit: input.limit,
      module: input.module,
      to: input.to,
    },
    signal: input.signal,
  });
  const parsed = z
    .object({
      items: z.array(AdminAuditLogSchema),
      meta: CursorMetaSchema,
    })
    .parse(result.data);
  return parsed;
}

export async function fetchAdminAuditLog(
  auditLogId: string,
  signal?: AbortSignal,
): Promise<AdminAuditLog> {
  const result = await adminApi.get<unknown>(`/audit-logs/${auditLogId}`, {
    signal,
  });
  return AdminAuditLogSchema.parse(result.data);
}
