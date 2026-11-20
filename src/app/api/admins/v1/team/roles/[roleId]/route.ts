import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { API_ERROR_CODES, ApiError } from "@/server/errors";
import { apiSuccess, parseJsonBody, parseWithSchema, withApiHandler } from "@/server/http";
import { requireTeamActor, segmentAfterLast } from "@/server/modules/admin/team/team-http";
import * as schemas from "@/server/modules/admin/team/team.schemas";
import * as team from "@/server/modules/admin/team/team.service";

export const runtime = "nodejs";

const roleId = (request: NextRequest) =>
  parseWithSchema(schemas.RoleParamsSchema, { roleId: segmentAfterLast(request, "roles") }).roleId;

export const GET = withApiHandler(async (request: NextRequest, context) => {
  await requireTeamActor(request, ADMIN_PERMISSIONS.rolesView);
  const detail = await team.getTeamRoleDetail(roleId(request));
  if (!detail) throw new ApiError(404, API_ERROR_CODES.notFound, "نقش پیدا نشد.");
  return apiSuccess(detail, context.requestId);
});

export const PATCH = withApiHandler(async (request: NextRequest, context) => {
  const actor = await requireTeamActor(request, ADMIN_PERMISSIONS.rolesManage);
  const id = roleId(request);
  await team.updateTeamRole(actor, id, await parseJsonBody(request, schemas.RoleUpdateSchema));
  return apiSuccess({ updated: true }, context.requestId);
});

export const DELETE = withApiHandler(async (request: NextRequest, context) => {
  const actor = await requireTeamActor(request, ADMIN_PERMISSIONS.rolesManage);
  const id = roleId(request);
  await team.deleteTeamRole(actor, id, await parseJsonBody(request, schemas.RoleDeleteSchema));
  return apiSuccess({ deleted: true }, context.requestId);
});
