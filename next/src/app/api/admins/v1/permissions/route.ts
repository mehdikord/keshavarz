import type { NextRequest } from "next/server";

import { requireAdminSession } from "@/server/auth";
import { apiSuccess, withApiHandler } from "@/server/http";
import { listManagedPermissions } from "@/server/modules/admin-management/admin-management.service";
import { requireAdminPermission } from "@/server/modules/admin-rbac/require-admin-permission";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "roles.view", request);
  const permissions = await listManagedPermissions();
  return apiSuccess({ permissions }, context.requestId);
});
