export const API_ROOTS = {
  app: "/api/app/v1",
  admins: "/api/admins/v1",
} as const;

export const SESSION_COOKIES = {
  app: "__Secure-keshavarz_app_session",
  admins: "__Secure-keshavarz_admin_session",
} as const;

export const API_HEADERS = {
  csrfToken: "X-CSRF-Token",
  idempotencyKey: "Idempotency-Key",
  ifMatch: "If-Match",
  requestId: "X-Request-Id",
} as const;

export const PAGINATION_DEFAULT_LIMIT = 20;
export const PAGINATION_MAX_LIMIT = 100;

export const APP_SESSION_POLICY = {
  absoluteLifetimeSeconds: 30 * 24 * 60 * 60,
  idleTimeoutSeconds: 7 * 24 * 60 * 60,
  refreshWindowSeconds: 7 * 24 * 60 * 60,
} as const;

export const ADMIN_SESSION_POLICY = {
  absoluteLifetimeSeconds: 12 * 60 * 60,
  idleTimeoutSeconds: 30 * 60,
  refreshWindowSeconds: 15 * 60,
} as const;

export const OTP_POLICY = {
  digits: 6,
  expiresInSeconds: 2 * 60,
  maxAttempts: 5,
  resendCooldownSeconds: 60,
  maxPhoneRequestsPerThirtyMinutes: 5,
  maxIpRequestsPerHour: 20,
  maxDeviceRequestsPerHour: 10,
} as const;

export const ADMIN_PASSWORD_POLICY = {
  minLength: 12,
  maxLength: 128,
  lockoutThreshold: 5,
  attemptWindowSeconds: 15 * 60,
  initialLockoutSeconds: 15 * 60,
  maximumLockoutSeconds: 24 * 60 * 60,
  argon2id: {
    memoryKiB: 64 * 1024,
    iterations: 3,
    parallelism: 1,
  },
} as const;
