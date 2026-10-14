import * as z from "zod";

export const ApiErrorBodySchema = z
  .object({
    code: z.string().min(1),
    fields: z.record(z.string(), z.array(z.string())).optional(),
    message: z.string().min(1),
  })
  .strict();

export const ApiErrorEnvelopeSchema = z
  .object({
    error: ApiErrorBodySchema,
    requestId: z.string().min(1),
  })
  .strict();

export const ApiSuccessEnvelopeSchema = z
  .object({
    data: z.unknown(),
    meta: z.record(z.string(), z.unknown()).optional(),
    requestId: z.string().min(1),
  })
  .strict();

export type ApiErrorBody = z.infer<typeof ApiErrorBodySchema>;
export type ApiErrorEnvelope = z.infer<typeof ApiErrorEnvelopeSchema>;
export type ApiSuccessEnvelope<T = unknown> = {
  data: T;
  meta?: Record<string, unknown>;
  requestId: string;
};

export class ApiClientError extends Error {
  readonly code: string;
  readonly fields?: Record<string, string[]>;
  readonly requestId?: string;
  readonly retryAfterSeconds?: number;
  readonly status: number;

  constructor(input: {
    code: string;
    fields?: Record<string, string[]>;
    message: string;
    requestId?: string;
    retryAfterSeconds?: number;
    status: number;
  }) {
    super(input.message);
    this.name = "ApiClientError";
    this.code = input.code;
    this.fields = input.fields;
    this.requestId = input.requestId;
    this.retryAfterSeconds = input.retryAfterSeconds;
    this.status = input.status;
  }
}

export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}

export function parseApiSuccessEnvelope<T>(
  payload: unknown,
): ApiSuccessEnvelope<T> {
  const parsed = ApiSuccessEnvelopeSchema.parse(payload);
  return {
    data: parsed.data as T,
    meta: parsed.meta,
    requestId: parsed.requestId,
  };
}

function readRetryAfterSeconds(response: Response): number | undefined {
  const header = response.headers.get("Retry-After");
  if (!header) return undefined;
  const seconds = Number.parseInt(header, 10);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined;
}

/** Shared error parsing for admin/app API clients. */
export function createApiClientErrorFromResponse(
  response: Response,
  payload: unknown,
): ApiClientError {
  const retryAfterSeconds = readRetryAfterSeconds(response);

  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    payload.error &&
    typeof payload.error === "object"
  ) {
    const error = payload.error as {
      code?: string;
      fields?: Record<string, string[]>;
      message?: string;
    };
    const requestId =
      "requestId" in payload && typeof payload.requestId === "string"
        ? payload.requestId
        : undefined;

    return new ApiClientError({
      code: error.code ?? "INTERNAL_SERVER_ERROR",
      fields: error.fields,
      message: error.message ?? "خطای ناشناخته از سرور دریافت شد.",
      requestId,
      retryAfterSeconds,
      status: response.status,
    });
  }

  return new ApiClientError({
    code: "INTERNAL_SERVER_ERROR",
    message: "پاسخ خطا از سرور قابل پردازش نبود.",
    retryAfterSeconds,
    status: response.status,
  });
}
