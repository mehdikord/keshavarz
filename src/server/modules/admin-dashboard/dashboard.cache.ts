interface CacheEntry<T> {
  expiresAt: number;
  value: T;
}

const CACHE_TTL_MS = 45_000;
const cache = new Map<string, CacheEntry<unknown>>();

export function getDashboardCache<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) {
    return null;
  }
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

const MAX_ENTRIES = 200;

function pruneExpired(now: number) {
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(key);
  }
}

export function setDashboardCache<T>(key: string, value: T): void {
  // Keys include the requested range, so most are never read again; prune
  // on write and cap the size so the module-level map can't grow unbounded.
  pruneExpired(Date.now());
  while (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
  cache.set(key, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    value,
  });
}
