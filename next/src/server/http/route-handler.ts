import type { NextRequest } from "next/server";

import { API_HEADERS } from "@/server/contracts";
import type { RequestId } from "@/server/contracts";
import {
  API_ERROR_CODES,
  ApiError,
  mapPrismaError,
} from "@/server/errors";
import {
  createLogger,
  observeLatencyMs,
  resolveRequestId,
  incrementMetric,
} from "@/server/observability";
import type { Logger } from "@/server/observability";
import {
  apiErrorResponse,
  finalizeApiResponse,
} from "@/server/http/response";

export interface ApiRequestContext {
  logger: Logger;
  requestId: RequestId;
}

export type ApiRouteHandler = (
  request: NextRequest,
  context: ApiRequestContext,
) => Promise<Response>;

function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  return (
    mapPrismaError(error) ??
    new ApiError(
      500,
      API_ERROR_CODES.internalServerError,
      "خطای داخلی رخ داده است.",
      { cause: error },
    )
  );
}

export function withApiHandler(
  handler: ApiRouteHandler,
): (request: NextRequest) => Promise<Response> {
  return async (request) => {
    const startedAt = performance.now();
    const requestId = resolveRequestId(
      request.headers.get(API_HEADERS.requestId),
    );
    const logger = createLogger(requestId, request.nextUrl.pathname);
    const realm = request.nextUrl.pathname.startsWith("/api/admins/")
      ? "admins"
      : "app";

    try {
      const response = await handler(request, { logger, requestId });
      const latencyMs = Math.round(performance.now() - startedAt);
      const statusClass = `${Math.floor(response.status / 100)}xx`;

      observeLatencyMs("http_request", latencyMs, {
        method: request.method,
        realm,
        status_class: statusClass,
      });
      incrementMetric("http_requests_total", {
        method: request.method,
        realm,
        status_class: statusClass,
      });

      logger.info("api.request.completed", {
        latencyMs,
        method: request.method,
        realm,
        status: response.status,
      });

      return finalizeApiResponse(response, requestId);
    } catch (caughtError) {
      const error = normalizeError(caughtError);
      const latencyMs = Math.round(performance.now() - startedAt);
      const statusClass = `${Math.floor(error.status / 100)}xx`;

      observeLatencyMs("http_request", latencyMs, {
        method: request.method,
        realm,
        status_class: statusClass,
      });
      incrementMetric("http_requests_total", {
        method: request.method,
        realm,
        status_class: statusClass,
      });
      incrementMetric("http_errors_total", {
        code: error.code,
        realm,
      });

      if (error.status === 429) {
        incrementMetric("http_rate_limited_total", { realm });
      }

      logger.error("api.request.failed", {
        errorCode: error.code,
        errorName:
          caughtError instanceof Error
            ? caughtError.name
            : "UnknownError",
        latencyMs,
        method: request.method,
        realm,
        status: error.status,
      });

      return apiErrorResponse(error, requestId);
    }
  };
}
