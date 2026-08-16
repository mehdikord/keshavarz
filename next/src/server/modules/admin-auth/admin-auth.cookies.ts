import type { NextResponse } from "next/server";

import {
  clearAuthCookies,
  setCsrfCookie,
  setSessionCookie,
} from "@/server/security";

export function setAdminAuthCookies(
  response: NextResponse,
  input: {
    csrfToken: string;
    expiresAt: Date;
    sessionToken: string;
  },
): void {
  setSessionCookie(response, "admins", input.sessionToken, input.expiresAt);
  setCsrfCookie(response, "admins", input.csrfToken, input.expiresAt);
}

export function clearAdminAuthCookies(response: NextResponse): void {
  clearAuthCookies(response, "admins");
}
