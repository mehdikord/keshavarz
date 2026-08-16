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
  AdminProviderParamsSchema,
  AdminProviderUpdateSchema,
} from "@/server/modules/admin-providers/admin-providers.schemas";
import {
  getProviderForAdmin,
  updateProviderForAdmin,
} from "@/server/modules/admin-providers/admin-providers.service";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

function providerIdFromPath(request: NextRequest): string | undefined {
  return request.nextUrl.pathname.split("/").at(-1);
}

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "providers.view", request);
  const params = parseWithSchema(AdminProviderParamsSchema, {
    providerId: providerIdFromPath(request),
  });
  const provider = await getProviderForAdmin(params.providerId);
  return apiSuccess(provider, context.requestId);
});

export const PATCH = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "admins",
    new Set([getSecurityEnvironment().ADMIN_ORIGIN]),
  );
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "providers.update", request);
  const params = parseWithSchema(AdminProviderParamsSchema, {
    providerId: providerIdFromPath(request),
  });
  const input = await parseJsonBody(request, AdminProviderUpdateSchema);
  const result = await updateProviderForAdmin(params.providerId, input);

  await writeAdminAuditLog({
    action: "provider_update",
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
