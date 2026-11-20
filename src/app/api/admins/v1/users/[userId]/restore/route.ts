import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, parseWithSchema, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { segmentAfter } from "@/server/modules/admin/admin-route-params";
import { UserParamsSchema } from "@/server/modules/admin/users/users.schemas";
import { restoreAdminUser } from "@/server/modules/admin/users/users.service";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request: NextRequest, context) => {
  const { auth } = await requireAdminActor(request, ADMIN_PERMISSIONS.usersChangeStatus);
  const { userId } = parseWithSchema(UserParamsSchema, { userId: segmentAfter(request, "users") });
  await restoreAdminUser({ adminId: auth.internalAdminId, request }, userId);
  return apiSuccess({ restored: true }, context.requestId);
});
