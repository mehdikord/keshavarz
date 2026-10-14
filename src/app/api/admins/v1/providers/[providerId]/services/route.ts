import type { NextRequest } from "next/server";

import { requireAdminSession } from "@/server/auth";
import {
  apiSuccess,
  parseQuery,
  parseWithSchema,
  withApiHandler,
} from "@/server/http";
import { requireAdminPermission } from "@/server/modules/admin-rbac/require-admin-permission";
import {
  AdminProviderParamsSchema,
  AdminProviderServicesQuerySchema,
} from "@/server/modules/admin-providers/admin-providers.schemas";
import { listProviderServicesForAdmin } from "@/server/modules/admin-providers/admin-providers.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "providers.view", request);

  const params = parseWithSchema(AdminProviderParamsSchema, {
    providerId: request.nextUrl.pathname.split("/").at(-2),
  });
  const query = parseQuery(request, AdminProviderServicesQuerySchema);
  const result = await listProviderServicesForAdmin({
    cursor: query.cursor,
    limit: query.limit,
    providerId: params.providerId,
  });

  return apiSuccess({ services: result.items }, context.requestId, {
    meta: result.meta,
  });
});
