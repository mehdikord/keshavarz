import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, parseJsonBody, parseWithSchema, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { segmentAfter } from "@/server/modules/admin/admin-route-params";
import { UserParamsSchema, UserSessionsRevokeSchema } from "@/server/modules/admin/users/users.schemas";
import { revokeAdminUserSessions } from "@/server/modules/admin/users/users.service";

export const runtime = "nodejs";

/** Signs the user out of one session (`sessionId`) or of every session. */
export const POST = withApiHandler(async (request: NextRequest, context) => {
  const { auth } = await requireAdminActor(request, ADMIN_PERMISSIONS.usersChangeStatus);
  const { userId } = parseWithSchema(UserParamsSchema, { userId: segmentAfter(request, "users") });
  const input = await parseJsonBody(request, UserSessionsRevokeSchema);
  const result = await revokeAdminUserSessions(
    { adminId: auth.internalAdminId, request },
    userId,
    input.sessionId,
  );
  return apiSuccess(result, context.requestId);
});
