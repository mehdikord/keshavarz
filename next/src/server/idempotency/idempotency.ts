import { stableStringify } from "@/server/idempotency/stable-json";
import {
  API_ERROR_CODES,
  ApiError,
} from "@/server/errors";
import { hashPayload } from "@/server/security";

export interface IdempotencyScope {
  actorId: string;
  key: string;
  operationId: string;
  realm: "admins" | "app" | "gateway";
}

export interface StoredIdempotencyResult<TResult> {
  payloadHash: string;
  result?: TResult;
  state: "completed" | "in_progress";
}

export interface IdempotencyStore {
  get<TResult>(
    scope: IdempotencyScope,
  ): Promise<StoredIdempotencyResult<TResult> | null>;
  reserve(
    scope: IdempotencyScope,
    payloadHash: string,
    expiresAt: Date,
  ): Promise<boolean>;
  complete<TResult>(
    scope: IdempotencyScope,
    payloadHash: string,
    result: TResult,
    expiresAt: Date,
  ): Promise<void>;
  release(
    scope: IdempotencyScope,
    payloadHash: string,
  ): Promise<void>;
}

export class IdempotencyService {
  constructor(private readonly store: IdempotencyStore) {}

  async execute<TPayload, TResult>(
    scope: IdempotencyScope,
    payload: TPayload,
    operation: () => Promise<TResult>,
    retentionMilliseconds = 24 * 60 * 60 * 1000,
  ): Promise<TResult> {
    const payloadHash = hashPayload(stableStringify(payload));
    const existing = await this.store.get<TResult>(scope);

    if (existing) {
      if (existing.payloadHash !== payloadHash) {
        throw new ApiError(
          409,
          API_ERROR_CODES.idempotencyKeyReused,
          "این کلید برای داده متفاوت استفاده شده است.",
        );
      }

      if (existing.state === "in_progress") {
        throw new ApiError(
          409,
          API_ERROR_CODES.idempotencyInProgress,
          "عملیات مشابه در حال پردازش است.",
        );
      }

      return existing.result as TResult;
    }

    const expiresAt = new Date(Date.now() + retentionMilliseconds);
    const reserved = await this.store.reserve(
      scope,
      payloadHash,
      expiresAt,
    );

    if (!reserved) {
      return this.execute(
        scope,
        payload,
        operation,
        retentionMilliseconds,
      );
    }

    try {
      const result = await operation();
      await this.store.complete(
        scope,
        payloadHash,
        result,
        expiresAt,
      );
      return result;
    } catch (error) {
      await this.store.release(scope, payloadHash);
      throw error;
    }
  }
}
