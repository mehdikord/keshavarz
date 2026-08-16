import { getSecurityEnvironment } from "@/server/config/env";
import {
  MemoryRateLimitStore,
  RateLimiter,
  UpstashRateLimitStore,
} from "@/server/rate-limit";

const globalRateLimit = globalThis as unknown as {
  appRateLimiter?: RateLimiter;
};

function createRateLimiter(): RateLimiter {
  const environment = getSecurityEnvironment();

  if (
    environment.UPSTASH_REDIS_REST_URL &&
    environment.UPSTASH_REDIS_REST_TOKEN
  ) {
    return new RateLimiter(
      new UpstashRateLimitStore(
        environment.UPSTASH_REDIS_REST_URL,
        environment.UPSTASH_REDIS_REST_TOKEN,
      ),
    );
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Production rate limiting requires Upstash Redis.");
  }

  return new RateLimiter(new MemoryRateLimitStore());
}

export function getAppRateLimiter(): RateLimiter {
  globalRateLimit.appRateLimiter ??= createRateLimiter();
  return globalRateLimit.appRateLimiter;
}
