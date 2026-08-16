import type { PermissionContext } from "@/server/security";

interface CacheEntry {
  context: PermissionContext;
  expiresAt: number;
}

const CACHE_TTL_MS = 30_000;
const cache = new Map<string, CacheEntry>();

function cacheKey(adminId: bigint): string {
  return adminId.toString();
}

export function getCachedAdminPermissions(
  adminId: bigint,
): PermissionContext | null {
  const entry = cache.get(cacheKey(adminId));
  if (!entry) {
    return null;
  }
  if (entry.expiresAt <= Date.now()) {
    cache.delete(cacheKey(adminId));
    return null;
  }
  return entry.context;
}

export function setCachedAdminPermissions(
  adminId: bigint,
  context: PermissionContext,
): void {
  cache.set(cacheKey(adminId), {
    context,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

export function invalidateAdminPermissionCache(adminId?: bigint): void {
  if (adminId === undefined) {
    cache.clear();
    return;
  }
  cache.delete(cacheKey(adminId));
}
