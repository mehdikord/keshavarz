import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, parseQuery, withApiHandler } from "@/server/http";
import { listAuditEntries } from "@/server/modules/admin/team/audit-viewer.service";
import { requireTeamActor } from "@/server/modules/admin/team/team-http";
import { AuditListQuerySchema } from "@/server/modules/admin/team/team.schemas";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  await requireTeamActor(request, ADMIN_PERMISSIONS.auditLogsView);
  const { items, ...meta } = await listAuditEntries(parseQuery(request, AuditListQuerySchema));
  return apiSuccess(items, context.requestId, { meta });
});
