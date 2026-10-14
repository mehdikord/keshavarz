import type { NextResponse } from "next/server";

import { SESSION_COOKIES } from "@/server/contracts";

export type AuthRealm = "admins" | "app";

/** Session cookies stay scoped to the API realm. */
const SESSION_COOKIE_PATHS = {
  app: "/api/app/v1",
  admins: "/api/admins/v1",
} as const;

/**
 * CSRF cookies use path `/` so SPA pages (e.g. `/admins`) can read the
 * non-HttpOnly value for the double-submit `X-CSRF-Token` header.
 * Session tokens remain HttpOnly on the API path only.
 */
const CSRF_COOKIE_PATH = "/";

const CSRF_COOKIES = {
  app: "__Secure-keshavarz_app_csrf",
  admins: "__Secure-keshavarz_admin_csrf",
} as const;

export function getSessionCookieName(realm: AuthRealm): string {
  return SESSION_COOKIES[realm];
}

export function getCsrfCookieName(realm: AuthRealm): string {
  return CSRF_COOKIES[realm];
}

export function setSessionCookie(
  response: NextResponse,
  realm: AuthRealm,
  token: string,
  expires: Date,
): void {
  response.cookies.set(getSessionCookieName(realm), token, {
    expires,
    httpOnly: true,
    path: SESSION_COOKIE_PATHS[realm],
    sameSite: "lax",
    secure: true,
  });
}

export function setCsrfCookie(
  response: NextResponse,
  realm: AuthRealm,
  token: string,
  expires: Date,
): void {
  response.cookies.set(getCsrfCookieName(realm), token, {
    expires,
    httpOnly: false,
    path: CSRF_COOKIE_PATH,
    sameSite: "lax",
    secure: true,
  });
}

export function clearAuthCookies(
  response: NextResponse,
  realm: AuthRealm,
): void {
  const expired = new Date(0);

  setSessionCookie(response, realm, "", expired);
  setCsrfCookie(response, realm, "", expired);

  // Clear legacy CSRF cookies that were previously scoped to the API path.
  response.cookies.set(getCsrfCookieName(realm), "", {
    expires: expired,
    httpOnly: false,
    path: SESSION_COOKIE_PATHS[realm],
    sameSite: "lax",
    secure: true,
  });
}
