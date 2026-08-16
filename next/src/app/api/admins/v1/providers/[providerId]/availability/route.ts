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
  AdminProviderAvailabilitySchema,
  AdminProviderParamsSchema,
} from "@/server/modules/admin-providers/admin-providers.schemas";
import { updateProviderAvailabilityForAdmin } from "@/server/modules/admin-providers/admin-providers.service";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "admins",
    new Set([getSecurityEnvironment().ADMIN_ORIGIN]),
  );
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "providers.change_status", request);

  const params = parseWithSchema(AdminProviderParamsSchema, {
    providerId: request.nextUrl.pathname.split("/").at(-2),
  });
  const input = await parseJsonBody(request, AdminProviderAvailabilitySchema);
  const result = await updateProviderAvailabilityForAdmin({
    isActive: input.isActive,
    isAvailable: input.isAvailable,
    providerId: params.providerId,
  });

  await writeAdminAuditLog({
    action: "provider_availability",
    adminId: auth.internalAdminId,
    auditableId: result.profileId,
    auditableType: "ProviderProfile",
    httpMethod: request.method,
    module: "providers",
    newValues: result.newValues,
    oldValues: result.oldValues,
    request,
  });

  return apiSuccess(result.newValues, context.requestId);
});
