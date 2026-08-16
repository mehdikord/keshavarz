/** Cookie names must stay aligned with `server/security/cookies.ts`. */
export const ADMIN_CSRF_COOKIE = "__Secure-keshavarz_admin_csrf";
export const APP_CSRF_COOKIE = "__Secure-keshavarz_app_csrf";

export function readBrowserCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const encodedName = encodeURIComponent(name);
  const parts = document.cookie.split("; ");

  for (const part of parts) {
    const separatorIndex = part.indexOf("=");
    if (separatorIndex < 0) continue;
    const key = part.slice(0, separatorIndex);
    if (key === name || key === encodedName) {
      return decodeURIComponent(part.slice(separatorIndex + 1));
    }
  }

  return null;
}

export function readAdminCsrfToken(): string | null {
  return readBrowserCookie(ADMIN_CSRF_COOKIE);
}

export function readAppCsrfToken(): string | null {
  return readBrowserCookie(APP_CSRF_COOKIE);
}
