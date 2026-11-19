"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  ADMIN_DEFAULT_LIMIT,
  applySearchParamUpdates,
  parseAdminLimit,
  resetCursorParams,
  type AdminListLimit,
} from "@/lib/admin/search-params";
import { toLatinDigits } from "@/lib/utils/format";

export function useAdminUrlListState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const cursor = searchParams.get("cursor");
  const limit = parseAdminLimit(searchParams.get("limit") ?? undefined);
  const cursorStack = useMemo(() => {
    const raw = searchParams.get("stack");
    if (!raw) return [] as string[];
    return raw.split(",").filter(Boolean);
  }, [searchParams]);

  // Bumped when a navigation would leave the URL unchanged (e.g. "apply" with
  // no filter change). Pages put it in their fetch deps so a handler that set
  // `loading` still gets a response instead of a skeleton that never clears.
  const [refreshToken, setRefreshToken] = useState(0);

  const navigate = useCallback(
    (next: URLSearchParams) => {
      const qs = next.toString();
      if (qs === searchParams.toString()) {
        setRefreshToken((value) => value + 1);
        return;
      }
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const replaceParams = useCallback(
    (updates: Record<string, string | null | undefined>) => {
      navigate(applySearchParamUpdates(searchParams, updates));
    },
    [navigate, searchParams],
  );

  const setSearch = useCallback(
    (value: string) => {
      // Persian/Arabic digits so phone searches match the stored Latin digits.
      const normalized = toLatinDigits(value).trim();
      navigate(
        resetCursorParams(searchParams, {
          q: normalized || null,
          stack: null,
        }),
      );
    },
    [navigate, searchParams],
  );

  const setFilters = useCallback(
    (updates: Record<string, string | null | undefined>) => {
      navigate(
        resetCursorParams(searchParams, {
          ...updates,
          stack: null,
        }),
      );
    },
    [navigate, searchParams],
  );

  const setLimit = useCallback(
    (nextLimit: AdminListLimit) => {
      navigate(
        resetCursorParams(searchParams, {
          limit: String(nextLimit),
          stack: null,
        }),
      );
    },
    [navigate, searchParams],
  );

  const goNext = useCallback(
    (nextCursor: string) => {
      // A fast double click would push the same cursor twice.
      if (nextCursor === cursor) return;
      const stack = [...cursorStack, cursor ?? ""].filter(Boolean);
      replaceParams({
        cursor: nextCursor,
        stack: stack.length > 0 ? stack.join(",") : null,
      });
    },
    [cursor, cursorStack, replaceParams],
  );

  const goPrevious = useCallback(() => {
    if (cursorStack.length === 0) {
      replaceParams({ cursor: null, stack: null });
      return;
    }
    const stack = [...cursorStack];
    const previous = stack.pop() || null;
    replaceParams({
      cursor: previous,
      stack: stack.length > 0 ? stack.join(",") : null,
    });
  }, [cursorStack, replaceParams]);

  const clearAll = useCallback(() => {
    navigate(new URLSearchParams());
  }, [navigate]);

  return {
    clearAll,
    cursor,
    cursorStack,
    get: (key: string) => searchParams.get(key),
    goNext,
    goPrevious,
    limit: limit || ADMIN_DEFAULT_LIMIT,
    q,
    refreshToken,
    replaceParams,
    setFilters,
    setLimit,
    setSearch,
  };
}
