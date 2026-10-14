import type { NextRequest } from "next/server";

import { requireUserSession } from "@/server/auth";
import { apiSuccess, parseWithSchema, withApiHandler } from "@/server/http";
import { PublicProviderParamsSchema } from "@/server/modules/provider/provider.schemas";
import { getPublicProviderProfile } from "@/server/modules/provider/provider.service";

export const runtime = "nodejs";

function providerIdFromPath(request: NextRequest): string | undefined {
  return request.nextUrl.pathname.split("/").at(-1);
}

export const GET = withApiHandler(async (request: NextRequest, context) => {
  await requireUserSession(request);
  const params = parseWithSchema(PublicProviderParamsSchema, {
    providerId: providerIdFromPath(request),
  });
  const profile = await getPublicProviderProfile(params.providerId);
  return apiSuccess(profile, context.requestId);
});
