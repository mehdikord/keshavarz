/** URL-safe idempotency key (≥16 chars) for admin money mutations. */
export function createAdminIdempotencyKey(prefix = "admin"): string {
  const uuid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${uuid}`;
}

export const ADMIN_IDEMPOTENCY_HEADER = "Idempotency-Key";
