import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, parseJsonBody, parseQuery, withApiHandler } from "@/server/http";
import { requireTeamActor } from "@/server/modules/admin/team/team-http";
import * as schemas from "@/server/modules/admin/team/team.schemas";
import * as team from "@/server/modules/admin/team/team.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  await requireTeamActor(request, ADMIN_PERMISSIONS.adminsView);
  const { items, ...meta } = await team.listTeamAdmins(parseQuery(request, schemas.AdminsListQuerySchema));
  return apiSuccess(items, context.requestId, { meta });
});

export const POST = withApiHandler(async (request: NextRequest, context) => {
  const actor = await requireTeamActor(request, ADMIN_PERMISSIONS.adminsManage);
  const input = await parseJsonBody(request, schemas.AdminCreateSchema);
  return apiSuccess(await team.createTeamAdmin(actor, input), context.requestId, { status: 201 });
});
