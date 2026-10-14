"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  ADMIN_DEFAULT_LIMIT,
  applySearchParamUpdates,
  parseAdminLimit,
  resetCursorParams,
  type AdminListLimit,
} from "@/lib/admin/search-params";

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

  const replaceParams = useCallback(
    (updates: Record<string, string | null | undefined>) => {
      const next = applySearchParamUpdates(searchParams, updates);
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const setSearch = useCallback(
    (value: string) => {
      const next = resetCursorParams(searchParams, {
        q: value.trim() || null,
        stack: null,
      });
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const setFilters = useCallback(
    (updates: Record<string, string | null | undefined>) => {
      const next = resetCursorParams(searchParams, {
        ...updates,
        stack: null,
      });
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const setLimit = useCallback(
    (nextLimit: AdminListLimit) => {
      const next = resetCursorParams(searchParams, {
        limit: String(nextLimit),
        stack: null,
      });
      router.replace(`${pathname}?${next.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const goNext = useCallback(
    (nextCursor: string) => {
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
    router.replace(pathname);
  }, [pathname, router]);

  return {
    clearAll,
    cursor,
    cursorStack,
    get: (key: string) => searchParams.get(key),
    goNext,
    goPrevious,
    limit: limit || ADMIN_DEFAULT_LIMIT,
    q,
    replaceParams,
    setFilters,
    setLimit,
    setSearch,
  };
}
