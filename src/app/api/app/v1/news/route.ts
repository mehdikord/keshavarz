import type { NextRequest } from "next/server";

import { apiSuccess, parseQuery, withApiHandler } from "@/server/http";
import { NewsFeedQuerySchema } from "@/server/modules/news/news.schemas";
import { getNewsFeed } from "@/server/modules/news/news.service";

export const runtime = "nodejs";

/** Public: the news page needs no account. */
export const GET = withApiHandler(async (request: NextRequest, context) => {
  const { items, meta } = await getNewsFeed(parseQuery(request, NewsFeedQuerySchema));
  return apiSuccess({ items }, context.requestId, { headers: { "Cache-Control": "no-store" }, meta });
});
