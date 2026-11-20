import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { systemClock } from "@/server/clock/clock";
import { apiSuccess, parseQuery, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { resolvePeriodOrThrow } from "@/server/modules/admin/reports/reports-admin.http";
import { ReportsQuerySchema } from "@/server/modules/admin/reports/reports-admin.schemas";
import {
  getGrowthReport,
  getMarketplaceReport,
  getProvidersReport,
  getRevenueReport,
} from "@/server/modules/admin/reports/reports-admin.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  await requireAdminActor(request, ADMIN_PERMISSIONS.reportsView);
  const query = parseQuery(request, ReportsQuerySchema);
  const now = systemClock.now();
  const period = resolvePeriodOrThrow(query, now);
  const report =
    query.tab === "marketplace"
      ? await getMarketplaceReport(period)
      : query.tab === "revenue"
        ? await getRevenueReport(period, now)
        : query.tab === "providers"
          ? await getProvidersReport(period)
          : await getGrowthReport(period);
  return apiSuccess(report, context.requestId, { meta: { period, tab: query.tab } });
});
