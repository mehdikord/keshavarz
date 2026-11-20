import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, parseQuery, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { ProviderLookupQuerySchema } from "@/server/modules/admin/billing/billing.schemas";
import { lookupProviders } from "@/server/modules/admin/billing/billing.service";

export const runtime = "nodejs";

/** Provider picker for the grant dialog. */
export const GET = withApiHandler(async (request: NextRequest, context) => {
  await requireAdminActor(request, ADMIN_PERMISSIONS.subscriptionsGrant);
  const { q } = parseQuery(request, ProviderLookupQuerySchema);
  return apiSuccess(await lookupProviders(q), context.requestId);
});
