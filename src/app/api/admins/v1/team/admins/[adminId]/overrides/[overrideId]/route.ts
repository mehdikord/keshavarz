import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, parseWithSchema, withApiHandler } from "@/server/http";
import { requireTeamActor, segmentAfterLast } from "@/server/modules/admin/team/team-http";
import * as schemas from "@/server/modules/admin/team/team.schemas";
import * as team from "@/server/modules/admin/team/team.service";

export const runtime = "nodejs";

export const DELETE = withApiHandler(async (request: NextRequest, context) => {
  const actor = await requireTeamActor(request, ADMIN_PERMISSIONS.adminsManage);
  const params = parseWithSchema(schemas.AdminOverrideParamsSchema, {
    adminId: segmentAfterLast(request, "admins"),
    overrideId: segmentAfterLast(request, "overrides"),
  });
  await team.removeTeamAdminOverride(actor, params.adminId, params.overrideId);
  return apiSuccess({ deleted: true }, context.requestId);
});
