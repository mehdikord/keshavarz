import type {
  IdempotencyScope,
  IdempotencyStore,
  StoredIdempotencyResult,
} from "@/server/idempotency/idempotency";

interface MemoryRecord {
  expiresAt: Date;
  payloadHash: string;
  result?: unknown;
  state: "completed" | "in_progress";
}

function scopeKey(scope: IdempotencyScope): string {
  return [
    scope.realm,
    scope.actorId,
    scope.operationId,
    scope.key,
  ].join(":");
}

export class MemoryIdempotencyStore implements IdempotencyStore {
  private readonly records = new Map<string, MemoryRecord>();

  async get<TResult>(
    scope: IdempotencyScope,
  ): Promise<StoredIdempotencyResult<TResult> | null> {
    const key = scopeKey(scope);
    const record = this.records.get(key);

    if (!record) {
      return null;
    }

    if (record.expiresAt <= new Date()) {
      this.records.delete(key);
      return null;
    }

    return {
      payloadHash: record.payloadHash,
      result: record.result as TResult | undefined,
      state: record.state,
    };
  }

  async reserve(
    scope: IdempotencyScope,
    payloadHash: string,
    expiresAt: Date,
  ): Promise<boolean> {
    const key = scopeKey(scope);

    if (await this.get(scope)) {
      return false;
    }

    this.records.set(key, {
      expiresAt,
      payloadHash,
      state: "in_progress",
    });
    return true;
  }

  async complete<TResult>(
    scope: IdempotencyScope,
    payloadHash: string,
    result: TResult,
    expiresAt: Date,
  ): Promise<void> {
    this.records.set(scopeKey(scope), {
      expiresAt,
      payloadHash,
      result,
      state: "completed",
    });
  }

  async release(
    scope: IdempotencyScope,
    payloadHash: string,
  ): Promise<void> {
    const key = scopeKey(scope);
    const record = this.records.get(key);

    if (
      record?.state === "in_progress" &&
      record.payloadHash === payloadHash
    ) {
      this.records.delete(key);
    }
  }
}
