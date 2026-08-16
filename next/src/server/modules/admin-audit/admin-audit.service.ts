import type { NextRequest } from "next/server";

import { getClientIp, getUserAgent } from "@/server/http";
import { API_ERROR_CODES, ApiError } from "@/server/errors";
import {
  findAdminAuditLogById,
  findAdminInternalIdByPublicId,
  insertAdminAuditLog,
  listAdminAuditLogs,
} from "@/server/modules/admin-audit/admin-audit.repository";
import { createLogger } from "@/server/observability";

function mapAuditLog(row: {
  action: string;
  admin: { publicId: string } | null;
  auditableId: bigint | null;
  auditableType: string | null;
  createdAt: Date;
  httpMethod: string | null;
  id: bigint;
  ipAddress: string | null;
  metadata: unknown;
  module: string;
  newValues: unknown;
  oldValues: unknown;
  route: string | null;
  userAgent: string | null;
}) {
  return {
    action: row.action,
    adminId: row.admin?.publicId ?? null,
    auditLogId: row.id.toString(),
    auditableId: row.auditableId?.toString() ?? null,
    auditableType: row.auditableType,
    createdAt: row.createdAt.toISOString(),
    httpMethod: row.httpMethod,
    ipAddress: row.ipAddress,
    metadata: row.metadata,
    module: row.module,
    newValues: row.newValues,
    oldValues: row.oldValues,
    route: row.route,
    userAgent: row.userAgent,
  };
}

export async function writeAdminAuditLog(input: {
  action: string;
  adminId: bigint | null;
  auditableId?: bigint | null;
  auditableType?: string | null;
  httpMethod?: string | null;
  metadata?: unknown;
  module: string;
  newValues?: unknown;
  oldValues?: unknown;
  request?: NextRequest;
  route?: string | null;
}): Promise<void> {
  try {
    await insertAdminAuditLog({
      action: input.action,
      adminId: input.adminId,
      auditableId: input.auditableId,
      auditableType: input.auditableType,
      httpMethod: input.httpMethod ?? input.request?.method ?? null,
      ipAddress: input.request ? getClientIp(input.request) : null,
      metadata: input.metadata,
      module: input.module,
      newValues: input.newValues,
      oldValues: input.oldValues,
      route: input.route ?? input.request?.nextUrl.pathname ?? null,
      userAgent: input.request ? getUserAgent(input.request) : null,
    });
  } catch (error) {
    const logger = createLogger(
      "01ADMINAUDITFAIL0000000000" as never,
      "admin-audit",
    );
    logger.error("admin.audit.write_failed", {
      action: input.action,
      errorName: error instanceof Error ? error.name : "UnknownError",
      module: input.module,
    });
  }
}

export async function listAuditLogsForAdmin(input: {
  action?: string;
  adminId?: string;
  cursor?: string;
  from?: string;
  limit: number;
  module?: string;
  to?: string;
}) {
  let adminInternalId: bigint | undefined;
  if (input.adminId) {
    const admin = await findAdminInternalIdByPublicId(input.adminId);
    if (!admin) {
      throw new ApiError(404, API_ERROR_CODES.notFound, "مدیر یافت نشد.");
    }
    adminInternalId = admin.id;
  }

  let cursorId: bigint | undefined;
  if (input.cursor) {
    try {
      cursorId = BigInt(input.cursor);
    } catch {
      throw new ApiError(
        400,
        API_ERROR_CODES.validationFailed,
        "cursor معتبر نیست.",
      );
    }
    const cursor = await findAdminAuditLogById(cursorId);
    if (!cursor) {
      throw new ApiError(
        400,
        API_ERROR_CODES.validationFailed,
        "cursor معتبر نیست.",
      );
    }
  }

  const rows = await listAdminAuditLogs({
    action: input.action,
    adminId: adminInternalId,
    cursorId,
    from: input.from ? new Date(input.from) : undefined,
    limit: input.limit,
    module: input.module,
    to: input.to ? new Date(input.to) : undefined,
  });
  const hasMore = rows.length > input.limit;
  const page = hasMore ? rows.slice(0, input.limit) : rows;
  const last = page.at(-1);

  return {
    items: page.map(mapAuditLog),
    meta: {
      hasMore,
      limit: input.limit,
      nextCursor: hasMore && last ? last.id.toString() : null,
    },
  };
}

export async function getAuditLogForAdmin(auditLogId: string) {
  let id: bigint;
  try {
    id = BigInt(auditLogId);
  } catch {
    throw new ApiError(404, API_ERROR_CODES.notFound, "لاگ یافت نشد.");
  }

  const row = await findAdminAuditLogById(id);
  if (!row) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "لاگ یافت نشد.");
  }
  return mapAuditLog(row);
}
