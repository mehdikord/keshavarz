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
import {
  AdminCategoryParamsSchema,
  AdminCategoryUpdateSchema,
} from "@/server/modules/admin-catalog/admin-catalog.schemas";
import {
  deleteCategoryForAdmin,
  updateCategoryForAdmin,
} from "@/server/modules/admin-catalog/admin-catalog.service";
import { requireAdminPermission } from "@/server/modules/admin-rbac/require-admin-permission";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

function categoryIdFromPath(request: NextRequest): string | undefined {
  return request.nextUrl.pathname.split("/").at(-1);
}

export const PATCH = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "admins",
    new Set([getSecurityEnvironment().ADMIN_ORIGIN]),
  );
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "catalog.manage", request);
  const params = parseWithSchema(AdminCategoryParamsSchema, {
    categoryId: categoryIdFromPath(request),
  });
  const input = await parseJsonBody(request, AdminCategoryUpdateSchema);
  const result = await updateCategoryForAdmin(
    params.categoryId,
    auth.internalAdminId,
    input,
  );

  await writeAdminAuditLog({
    action: "catalog_category_update",
    adminId: auth.internalAdminId,
    auditableId: result.categoryId,
    auditableType: "ServiceCategory",
    httpMethod: request.method,
    module: "catalog",
    newValues: result.newValues,
    oldValues: result.oldValues,
    request,
  });

  return apiSuccess(result.newValues, context.requestId);
});

export const DELETE = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "admins",
    new Set([getSecurityEnvironment().ADMIN_ORIGIN]),
  );
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "catalog.manage", request);
  const params = parseWithSchema(AdminCategoryParamsSchema, {
    categoryId: categoryIdFromPath(request),
  });
  const result = await deleteCategoryForAdmin(
    params.categoryId,
    auth.internalAdminId,
  );

  await writeAdminAuditLog({
    action: "catalog_category_delete",
    adminId: auth.internalAdminId,
    auditableId: result.categoryId,
    auditableType: "ServiceCategory",
    httpMethod: request.method,
    module: "catalog",
    newValues: result.newValues,
    oldValues: result.oldValues,
    request,
  });

  return apiSuccess({ deleted: true }, context.requestId);
});
