import {
  API_ERROR_CODES,
  ApiError,
} from "@/server/errors";

export interface RateLimitIncrement {
  count: number;
  resetAt: Date;
}

export interface RateLimitStore {
  increment(
    key: string,
    windowMilliseconds: number,
  ): Promise<RateLimitIncrement>;
}

export interface RateLimitPolicy {
  limit: number;
  windowMilliseconds: number;
}

export interface RateLimitResult {
  limit: number;
  remaining: number;
  resetAt: Date;
}

export class RateLimiter {
  constructor(private readonly store: RateLimitStore) {}

  async consume(
    key: string,
    policy: RateLimitPolicy,
  ): Promise<RateLimitResult> {
    const increment = await this.store.increment(
      key,
      policy.windowMilliseconds,
    );
    const remaining = Math.max(0, policy.limit - increment.count);

    if (increment.count > policy.limit) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((increment.resetAt.getTime() - Date.now()) / 1000),
      );

      throw new ApiError(
        429,
        API_ERROR_CODES.rateLimited,
        "تعداد درخواست‌ها بیش از حد مجاز است.",
        {
          headers: {
            "Retry-After": String(retryAfterSeconds),
            "X-RateLimit-Limit": String(policy.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": increment.resetAt.toISOString(),
          },
        },
      );
    }

    return {
      limit: policy.limit,
      remaining,
      resetAt: increment.resetAt,
    };
  }
}
