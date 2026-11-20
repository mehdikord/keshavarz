import type { NextRequest } from "next/server";

/**
 * Reads a dynamic segment of an admin API path: the segment that follows
 * `marker`, e.g. `segmentAfter(request, "users")` on
 * `/api/admins/v1/users/01H…/notes` returns `01H…`.
 */
export function segmentAfter(request: NextRequest, marker: string): string | undefined {
  const segments = request.nextUrl.pathname.split("/");
  const index = segments.indexOf(marker);
  return index >= 0 ? segments[index + 1] : undefined;
}
