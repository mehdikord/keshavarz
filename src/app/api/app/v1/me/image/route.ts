import type { NextRequest } from "next/server";

import { requireUserSession } from "@/server/auth";
import { getSecurityEnvironment } from "@/server/config/env";
import { API_ERROR_CODES, ApiError } from "@/server/errors";
import { apiSuccess, withApiHandler } from "@/server/http";
import {
  deleteCurrentUserImage,
  uploadCurrentUserImage,
} from "@/server/modules/app-profile/app-profile.service";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

export const PUT = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(request, "app", new Set([getSecurityEnvironment().APP_ORIGIN]));
  const auth = await requireUserSession(request);
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("multipart/form-data")) {
    throw new ApiError(415, API_ERROR_CODES.unsupportedMediaType, "نوع محتوا باید multipart/form-data باشد.");
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 6 * 1024 * 1024) {
    throw new ApiError(413, API_ERROR_CODES.payloadTooLarge, "حجم درخواست بیش از حد مجاز است.");
  }
  const formData = await request.formData();
  const image = formData.get("image");
  if (!(image instanceof File)) {
    throw new ApiError(400, API_ERROR_CODES.validationFailed, "فایل تصویر الزامی است.");
  }
  return apiSuccess(await uploadCurrentUserImage(auth.internalUserId, image), context.requestId);
});

export const DELETE = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(request, "app", new Set([getSecurityEnvironment().APP_ORIGIN]));
  const auth = await requireUserSession(request);
  await deleteCurrentUserImage(auth.internalUserId);
  return apiSuccess({ deleted: true }, context.requestId);
});
