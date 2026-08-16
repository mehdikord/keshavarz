import { describe, expect, it, vi } from "vitest";

import {
  IdempotencyService,
  MemoryIdempotencyStore,
} from "@/server/idempotency";

const scope = {
  actorId: "01J00000000000000000000000",
  key: "request-key-0001",
  operationId: "testOperation",
  realm: "app",
} as const;

describe("IdempotencyService", () => {
  it("replays a completed result for the same payload", async () => {
    const operation = vi.fn(async () => ({ created: true }));
    const service = new IdempotencyService(
      new MemoryIdempotencyStore(),
    );

    await service.execute(scope, { value: 1 }, operation);
    const replay = await service.execute(
      scope,
      { value: 1 },
      operation,
    );

    expect(replay).toEqual({ created: true });
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("rejects reuse with a different payload", async () => {
    const service = new IdempotencyService(
      new MemoryIdempotencyStore(),
    );

    await service.execute(scope, { value: 1 }, async () => "ok");

    await expect(
      service.execute(scope, { value: 2 }, async () => "different"),
    ).rejects.toMatchObject({
      code: "IDEMPOTENCY_KEY_REUSED",
      status: 409,
    });
  });
});
