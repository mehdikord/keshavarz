"use client";

import { useCallback, useRef } from "react";

import { createAdminIdempotencyKey } from "@/lib/api/admin-idempotency";

/**
 * One idempotency key per logical operation: retrying the same payload (e.g.
 * after a timeout whose request actually committed) reuses the key so the
 * server replays the first result instead of executing twice. A changed
 * payload gets a fresh key; call `reset` after success.
 */
export function useIdempotencyKey(prefix: string) {
  const current = useRef<{ key: string; payload: string } | null>(null);

  const keyFor = useCallback(
    (payload: unknown) => {
      const serialized = JSON.stringify(payload);
      if (current.current?.payload !== serialized) {
        current.current = {
          key: createAdminIdempotencyKey(prefix),
          payload: serialized,
        };
      }
      return current.current.key;
    },
    [prefix],
  );

  const reset = useCallback(() => {
    current.current = null;
  }, []);

  return { keyFor, reset };
}
