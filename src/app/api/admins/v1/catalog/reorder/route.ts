import type { NextRequest } from "next/server";

import { requireAdminSession } from "@/server/auth";
import { getSecurityEnvironment } from "@/server/config/env";
import { apiSuccess, parseJsonBody, withApiHandler } from "@/server/http";
import { writeAdminAuditLog } from "@/server/modules/admin-audit/admin-audit.service";
import { AdminCatalogReorderSchema } from "@/server/modules/admin-catalog/admin-catalog.schemas";
import { reorderCatalogForAdmin } from "@/server/modules/admin-catalog/admin-catalog.service";
import { requireAdminPermission } from "@/server/modules/admin-rbac/require-admin-permission";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "admins",
    new Set([getSecurityEnvironment().ADMIN_ORIGIN]),
  );
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "catalog.manage", request);
  const input = await parseJsonBody(request, AdminCatalogReorderSchema);
  const result = await reorderCatalogForAdmin({
    adminId: auth.internalAdminId,
    categories: input.categories,
    services: input.services,
  });

  await writeAdminAuditLog({
    action: "catalog_reorder",
    adminId: auth.internalAdminId,
    httpMethod: request.method,
    metadata: result,
    module: "catalog",
    newValues: input,
    request,
  });

  return apiSuccess(result, context.requestId);
});
