import type { NextRequest } from "next/server";

import { requireAdminSession } from "@/server/auth";
import { apiSuccess, parseQuery, withApiHandler } from "@/server/http";
import { AdminAuditLogsQuerySchema } from "@/server/modules/admin-audit/admin-audit.schemas";
import { listAuditLogsForAdmin } from "@/server/modules/admin-audit/admin-audit.service";
import { requireAdminPermission } from "@/server/modules/admin-rbac/require-admin-permission";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "audit_logs.view", request);
  const query = parseQuery(request, AdminAuditLogsQuerySchema);
  const result = await listAuditLogsForAdmin({
    action: query.action,
    adminId: query.adminId,
    cursor: query.cursor,
    from: query.from,
    limit: query.limit,
    module: query.module,
    to: query.to,
  });
  return apiSuccess({ auditLogs: result.items }, context.requestId, {
    meta: result.meta,
  });
});
