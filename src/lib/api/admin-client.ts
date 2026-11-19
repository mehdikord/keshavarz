import { readAdminCsrfToken } from "@/lib/api/csrf";
import {
  ApiClientError,
  createApiClientErrorFromResponse,
  parseApiSuccessEnvelope,
  type ApiSuccessEnvelope,
} from "@/lib/api/envelope";

export const ADMIN_API_BASE = "/api/admins/v1";
const CSRF_HEADER = "X-CSRF-Token";

type QueryValue = string | number | boolean | null | undefined;

export interface AdminApiRequestOptions {
  body?: unknown;
  headers?: HeadersInit;
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
  /** When true, attach CSRF header for cookie double-submit mutations. */
  csrf?: boolean;
}

function buildUrl(
  path: string,
  query?: Record<string, QueryValue>,
): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${ADMIN_API_BASE}${normalized}`, "http://local.invalid");

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === null || value === undefined || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }

  return `${url.pathname}${url.search}`;
}

const ACTIVITY_STORAGE_KEY = "keshavarz.admin.last-activity";
let lastAdminActivityAt = 0;

function recordAdminActivity() {
  lastAdminActivityAt = Date.now();
  try {
    // Shared across tabs: activity in any tab keeps the one server session alive.
    window.localStorage.setItem(ACTIVITY_STORAGE_KEY, String(lastAdminActivityAt));
  } catch {
    // Storage unavailable (private mode); the in-memory value still works.
  }
}

/**
 * Epoch ms of the last admin API response in any tab. Every authenticated
 * request resets the server-side idle timer, so this mirrors it for the idle
 * warning.
 */
export function getLastAdminActivityAt(): number {
  let shared = 0;
  try {
    shared = Number(window.localStorage.getItem(ACTIVITY_STORAGE_KEY)) || 0;
  } catch {
    shared = 0;
  }
  return Math.max(lastAdminActivityAt, shared);
}

/** Fired on window when any admin API call reports a dead session. */
export const ADMIN_SESSION_EXPIRED_EVENT = "keshavarz:admin-session-expired";

/**
 * 401s from these endpoints are expected outcomes (bad credentials, refresh
 * attempted outside its window) and must not force the console to sign out.
 */
const SESSION_EXPIRY_EXEMPT_PATHS = ["/auth/login", "/auth/session/refresh"];

function notifySessionExpired(path: string, error: ApiClientError) {
  if (typeof window === "undefined") return;
  if (error.status !== 401) return;
  if (error.code !== "AUTH_REQUIRED" && error.code !== "INVALID_SESSION") return;
  if (SESSION_EXPIRY_EXEMPT_PATHS.some((exempt) => path.startsWith(exempt))) {
    return;
  }
  window.dispatchEvent(new CustomEvent(ADMIN_SESSION_EXPIRED_EVENT));
}

async function parseResponse<T>(
  path: string,
  response: Response,
): Promise<ApiSuccessEnvelope<T>> {
  const payload: unknown = await response.json().catch(() => null);

  if (response.status !== 401 && typeof window !== "undefined") {
    recordAdminActivity();
  }

  if (!response.ok) {
    const error = createApiClientErrorFromResponse(response, payload);
    notifySessionExpired(path, error);
    throw error;
  }

  return parseApiSuccessEnvelope<T>(payload);
}

async function adminRequest<T>(
  method: string,
  path: string,
  options: AdminApiRequestOptions = {},
): Promise<ApiSuccessEnvelope<T>> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.csrf) {
    const csrfToken = readAdminCsrfToken();
    if (!csrfToken) {
      throw new ApiClientError({
        code: "CSRF_INVALID",
        message: "توکن امنیتی نشست در دسترس نیست. دوباره وارد شوید.",
        status: 403,
      });
    }
    headers.set(CSRF_HEADER, csrfToken);
  }

  const response = await fetch(buildUrl(path, options.query), {
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    credentials: "include",
    headers,
    method,
    signal: options.signal,
  });

  return parseResponse<T>(
    path.startsWith("/") ? path : `/${path}`,
    response,
  );
}

export const adminApi = {
  get: <T>(path: string, options?: Omit<AdminApiRequestOptions, "body" | "csrf">) =>
    adminRequest<T>("GET", path, options),

  post: <T>(path: string, body?: unknown, options?: AdminApiRequestOptions) =>
    adminRequest<T>("POST", path, {
      ...options,
      body: body ?? {},
      csrf: options?.csrf ?? true,
    }),

  patch: <T>(path: string, body?: unknown, options?: AdminApiRequestOptions) =>
    adminRequest<T>("PATCH", path, {
      ...options,
      body: body ?? {},
      csrf: options?.csrf ?? true,
    }),

  put: <T>(path: string, body?: unknown, options?: AdminApiRequestOptions) =>
    adminRequest<T>("PUT", path, {
      ...options,
      body: body ?? {},
      csrf: options?.csrf ?? true,
    }),

  delete: <T>(path: string, options?: AdminApiRequestOptions) =>
    adminRequest<T>("DELETE", path, {
      ...options,
      csrf: options?.csrf ?? true,
    }),
};
