import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { API_ERROR_CODES, ApiError } from "@/server/errors";
import { apiSuccess, parseJsonBody, parseWithSchema, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { segmentAfter } from "@/server/modules/admin/admin-route-params";
import {
  UserDeleteSchema,
  UserParamsSchema,
  UserUpdateSchema,
} from "@/server/modules/admin/users/users.schemas";
import {
  deleteAdminUser,
  getAdminUserHeader,
  updateAdminUser,
} from "@/server/modules/admin/users/users.service";

export const runtime = "nodejs";

function params(request: NextRequest) {
  return parseWithSchema(UserParamsSchema, { userId: segmentAfter(request, "users") });
}

export const GET = withApiHandler(async (request: NextRequest, context) => {
  await requireAdminActor(request, ADMIN_PERMISSIONS.usersView);
  const result = await getAdminUserHeader(params(request).userId);
  if (!result) throw new ApiError(404, API_ERROR_CODES.notFound, "کاربر پیدا نشد.");
  return apiSuccess(result.header, context.requestId);
});

export const PATCH = withApiHandler(async (request: NextRequest, context) => {
  const { auth } = await requireAdminActor(request, ADMIN_PERMISSIONS.usersUpdate);
  const { userId } = params(request);
  const input = await parseJsonBody(request, UserUpdateSchema);
  await updateAdminUser({ adminId: auth.internalAdminId, request }, userId, input);
  return apiSuccess({ updated: true }, context.requestId);
});

/** Soft delete: the account keeps its history and can be restored. */
export const DELETE = withApiHandler(async (request: NextRequest, context) => {
  const { auth } = await requireAdminActor(request, ADMIN_PERMISSIONS.usersChangeStatus);
  const { userId } = params(request);
  const input = await parseJsonBody(request, UserDeleteSchema);
  await deleteAdminUser({ adminId: auth.internalAdminId, request }, userId, input.reason);
  return apiSuccess({ deleted: true }, context.requestId);
});
