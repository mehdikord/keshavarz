import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, parseJsonBody, parseWithSchema, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { segmentAfter } from "@/server/modules/admin/admin-route-params";
import { SettingsSectionParamsSchema, SettingsSectionSaveSchema } from "@/server/modules/admin/settings/settings-admin.schemas";
import { saveSettingsSection } from "@/server/modules/admin/settings/settings-admin.service";
import type { SettingSectionId } from "@/server/modules/system/settings-registry";

export const runtime = "nodejs";

export const PATCH = withApiHandler(async (request: NextRequest, context) => {
  const { auth } = await requireAdminActor(request, ADMIN_PERMISSIONS.settingsManage);
  const { section } = parseWithSchema(SettingsSectionParamsSchema, { section: segmentAfter(request, "sections") });
  const { values } = await parseJsonBody(request, SettingsSectionSaveSchema);
  const result = await saveSettingsSection({ adminId: auth.internalAdminId, request }, section as SettingSectionId, values);
  return apiSuccess(result, context.requestId);
});
