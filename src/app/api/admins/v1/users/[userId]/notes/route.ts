import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, parseJsonBody, parseWithSchema, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { segmentAfter } from "@/server/modules/admin/admin-route-params";
import { UserNoteCreateSchema, UserParamsSchema } from "@/server/modules/admin/users/users.schemas";
import { addAdminUserNote } from "@/server/modules/admin/users/users.service";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request: NextRequest, context) => {
  const { auth } = await requireAdminActor(request, ADMIN_PERMISSIONS.usersUpdate);
  const { userId } = parseWithSchema(UserParamsSchema, { userId: segmentAfter(request, "users") });
  const input = await parseJsonBody(request, UserNoteCreateSchema);
  const note = await addAdminUserNote({ adminId: auth.internalAdminId, request }, userId, input);
  return apiSuccess(note, context.requestId, { status: 201 });
});
