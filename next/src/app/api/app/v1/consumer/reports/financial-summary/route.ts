import type { NextRequest } from "next/server";

import { requireUserSession } from "@/server/auth";
import { apiSuccess, parseQuery, withApiHandler } from "@/server/http";
import {
  ConsumerFinancialSummaryQuerySchema,
} from "@/server/modules/reports/reports.schemas";
import {
  getConsumerFinancialSummary,
} from "@/server/modules/reports/reports.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireUserSession(request);
  const query = parseQuery(request, ConsumerFinancialSummaryQuerySchema);
  const data = await getConsumerFinancialSummary(auth.internalUserId, query);
  return apiSuccess(data, context.requestId);
});
