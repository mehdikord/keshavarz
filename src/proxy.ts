import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Must match `SESSION_COOKIES.admins` in `server/contracts/constants.ts`. */
const ADMIN_SESSION_COOKIE = "__Secure-keshavarz_admin_session";
const LOGIN_PATH = "/admins/login";

/**
 * Admin console gate. Without a session cookie, go straight to the login page
 * and remember where the admin was heading. With one, pass the requested path
 * on as a header so the panel layout can do the same when the cookie turns
 * out to be stale (the layout does the real session validation).
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === LOGIN_PATH) {
    return NextResponse.next();
  }

  const target = `${pathname}${search}`;

  if (!request.cookies.has(ADMIN_SESSION_COOKIE)) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.search = "";
    if (target !== "/admins") url.searchParams.set("next", target);
    return NextResponse.redirect(url);
  }

  const headers = new Headers(request.headers);
  headers.set("x-admin-path", target);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/admins", "/admins/:path*"],
};
