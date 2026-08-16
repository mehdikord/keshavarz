export const API_ERROR_CODES = {
  accountUnavailable: "ACCOUNT_UNAVAILABLE",
  authRequired: "AUTH_REQUIRED",
  conflict: "CONFLICT",
  csrfInvalid: "CSRF_INVALID",
  forbidden: "FORBIDDEN",
  idempotencyInProgress: "IDEMPOTENCY_IN_PROGRESS",
  idempotencyKeyReused: "IDEMPOTENCY_KEY_REUSED",
  internalServerError: "INTERNAL_SERVER_ERROR",
  invalidJson: "INVALID_JSON",
  invalidOtp: "INVALID_OTP",
  invalidSession: "INVALID_SESSION",
  notFound: "NOT_FOUND",
  originNotAllowed: "ORIGIN_NOT_ALLOWED",
  payloadTooLarge: "PAYLOAD_TOO_LARGE",
  preconditionFailed: "PRECONDITION_FAILED",
  rateLimited: "RATE_LIMITED",
  requestAlreadyAccepted: "REQUEST_ALREADY_ACCEPTED",
  unsupportedMediaType: "UNSUPPORTED_MEDIA_TYPE",
  validationFailed: "VALIDATION_FAILED",
} as const;

export type ApiErrorCode =
  (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

export interface ApiErrorOptions {
  cause?: unknown;
  fields?: Record<string, string[]>;
  headers?: HeadersInit;
}

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly fields?: Record<string, string[]>;
  readonly headers?: HeadersInit;
  readonly status: number;

  constructor(
    status: number,
    code: ApiErrorCode,
    message: string,
    options: ApiErrorOptions = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = options.fields;
    this.headers = options.headers;
  }
}
