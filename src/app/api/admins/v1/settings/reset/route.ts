import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, parseJsonBody, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { SettingResetSchema } from "@/server/modules/admin/settings/settings-admin.schemas";
import { resetSetting } from "@/server/modules/admin/settings/settings-admin.service";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request: NextRequest, context) => {
  const { auth } = await requireAdminActor(request, ADMIN_PERMISSIONS.settingsManage);
  const { id } = await parseJsonBody(request, SettingResetSchema);
  await resetSetting({ adminId: auth.internalAdminId, request }, id);
  return apiSuccess({ reset: true }, context.requestId);
});
