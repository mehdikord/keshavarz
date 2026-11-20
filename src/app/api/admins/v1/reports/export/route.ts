import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { systemClock } from "@/server/clock/clock";
import { parseQuery, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { recordAdminAudit } from "@/server/modules/admin/audit/admin-audit.service";
import { buildReportCsv } from "@/server/modules/admin/reports/reports-admin.export";
import { resolvePeriodOrThrow } from "@/server/modules/admin/reports/reports-admin.http";
import { ReportExportQuerySchema } from "@/server/modules/admin/reports/reports-admin.schemas";

export const runtime = "nodejs";

/** CSV download of one report table/series for the requested period. */
export const GET = withApiHandler(async (request: NextRequest) => {
  const { auth } = await requireAdminActor(request, ADMIN_PERMISSIONS.reportsExport);
  const query = parseQuery(request, ReportExportQuerySchema);
  const now = systemClock.now();
  const period = resolvePeriodOrThrow(query, now);
  const { csv, filename, rows } = await buildReportCsv(query.dataset, period, now);

  await recordAdminAudit({
    action: "reports.export",
    adminId: auth.internalAdminId,
    metadata: { dataset: query.dataset, from: period.from, preset: period.preset, rows, to: period.to },
    module: "reports",
    request,
  });

  return new Response(csv, {
    headers: {
      "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Content-Type": "text/csv; charset=utf-8",
    },
    status: 200,
  });
});
