import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { getSystemStatus } from "@/server/modules/admin/settings/settings-admin.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  await requireAdminActor(request, ADMIN_PERMISSIONS.settingsView);
  return apiSuccess(await getSystemStatus(), context.requestId);
});
