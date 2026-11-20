import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, parseJsonBody, parseWithSchema, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { segmentAfter } from "@/server/modules/admin/admin-route-params";
import { UserNoteParamsSchema, UserNoteUpdateSchema } from "@/server/modules/admin/users/users.schemas";
import {
  deleteAdminUserNote,
  setAdminUserNotePinned,
} from "@/server/modules/admin/users/users.service";

export const runtime = "nodejs";

function params(request: NextRequest) {
  return parseWithSchema(UserNoteParamsSchema, {
    noteId: segmentAfter(request, "notes"),
    userId: segmentAfter(request, "users"),
  });
}

export const PATCH = withApiHandler(async (request: NextRequest, context) => {
  const { auth } = await requireAdminActor(request, ADMIN_PERMISSIONS.usersUpdate);
  const { noteId, userId } = params(request);
  const input = await parseJsonBody(request, UserNoteUpdateSchema);
  await setAdminUserNotePinned({ adminId: auth.internalAdminId, request }, userId, noteId, input.isPinned);
  return apiSuccess({ updated: true }, context.requestId);
});

export const DELETE = withApiHandler(async (request: NextRequest, context) => {
  const { auth } = await requireAdminActor(request, ADMIN_PERMISSIONS.usersUpdate);
  const { noteId, userId } = params(request);
  await deleteAdminUserNote({ adminId: auth.internalAdminId, request }, userId, noteId);
  return apiSuccess({ deleted: true }, context.requestId);
});
