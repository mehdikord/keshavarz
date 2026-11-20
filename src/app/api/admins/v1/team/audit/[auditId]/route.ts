import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { API_ERROR_CODES, ApiError } from "@/server/errors";
import { apiSuccess, parseWithSchema, withApiHandler } from "@/server/http";
import { getAuditEntry } from "@/server/modules/admin/team/audit-viewer.service";
import { requireTeamActor, segmentAfterLast } from "@/server/modules/admin/team/team-http";
import { AuditParamsSchema } from "@/server/modules/admin/team/team.schemas";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  await requireTeamActor(request, ADMIN_PERMISSIONS.auditLogsView);
  const { auditId } = parseWithSchema(AuditParamsSchema, { auditId: segmentAfterLast(request, "audit") });
  const entry = await getAuditEntry(auditId);
  if (!entry) throw new ApiError(404, API_ERROR_CODES.notFound, "رویداد پیدا نشد.");
  return apiSuccess(entry, context.requestId);
});
