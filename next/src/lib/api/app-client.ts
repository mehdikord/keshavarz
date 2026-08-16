import { readAppCsrfToken } from "@/lib/api/csrf";
import {
  ApiClientError,
  createApiClientErrorFromResponse,
  parseApiSuccessEnvelope,
  type ApiSuccessEnvelope,
} from "@/lib/api/envelope";

export const APP_API_BASE = "/api/app/v1";
const CSRF_HEADER = "X-CSRF-Token";

type QueryValue = string | number | boolean | null | undefined;

export interface AppApiRequestOptions {
  body?: unknown;
  headers?: HeadersInit;
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
  /** When true, attach CSRF header for cookie double-submit mutations. */
  csrf?: boolean;
  /** Extra headers (e.g. Idempotency-Key). */
  extraHeaders?: Record<string, string>;
  /** When set, send raw FormData and skip JSON Content-Type. */
  formData?: FormData;
}

type UnauthorizedListener = () => void;

const unauthorizedListeners = new Set<UnauthorizedListener>();

/** Register a listener for app-realm 401 responses (session cleared / redirect). */
export function onAppUnauthorized(listener: UnauthorizedListener): () => void {
  unauthorizedListeners.add(listener);
  return () => {
    unauthorizedListeners.delete(listener);
  };
}

function notifyUnauthorized() {
  for (const listener of unauthorizedListeners) {
    listener();
  }
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${APP_API_BASE}${normalized}`, "http://local.invalid");

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
    const error = createApiClientErrorFromResponse(response, payload);
    if (response.status === 401) {
      notifyUnauthorized();
    }
    throw error;
  }

  return parseApiSuccessEnvelope<T>(payload);
}

async function appRequest<T>(
  method: string,
  path: string,
  options: AppApiRequestOptions = {},
): Promise<ApiSuccessEnvelope<T>> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (options.extraHeaders) {
    for (const [key, value] of Object.entries(options.extraHeaders)) {
      headers.set(key, value);
    }
  }

  if (options.formData === undefined && options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.csrf) {
    const csrfToken = readAppCsrfToken();
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
    body:
      options.formData !== undefined
        ? options.formData
        : options.body === undefined
          ? undefined
          : JSON.stringify(options.body),
    credentials: "include",
    headers,
    method,
    signal: options.signal,
  });

  return parseResponse<T>(response);
}

export const appApi = {
  get: <T>(path: string, options?: Omit<AppApiRequestOptions, "body" | "csrf">) =>
    appRequest<T>("GET", path, options),

  post: <T>(path: string, body?: unknown, options?: AppApiRequestOptions) =>
    appRequest<T>("POST", path, {
      ...options,
      body: body ?? {},
      csrf: options?.csrf ?? true,
    }),

  patch: <T>(path: string, body?: unknown, options?: AppApiRequestOptions) =>
    appRequest<T>("PATCH", path, {
      ...options,
      body: body ?? {},
      csrf: options?.csrf ?? true,
    }),

  put: <T>(path: string, body?: unknown, options?: AppApiRequestOptions) =>
    appRequest<T>("PUT", path, {
      ...options,
      body: body ?? {},
      csrf: options?.csrf ?? true,
    }),

  delete: <T>(path: string, options?: AppApiRequestOptions) =>
    appRequest<T>("DELETE", path, {
      ...options,
      csrf: options?.csrf ?? true,
    }),
};
