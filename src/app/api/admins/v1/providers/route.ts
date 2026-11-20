import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, parseQuery, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { ProvidersListQuerySchema } from "@/server/modules/admin/providers/providers-admin.schemas";
import { listAdminProviders } from "@/server/modules/admin/providers/providers-admin.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  await requireAdminActor(request, ADMIN_PERMISSIONS.providersView);
  const { items, ...meta } = await listAdminProviders(parseQuery(request, ProvidersListQuerySchema));
  return apiSuccess(items, context.requestId, { meta });
});
