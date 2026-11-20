"use client";

import { readAdminCsrfToken } from "@/lib/api/csrf";
import {
  ApiClientError,
  createApiClientErrorFromResponse,
  parseApiSuccessEnvelope,
} from "@/lib/api/envelope";
import { safeAdminNext } from "@/lib/admin/next-path";

export const ADMIN_API_BASE = "/api/admins/v1";

function redirectToLogin() {
  const next = `${window.location.pathname}${window.location.search}`;
  // A hard navigation on purpose: the session is gone, so no client state should survive.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign(`/admins/login?expired=1&next=${encodeURIComponent(safeAdminNext(next))}`);
}

type Method = "GET" | "POST" | "PATCH" | "DELETE";

export async function adminRequest<T>(
  method: Method,
  path: string,
  options: { body?: unknown; query?: Record<string, string | number | undefined>; signal?: AbortSignal } = {},
): Promise<T> {
  const url = new URL(`${ADMIN_API_BASE}${path}`, window.location.origin);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }

  const isForm = options.body instanceof FormData;
  const headers = new Headers({ Accept: "application/json" });
  // FormData sets its own multipart boundary.
  if (options.body !== undefined && !isForm) headers.set("Content-Type", "application/json");
  if (method !== "GET") {
    const csrf = readAdminCsrfToken();
    if (csrf) headers.set("X-CSRF-Token", csrf);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      body: options.body === undefined ? undefined : isForm ? (options.body as FormData) : JSON.stringify(options.body),
      credentials: "same-origin",
      headers,
      method,
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiClientError({
      code: "NETWORK_ERROR",
      message: "اتصال به سرور برقرار نشد. اتصال اینترنت را بررسی کنید.",
      status: 0,
    });
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const error = createApiClientErrorFromResponse(response, payload);
    const isLogin = path.startsWith("/auth/login");
    if (response.status === 401 && !isLogin) redirectToLogin();
    throw error;
  }

  return parseApiSuccessEnvelope<T>(payload).data;
}

export const adminApi = {
  delete: <T>(path: string, body?: unknown) => adminRequest<T>("DELETE", path, { body }),
  get: <T>(path: string, query?: Record<string, string | number | undefined>, signal?: AbortSignal) =>
    adminRequest<T>("GET", path, { query, signal }),
  patch: <T>(path: string, body: unknown) => adminRequest<T>("PATCH", path, { body }),
  post: <T>(path: string, body: unknown = {}) => adminRequest<T>("POST", path, { body }),
  /** Multipart upload of a single file under `field`. */
  upload: <T>(path: string, file: File, field = "image") => {
    const form = new FormData();
    form.append(field, file);
    return adminRequest<T>("POST", path, { body: form });
  },
};

export function errorMessage(error: unknown, fallback = "انجام این کار ممکن نشد. دوباره تلاش کنید."): string {
  if (error instanceof ApiClientError) {
    if (error.status === 429) {
      return error.retryAfterSeconds
        ? `تعداد درخواست‌ها زیاد است. ${new Intl.NumberFormat("fa-IR").format(Math.ceil(error.retryAfterSeconds / 60))} دقیقه دیگر دوباره تلاش کنید.`
        : "تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید.";
    }
    return error.message || fallback;
  }
  return fallback;
}

export function fieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiClientError) || !error.fields) return {};
  return Object.fromEntries(
    Object.entries(error.fields).map(([field, messages]) => [field, messages[0] ?? ""]),
  );
}
