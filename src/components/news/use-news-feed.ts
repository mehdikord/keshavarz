"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { type AppNewsItem, fetchAppNews } from "@/lib/api/app-news";

const PAGE_SIZE = 15;

interface Feed {
  failed: boolean;
  items: AppNewsItem[];
  moreFailed: boolean;
  nextCursor: string | null;
  /** The query these results answer. */
  query: string;
  /** Which load produced them; differs from the current one while a search is on its way. */
  requestKey: string | null;
  total: number;
}

const EMPTY: Feed = { failed: false, items: [], moreFailed: false, nextCursor: null, query: "", requestKey: null, total: 0 };

/** The news list for one search: first page, then cursor pages. A stale response never replaces a newer one. */
export function useNewsFeed(query: string) {
  const [feed, setFeed] = useState<Feed>(EMPTY);
  const [attempt, setAttempt] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const moreRef = useRef<AbortController | null>(null);

  const requestKey = `${attempt}:${query}`;
  const loading = feed.requestKey !== requestKey;

  useEffect(() => {
    const controller = new AbortController();
    fetchAppNews({ limit: PAGE_SIZE, q: query, signal: controller.signal }).then(
      (page) => {
        if (controller.signal.aborted) return;
        // Going back to an earlier search restarts the list: drop any next page asked for meanwhile, or it leaves a gap.
        moreRef.current?.abort();
        moreRef.current = null;
        setLoadingMore(false);
        setFeed({ ...EMPTY, ...page, query, requestKey });
      },
      () => {
        if (!controller.signal.aborted) setFeed({ ...EMPTY, failed: true, query, requestKey });
      },
    );
    return () => {
      controller.abort();
      moreRef.current?.abort();
      moreRef.current = null;
      setLoadingMore(false);
    };
  }, [query, requestKey]);

  const { nextCursor } = feed;
  const loadMore = useCallback(() => {
    if (!nextCursor || loading || moreRef.current) return;
    const controller = new AbortController();
    moreRef.current = controller;
    setLoadingMore(true);
    setFeed((current) => ({ ...current, moreFailed: false }));

    const settle = (update: (current: Feed) => Feed) => {
      if (controller.signal.aborted) return;
      moreRef.current = null;
      setLoadingMore(false);
      setFeed(update);
    };
    fetchAppNews({ cursor: nextCursor, limit: PAGE_SIZE, q: query, signal: controller.signal }).then(
      (page) =>
        settle((current) => ({
          ...current,
          items: [...current.items, ...page.items],
          nextCursor: page.nextCursor,
          total: page.total,
        })),
      () => settle((current) => ({ ...current, moreFailed: true })),
    );
  }, [loading, nextCursor, query]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  return { ...feed, loadMore, loading, loadingMore, retry };
}
