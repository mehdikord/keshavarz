import type { NextRequest } from "next/server";

import { requireAdminSession } from "@/server/auth";
import { apiSuccess, parseQuery, withApiHandler } from "@/server/http";
import { requireAdminPermission } from "@/server/modules/admin-rbac/require-admin-permission";
import { AdminSettingsQuerySchema } from "@/server/modules/admin-settings/admin-settings.schemas";
import { listSettingsForAdmin } from "@/server/modules/admin-settings/admin-settings.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "settings.view", request);
  const query = parseQuery(request, AdminSettingsQuerySchema);
  const result = await listSettingsForAdmin({ group: query.group });
  return apiSuccess(result, context.requestId);
});
