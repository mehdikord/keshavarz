import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, parseJsonBody, parseWithSchema, withApiHandler } from "@/server/http";
import { requireTeamActor, segmentAfterLast } from "@/server/modules/admin/team/team-http";
import * as schemas from "@/server/modules/admin/team/team.schemas";
import * as team from "@/server/modules/admin/team/team.service";

export const runtime = "nodejs";

const adminId = (request: NextRequest) =>
  parseWithSchema(schemas.AdminParamsSchema, { adminId: segmentAfterLast(request, "admins") }).adminId;

export const POST = withApiHandler(async (request: NextRequest, context) => {
  const actor = await requireTeamActor(request, ADMIN_PERMISSIONS.adminsManage);
  const id = adminId(request);
  const input = await parseJsonBody(request, schemas.AdminOverrideSchema);
  return apiSuccess(await team.upsertTeamAdminOverride(actor, id, input), context.requestId);
});
