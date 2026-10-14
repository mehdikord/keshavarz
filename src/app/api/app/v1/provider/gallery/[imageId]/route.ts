import type { NextRequest } from "next/server";

import { requireUserSession } from "@/server/auth";
import { getSecurityEnvironment } from "@/server/config/env";
import { apiSuccess, parseWithSchema, withApiHandler } from "@/server/http";
import { ProviderGalleryImageParamsSchema } from "@/server/modules/provider/provider.schemas";
import { deleteCurrentProviderGalleryImage } from "@/server/modules/provider/provider.service";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

function imageIdFromPath(request: NextRequest): string | undefined {
  return request.nextUrl.pathname.split("/").at(-1);
}

export const DELETE = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "app",
    new Set([getSecurityEnvironment().APP_ORIGIN]),
  );
  const auth = await requireUserSession(request);
  const params = parseWithSchema(ProviderGalleryImageParamsSchema, {
    imageId: imageIdFromPath(request),
  });
  const result = await deleteCurrentProviderGalleryImage(
    auth.internalUserId,
    params.imageId,
  );
  return apiSuccess(result, context.requestId);
});
