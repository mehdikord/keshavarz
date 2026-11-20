import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, parseQuery, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { UsersListQuerySchema } from "@/server/modules/admin/users/users.schemas";
import { listAdminUsers } from "@/server/modules/admin/users/users.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  await requireAdminActor(request, ADMIN_PERMISSIONS.usersView);
  const query = parseQuery(request, UsersListQuerySchema);
  const { items, ...meta } = await listAdminUsers(query);
  return apiSuccess(items, context.requestId, { meta });
});
