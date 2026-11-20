import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, parseJsonBody, parseQuery, withApiHandler } from "@/server/http";
import { requireTeamActor } from "@/server/modules/admin/team/team-http";
import * as schemas from "@/server/modules/admin/team/team.schemas";
import * as team from "@/server/modules/admin/team/team.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  await requireTeamActor(request, ADMIN_PERMISSIONS.rolesView);
  const { items, ...meta } = await team.listTeamRoles(parseQuery(request, schemas.RolesListQuerySchema));
  return apiSuccess(items, context.requestId, { meta });
});

export const POST = withApiHandler(async (request: NextRequest, context) => {
  const actor = await requireTeamActor(request, ADMIN_PERMISSIONS.rolesManage);
  const input = await parseJsonBody(request, schemas.RoleCreateSchema);
  return apiSuccess(await team.createTeamRole(actor, input), context.requestId, { status: 201 });
});
