export type AdminListLimit = 20 | 50 | 100;

export const ADMIN_LIST_LIMITS: AdminListLimit[] = [20, 50, 100];
export const ADMIN_DEFAULT_LIMIT: AdminListLimit = 20;

export interface AdminCursorMeta {
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
}

export interface AdminFilterChip {
  id: string;
  label: string;
  /** Query key removed when chip is cleared; omit for read-only chips. */
  keys?: string[];
}

/** Read a single search param (supports Next async searchParams values). */
export function readSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function parseAdminLimit(
  value: string | string[] | undefined,
  fallback: AdminListLimit = ADMIN_DEFAULT_LIMIT,
): AdminListLimit {
  const raw = Number(readSearchParam(value));
  if (raw === 20 || raw === 50 || raw === 100) return raw;
  return fallback;
}

/** Merge updates into URLSearchParams; empty/null values delete the key. */
export function applySearchParamUpdates(
  current: URLSearchParams,
  updates: Record<string, string | null | undefined>,
): URLSearchParams {
  const next = new URLSearchParams(current.toString());
  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined || value === "") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
  }
  return next;
}

/** Reset cursor when filters or limit change. */
export function resetCursorParams(
  current: URLSearchParams,
  updates: Record<string, string | null | undefined>,
): URLSearchParams {
  return applySearchParamUpdates(current, { ...updates, cursor: null });
}

export function buildQueryString(params: URLSearchParams): string {
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
