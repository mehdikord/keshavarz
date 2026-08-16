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
  AdminProviderServiceParamsSchema,
  AdminProviderServiceUpdateSchema,
} from "@/server/modules/admin-providers/admin-providers.schemas";
import { updateProviderServiceForAdmin } from "@/server/modules/admin-providers/admin-providers.service";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

export const PATCH = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "admins",
    new Set([getSecurityEnvironment().ADMIN_ORIGIN]),
  );
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "providers.update", request);

  const params = parseWithSchema(AdminProviderServiceParamsSchema, {
    providerServiceId: request.nextUrl.pathname.split("/").at(-1),
  });
  const input = await parseJsonBody(request, AdminProviderServiceUpdateSchema);
  const result = await updateProviderServiceForAdmin({
    adminId: auth.internalAdminId,
    description: input.description,
    isActive: input.isActive,
    priceToman: input.priceToman,
    pricingUnit: input.pricingUnit,
    providerServiceId: params.providerServiceId,
  });

  await writeAdminAuditLog({
    action: "provider_service_update",
    adminId: auth.internalAdminId,
    auditableId: result.providerServiceId,
    auditableType: "ProviderService",
    httpMethod: request.method,
    module: "providers",
    newValues: result.newValues,
    oldValues: result.oldValues,
    request,
  });

  return apiSuccess(result.newValues, context.requestId);
});
