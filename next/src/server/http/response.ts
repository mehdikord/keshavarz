import { NextResponse } from "next/server";

import { API_HEADERS } from "@/server/contracts";
import type {
  ApiSuccessEnvelope,
  RequestId,
} from "@/server/contracts";
import type { ApiError } from "@/server/errors";

const JSON_CONTENT_TYPE = "application/json; charset=utf-8";

function createHeaders(
  requestId: RequestId,
  headers?: HeadersInit,
): Headers {
  const responseHeaders = new Headers(headers);
  responseHeaders.set(API_HEADERS.requestId, requestId);
  responseHeaders.set("Content-Type", JSON_CONTENT_TYPE);

  if (!responseHeaders.has("Cache-Control")) {
    responseHeaders.set("Cache-Control", "private, no-store");
  }

  return responseHeaders;
}

export function apiSuccess<TData>(
  data: TData,
  requestId: RequestId,
  options: {
    headers?: HeadersInit;
    meta?: Record<string, unknown>;
    status?: number;
  } = {},
): NextResponse<ApiSuccessEnvelope<TData>> {
  const body: ApiSuccessEnvelope<TData> = {
    data,
    requestId,
    ...(options.meta ? { meta: options.meta } : {}),
  };

  return NextResponse.json(body, {
    status: options.status ?? 200,
    headers: createHeaders(requestId, options.headers),
  });
}

export function apiErrorResponse(
  error: ApiError,
  requestId: RequestId,
): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: error.code,
        message: error.message,
        ...(error.fields ? { fields: error.fields } : {}),
      },
      requestId,
    },
    {
      status: error.status,
      headers: createHeaders(requestId, error.headers),
    },
  );
}

export function finalizeApiResponse(
  response: Response,
  requestId: RequestId,
): Response {
  const headers = new Headers(response.headers);
  headers.set(API_HEADERS.requestId, requestId);

  if (!headers.has("Cache-Control")) {
    headers.set("Cache-Control", "private, no-store");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
