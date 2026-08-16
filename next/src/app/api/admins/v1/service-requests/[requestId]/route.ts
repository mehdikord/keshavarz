import type { NextRequest } from "next/server";

import { requireAdminSession } from "@/server/auth";
import { apiSuccess, parseWithSchema, withApiHandler } from "@/server/http";
import { requireAdminPermission } from "@/server/modules/admin-rbac/require-admin-permission";
import { RequestParamsSchema } from "@/server/modules/requests/request.schemas";
import { getAdminManagedServiceRequest } from "@/server/modules/requests/request.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "requests.view", request);

  const params = parseWithSchema(RequestParamsSchema, {
    requestId: request.nextUrl.pathname.split("/").at(-1),
  });
  const result = await getAdminManagedServiceRequest(params.requestId);
  return apiSuccess(result, context.requestId);
});
