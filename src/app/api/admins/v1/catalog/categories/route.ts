import type { NextRequest } from "next/server";

import { requireAdminSession } from "@/server/auth";
import { getSecurityEnvironment } from "@/server/config/env";
import {
  apiSuccess,
  parseJsonBody,
  parseQuery,
  withApiHandler,
} from "@/server/http";
import { writeAdminAuditLog } from "@/server/modules/admin-audit/admin-audit.service";
import {
  AdminCatalogCategoriesQuerySchema,
  AdminCategoryCreateSchema,
} from "@/server/modules/admin-catalog/admin-catalog.schemas";
import {
  createCategoryForAdmin,
  listCategoriesForAdmin,
} from "@/server/modules/admin-catalog/admin-catalog.service";
import { requireAdminPermission } from "@/server/modules/admin-rbac/require-admin-permission";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "catalog.view", request);
  const query = parseQuery(request, AdminCatalogCategoriesQuerySchema);
  const categories = await listCategoriesForAdmin({
    isActive: query.isActive,
  });
  return apiSuccess({ categories }, context.requestId);
});

export const POST = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "admins",
    new Set([getSecurityEnvironment().ADMIN_ORIGIN]),
  );
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "catalog.manage", request);
  const input = await parseJsonBody(request, AdminCategoryCreateSchema);
  const result = await createCategoryForAdmin({
    adminId: auth.internalAdminId,
    description: input.description,
    icon: input.icon,
    image: input.image,
    isActive: input.isActive,
    name: input.name,
    slug: input.slug,
    sortOrder: input.sortOrder,
  });

  await writeAdminAuditLog({
    action: "catalog_category_create",
    adminId: auth.internalAdminId,
    auditableId: result.categoryId,
    auditableType: "ServiceCategory",
    httpMethod: request.method,
    module: "catalog",
    newValues: result.newValues,
    request,
  });

  return apiSuccess(result.newValues, context.requestId, { status: 201 });
});
