import type { NextRequest } from "next/server";

import { requireUserSession } from "@/server/auth";
import {
  apiSuccess,
  parseQuery,
  parseWithSchema,
  withApiHandler,
} from "@/server/http";
import {
  SearchParamsSchema,
  SearchProvidersQuerySchema,
} from "@/server/modules/search/search.schemas";
import { listSearchProviders } from "@/server/modules/search/search.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireUserSession(request);
  const params = parseWithSchema(SearchParamsSchema, {
    searchId: request.nextUrl.pathname.split("/").at(-2),
  });
  const query = parseQuery(request, SearchProvidersQuerySchema);
  const result = await listSearchProviders(
    auth.internalUserId,
    params.searchId,
    {
      cursor: query.cursor,
      limit: query.limit,
      sort: query.sort,
    },
  );
  return apiSuccess(
    {
      providers: result.items,
      search: result.search,
    },
    context.requestId,
    { meta: result.meta },
  );
});
