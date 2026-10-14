import type { NextRequest } from "next/server";

import { requireUserSession } from "@/server/auth";
import { getSecurityEnvironment } from "@/server/config/env";
import { API_ERROR_CODES, ApiError } from "@/server/errors";
import { apiSuccess, withApiHandler } from "@/server/http";
import {
  listCurrentProviderGallery,
  uploadCurrentProviderGalleryImage,
} from "@/server/modules/provider/provider.service";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireUserSession(request);
  const gallery = await listCurrentProviderGallery(auth.internalUserId);
  return apiSuccess(gallery, context.requestId);
});

export const POST = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "app",
    new Set([getSecurityEnvironment().APP_ORIGIN]),
  );
  const auth = await requireUserSession(request);
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("multipart/form-data")) {
    throw new ApiError(
      415,
      API_ERROR_CODES.unsupportedMediaType,
      "نوع محتوا باید multipart/form-data باشد.",
    );
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 6 * 1024 * 1024) {
    throw new ApiError(
      413,
      API_ERROR_CODES.payloadTooLarge,
      "حجم درخواست بیش از حد مجاز است.",
    );
  }
  const formData = await request.formData();
  const image = formData.get("image");
  if (!(image instanceof File)) {
    throw new ApiError(
      400,
      API_ERROR_CODES.validationFailed,
      "فایل تصویر الزامی است.",
    );
  }
  const captionRaw = formData.get("caption");
  const caption =
    typeof captionRaw === "string" ? captionRaw.slice(0, 200) : null;

  const uploaded = await uploadCurrentProviderGalleryImage(
    auth.internalUserId,
    image,
    caption,
  );
  return apiSuccess(uploaded, context.requestId);
});
