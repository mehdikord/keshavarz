import { readFile } from "node:fs/promises";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { requireAdminSession } from "@/server/auth";
import {
  apiSuccess,
  parseWithSchema,
  withApiHandler,
} from "@/server/http";
import { requireAdminPermission } from "@/server/modules/admin-rbac/require-admin-permission";
import { ExportParamsSchema } from "@/server/modules/exports/exports.schemas";
import { verifyExportDownloadToken } from "@/server/modules/exports/exports.signing";
import {
  getAdminExport,
  getExportFilePathForDownload,
} from "@/server/modules/exports/exports.service";
import { getExportJob } from "@/server/modules/exports/exports.store";
import { API_ERROR_CODES, ApiError } from "@/server/errors";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireAdminSession(request);
  const params = parseWithSchema(ExportParamsSchema, {
    exportId: request.nextUrl.pathname.split("/").at(-1),
  });

  const job = getExportJob(params.exportId);
  if (!job) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "خروجی یافت نشد.");
  }

  const permission =
    job.domain === "payments" ? "payments.export" : "reports.export";
  await requireAdminPermission(auth, permission, request);

  const downloadToken = request.nextUrl.searchParams.get("downloadToken");
  if (downloadToken) {
    const valid = verifyExportDownloadToken({
      adminId: auth.adminId,
      exportId: params.exportId,
      token: downloadToken,
    });
    if (!valid) {
      throw new ApiError(
        403,
        API_ERROR_CODES.forbidden,
        "توکن دانلود نامعتبر یا منقضی است.",
      );
    }

    const file = getExportFilePathForDownload({
      adminPublicId: auth.adminId,
      exportId: params.exportId,
    });
    const content = await readFile(file.filePath);
    return new NextResponse(content, {
      headers: {
        "Content-Disposition": `attachment; filename="${file.fileName}"`,
        "Content-Type": "text/csv; charset=utf-8",
        "X-Request-Id": context.requestId,
      },
      status: 200,
    });
  }

  const result = await getAdminExport({
    adminPublicId: auth.adminId,
    exportId: params.exportId,
  });
  return apiSuccess(result, context.requestId);
});
