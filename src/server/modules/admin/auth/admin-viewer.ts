import { cookies } from "next/headers";
import { cache } from "react";

import { resolveAdminSessionToken } from "@/server/auth";
import type { AdminAuthContext } from "@/server/auth";
import { getSessionCookieName } from "@/server/security";
import { getAdminViewer } from "@/server/modules/admin/auth/admin-auth.service";
import type { AdminViewer } from "@/server/modules/admin/auth/admin-auth.service";

export interface AdminPageSession {
  auth: AdminAuthContext;
  viewer: AdminViewer;
}

/**
 * Session check for server components under `/admins`. Reads the HttpOnly
 * session cookie, slides the idle window and loads the viewer's profile and
 * effective permissions. `null` means "send to the login page".
 * Memoised per request, so the layout and the page share one lookup.
 */
export const getAdminPageSession = cache(async (): Promise<AdminPageSession | null> => {
  const cookieStore = await cookies();
  const auth = await resolveAdminSessionToken(
    cookieStore.get(getSessionCookieName("admins"))?.value,
  );
  if (!auth) return null;

  const viewer = await getAdminViewer(auth.internalAdminId);
  return viewer ? { auth, viewer } : null;
});
