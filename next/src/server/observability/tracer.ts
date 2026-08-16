import { createLogger } from "@/server/observability/logger";
import { observeLatencyMs } from "@/server/observability/metrics";
import { createRequestId } from "@/server/observability/request-id";

export interface TraceSpan {
  attributes: Record<string, string | number | boolean | null | undefined>;
  durationMs: number;
  name: string;
  requestId: string;
  startedAt: string;
  status: "error" | "ok";
  errorCode?: string;
}

export interface Span {
  error(
    error: unknown,
    attributes?: Record<string, string | number | boolean | null | undefined>,
  ): void;
  finish(
    attributes?: Record<string, string | number | boolean | null | undefined>,
  ): void;
}

const RECENT_TRACE_LIMIT = 200;
const recentTraces: TraceSpan[] = [];

function recordTrace(span: TraceSpan): void {
  recentTraces.push(span);
  if (recentTraces.length > RECENT_TRACE_LIMIT) {
    recentTraces.splice(0, recentTraces.length - RECENT_TRACE_LIMIT);
  }
}

/**
 * Span سبک برای تراکنش‌های حیاتی (search/request/payment).
 * خروجی آن: لاگ ساختاریافته + متریک latency + بافر recent برای دید عملیاتی.
 */
export function startSpan(input: {
  attributes?: Record<string, string | number | boolean | null | undefined>;
  name: string;
}): Span {
  const requestId = createRequestId();
  const startedAt = Date.now();
  const logger = createLogger(requestId, `trace.${input.name}`);
  const baseAttributes = input.attributes ?? {};

  const complete = (status: "error" | "ok", errorCode: string | undefined) => {
    const durationMs = Date.now() - startedAt;
    const attributes = { ...baseAttributes, durationMs };

    recordTrace({
      attributes,
      durationMs,
      name: input.name,
      requestId,
      startedAt: new Date(startedAt).toISOString(),
      status,
      errorCode,
    });

    observeLatencyMs(`trace_${input.name}`, durationMs, { status });

    if (status === "ok") {
      logger.info("span.complete", attributes);
    } else {
      logger.error("span.failed", { errorCode, ...attributes });
    }
  };

  return {
    error: (error, extra) => {
      const errorCode =
        error instanceof Error
          ? error.name || "Error"
          : typeof error === "object" &&
              error !== null &&
              "code" in error &&
              typeof error.code === "string"
            ? error.code
            : "Error";
      complete("error", errorCode);
      if (extra) {
        logger.error("span.error.extra", extra);
      }
    },
    finish: (extra) => {
      complete("ok", undefined);
      if (extra) {
        logger.info("span.attributes", extra);
      }
    },
  };
}

export function getRecentTraces(): TraceSpan[] {
  return [...recentTraces];
}

export function resetTracesForTests(): void {
  recentTraces.length = 0;
}
