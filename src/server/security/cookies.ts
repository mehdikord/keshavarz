import type { NextResponse } from "next/server";

import { SESSION_COOKIES } from "@/server/contracts";

export type AuthRealm = "admins" | "app";

/** API mount point of each realm. */
const API_COOKIE_PATHS = {
  app: "/api/app/v1",
  admins: "/api/admins/v1",
} as const;

/**
 * App session cookies stay scoped to the API realm. The admin session cookie
 * uses `/` so the server-rendered admin console (`/admins/**`) can validate
 * the session before rendering; it stays HttpOnly + Secure + SameSite=Lax and
 * every admin mutation still requires the double-submit CSRF header.
 */
const SESSION_COOKIE_PATHS = {
  app: API_COOKIE_PATHS.app,
  admins: "/",
} as const;

/**
 * CSRF cookies use path `/` so pages can read the non-HttpOnly value for the
 * double-submit `X-CSRF-Token` header.
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

  // Earlier releases scoped every cookie to the realm's API path. Those have
  // to be expired on that path too. `response.cookies` keeps one entry per
  // name, so they are appended as raw headers (after the last `.set` call).
  const legacyPath = API_COOKIE_PATHS[realm];
  appendExpiredCookie(response, getCsrfCookieName(realm), legacyPath, false);
  if (SESSION_COOKIE_PATHS[realm] !== legacyPath) {
    appendExpiredCookie(response, getSessionCookieName(realm), legacyPath, true);
  }
}

function appendExpiredCookie(
  response: NextResponse,
  name: string,
  path: string,
  httpOnly: boolean,
): void {
  response.headers.append(
    "Set-Cookie",
    [
      `${name}=`,
      `Path=${path}`,
      "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
      "Max-Age=0",
      "Secure",
      "SameSite=Lax",
      ...(httpOnly ? ["HttpOnly"] : []),
    ].join("; "),
  );
}
