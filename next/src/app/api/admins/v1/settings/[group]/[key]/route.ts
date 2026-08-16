import type { NextRequest } from "next/server";

import { requireAdminSession } from "@/server/auth";
import { getSecurityEnvironment } from "@/server/config/env";
import {
  apiSuccess,
  parseJsonBody,
  parseWithSchema,
  withApiHandler,
} from "@/server/http";
import { writeAdminAuditLog } from "@/server/modules/admin-audit/admin-audit.service";
import { requireAdminPermission } from "@/server/modules/admin-rbac/require-admin-permission";
import {
  AdminSettingParamsSchema,
  AdminSettingUpsertSchema,
} from "@/server/modules/admin-settings/admin-settings.schemas";
import { upsertSettingForAdmin } from "@/server/modules/admin-settings/admin-settings.service";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

function settingParamsFromPath(request: NextRequest): {
  group: string | undefined;
  key: string | undefined;
} {
  const parts = request.nextUrl.pathname.split("/");
  return {
    group: parts.at(-2),
    key: parts.at(-1),
  };
}

export const PUT = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "admins",
    new Set([getSecurityEnvironment().ADMIN_ORIGIN]),
  );
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "settings.manage", request);
  const params = parseWithSchema(
    AdminSettingParamsSchema,
    settingParamsFromPath(request),
  );
  const input = await parseJsonBody(request, AdminSettingUpsertSchema);
  const result = await upsertSettingForAdmin({
    description: input.description,
    group: params.group,
    isPublic: input.isPublic,
    key: params.key,
    settingValue: input.settingValue,
    updatedByAdminId: auth.internalAdminId,
    valueType: input.valueType,
  });

  await writeAdminAuditLog({
    action: "setting_upsert",
    adminId: auth.internalAdminId,
    auditableId: result.settingId,
    auditableType: "SystemSetting",
    httpMethod: request.method,
    module: "settings",
    newValues: result.newValues,
    oldValues: result.oldValues,
    request,
  });

  return apiSuccess(result.newValues, context.requestId);
});
