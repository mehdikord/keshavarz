import type {
  RateLimitIncrement,
  RateLimitStore,
} from "@/server/rate-limit/rate-limiter";

const INCREMENT_SCRIPT = `
local count = redis.call("INCR", KEYS[1])
if count == 1 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
end
local ttl = redis.call("PTTL", KEYS[1])
return {count, ttl}
`;

interface UpstashResponse {
  error?: string;
  result?: [number, number];
}

export class UpstashRateLimitStore implements RateLimitStore {
  constructor(
    private readonly restUrl: string,
    private readonly restToken: string,
    private readonly prefix = "keshavarz:rate-limit",
  ) {}

  async increment(
    key: string,
    windowMilliseconds: number,
  ): Promise<RateLimitIncrement> {
    const response = await fetch(this.restUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.restToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        "EVAL",
        INCREMENT_SCRIPT,
        "1",
        `${this.prefix}:${key}`,
        String(windowMilliseconds),
      ]),
      cache: "no-store",
    });
    const payload = (await response.json()) as UpstashResponse;

    if (
      !response.ok ||
      payload.error ||
      !Array.isArray(payload.result)
    ) {
      throw new Error("Rate limit storage is unavailable.");
    }

    const [count, ttl] = payload.result;

    return {
      count,
      resetAt: new Date(Date.now() + Math.max(0, ttl)),
    };
  }
}
