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

async function parseResponse<T>(
  response: Response,
): Promise<ApiSuccessEnvelope<T>> {
  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw createApiClientErrorFromResponse(response, payload);
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

  return parseResponse<T>(response);
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
