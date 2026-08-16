import type { NextRequest } from "next/server";

import { requireAdminSession } from "@/server/auth";
import { apiSuccess, parseWithSchema, withApiHandler } from "@/server/http";
import { AdminAuditLogParamsSchema } from "@/server/modules/admin-audit/admin-audit.schemas";
import { getAuditLogForAdmin } from "@/server/modules/admin-audit/admin-audit.service";
import { requireAdminPermission } from "@/server/modules/admin-rbac/require-admin-permission";

export const runtime = "nodejs";

function auditLogIdFromPath(request: NextRequest): string | undefined {
  return request.nextUrl.pathname.split("/").at(-1);
}

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "audit_logs.view", request);
  const params = parseWithSchema(AdminAuditLogParamsSchema, {
    auditLogId: auditLogIdFromPath(request),
  });
  const auditLog = await getAuditLogForAdmin(params.auditLogId);
  return apiSuccess(auditLog, context.requestId);
});
