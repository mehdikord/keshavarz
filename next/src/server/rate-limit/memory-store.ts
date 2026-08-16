import type {
  RateLimitIncrement,
  RateLimitStore,
} from "@/server/rate-limit/rate-limiter";

interface MemoryEntry {
  count: number;
  resetAt: Date;
}

export class MemoryRateLimitStore implements RateLimitStore {
  private readonly entries = new Map<string, MemoryEntry>();

  async increment(
    key: string,
    windowMilliseconds: number,
  ): Promise<RateLimitIncrement> {
    const now = Date.now();
    const existing = this.entries.get(key);

    if (!existing || existing.resetAt.getTime() <= now) {
      const entry = {
        count: 1,
        resetAt: new Date(now + windowMilliseconds),
      };
      this.entries.set(key, entry);
      return entry;
    }

    existing.count += 1;
    return existing;
  }
}
