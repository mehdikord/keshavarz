import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { API_ERROR_CODES, ApiError } from "@/server/errors";
import { apiSuccess, parseJsonBody, parseWithSchema, withApiHandler } from "@/server/http";
import { requireTeamActor, segmentAfterLast } from "@/server/modules/admin/team/team-http";
import * as schemas from "@/server/modules/admin/team/team.schemas";
import * as team from "@/server/modules/admin/team/team.service";

export const runtime = "nodejs";

const adminId = (request: NextRequest) =>
  parseWithSchema(schemas.AdminParamsSchema, { adminId: segmentAfterLast(request, "admins") }).adminId;

export const GET = withApiHandler(async (request: NextRequest, context) => {
  await requireTeamActor(request, ADMIN_PERMISSIONS.adminsView);
  const detail = await team.getTeamAdminDetail(adminId(request));
  if (!detail) throw new ApiError(404, API_ERROR_CODES.notFound, "مدیر پیدا نشد.");
  return apiSuccess(detail, context.requestId);
});

export const PATCH = withApiHandler(async (request: NextRequest, context) => {
  const actor = await requireTeamActor(request, ADMIN_PERMISSIONS.adminsManage);
  const id = adminId(request);
  await team.updateTeamAdmin(actor, id, await parseJsonBody(request, schemas.AdminUpdateSchema));
  return apiSuccess({ updated: true }, context.requestId);
});
