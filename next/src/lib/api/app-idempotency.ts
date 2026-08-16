/** URL-safe idempotency key (≥16 chars) for app search/request mutations. */
export function createAppIdempotencyKey(prefix = "app"): string {
  const uuid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${uuid}`;
}

export const APP_IDEMPOTENCY_HEADER = "Idempotency-Key";
