"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { adminApi } from "@/lib/api/admin-client";
import {
  ADMIN_DEFAULT_LIMIT,
  type AdminCursorMeta,
  type AdminListLimit,
} from "@/lib/admin/search-params";
import { isApiClientError } from "@/lib/api/envelope";

interface CursorListResult<TItem> {
  items: TItem[];
  meta: AdminCursorMeta;
}

interface UseAdminCursorQueryOptions<TItem> {
  path: string;
  query?: Record<string, string | number | boolean | null | undefined>;
  limit?: AdminListLimit;
  cursor?: string | null;
  enabled?: boolean;
  mapResponse: (data: unknown, meta?: Record<string, unknown>) => CursorListResult<TItem>;
  debounceMs?: number;
}

export function useAdminCursorQuery<TItem>({
  path,
  query,
  limit = ADMIN_DEFAULT_LIMIT,
  cursor = null,
  enabled = true,
  mapResponse,
  debounceMs = 0,
}: UseAdminCursorQueryOptions<TItem>) {
  const [items, setItems] = useState<TItem[]>([]);
  const [meta, setMeta] = useState<AdminCursorMeta>({
    hasMore: false,
    limit,
    nextCursor: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; requestId?: string } | null>(
    null,
  );
  const [version, setVersion] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const invalidate = useCallback(() => {
    setVersion((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const timer = window.setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      void adminApi
        .get<unknown>(path, {
          query: {
            ...query,
            cursor: cursor || undefined,
            limit,
          },
          signal: controller.signal,
        })
        .then((response) => {
          const mapped = mapResponse(response.data, response.meta);
          setItems(mapped.items);
          setMeta(mapped.meta);
        })
        .catch((cause: unknown) => {
          if (controller.signal.aborted) return;
          setItems([]);
          setError({
            message: isApiClientError(cause)
              ? cause.message
              : "بارگذاری فهرست ناموفق بود.",
            requestId: isApiClientError(cause) ? cause.requestId : undefined,
          });
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        });
    }, debounceMs);

    return () => {
      window.clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [cursor, debounceMs, enabled, limit, mapResponse, path, query, version]);

  return {
    error,
    invalidate,
    items,
    loading,
    meta,
  };
}
