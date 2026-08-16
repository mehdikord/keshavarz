import type { NextResponse } from "next/server";

import {
  clearAuthCookies,
  setCsrfCookie,
  setSessionCookie,
} from "@/server/security";

export function setAppAuthCookies(
  response: NextResponse,
  input: {
    csrfToken: string;
    expiresAt: Date;
    sessionToken: string;
  },
): void {
  setSessionCookie(response, "app", input.sessionToken, input.expiresAt);
  setCsrfCookie(response, "app", input.csrfToken, input.expiresAt);
}

export function clearAppAuthCookies(response: NextResponse): void {
  clearAuthCookies(response, "app");
}
