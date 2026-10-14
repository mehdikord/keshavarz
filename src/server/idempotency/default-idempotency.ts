import { IdempotencyService } from "@/server/idempotency/idempotency";
import { MemoryIdempotencyStore } from "@/server/idempotency/memory-store";

const globalIdempotency = globalThis as unknown as {
  appIdempotencyService?: IdempotencyService;
};

export function getAppIdempotencyService(): IdempotencyService {
  globalIdempotency.appIdempotencyService ??= new IdempotencyService(
    new MemoryIdempotencyStore(),
  );
  return globalIdempotency.appIdempotencyService;
}
