"use client";

import { ArrowLeft, RotateCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { NewsLink, ReadButton, StalkNode, StoryMeta } from "@/components/news/news-parts";
import { NewsImage } from "@/components/shared/news-image";
import { type AppNewsItem, fetchAppNews } from "@/lib/api/app-news";
import { storyDayLabel } from "@/lib/news/news-dates";
import { cn } from "@/lib/utils";

const HOME_NEWS_COUNT = 3;

type State = { status: "error" } | { status: "loading" } | { items: AppNewsItem[]; status: "ready" };

/**
 * Home section «اخبار کشاورزی»: the three newest stories as leaves on a stalk
 * that grows out of the soil band linking to all news. Hidden while there is
 * no news; on failure it stays, so the news page is still reachable.
 */
export function LatestNews() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchAppNews({ limit: HOME_NEWS_COUNT, signal: controller.signal }).then(
      ({ items }) => {
        if (!controller.signal.aborted) setState({ items, status: "ready" });
      },
      () => {
        if (!controller.signal.aborted) setState({ status: "error" });
      },
    );
    return () => controller.abort();
  }, [attempt]);

  if (state.status === "ready" && state.items.length === 0) return null;

  return (
    <section aria-labelledby="latest-news-title" className="px-4">
      <div className="overflow-hidden rounded-[28px] bg-surface shadow-[0_14px_32px_-22px_rgba(18,61,43,0.55)] ring-1 ring-border/70">
        <header className="px-5 pt-4 pb-1">
          <h2 className="text-[18px] leading-8 font-black text-foreground" id="latest-news-title">
            اخبار کشاورزی
          </h2>
          <p className="text-[11.5px] leading-5 text-muted-foreground">جدیدترین خبرها از سایت‌های معتبر</p>
        </header>

        <div className="relative">
          <span aria-hidden className="pointer-events-none absolute top-4 right-[23px] bottom-0 z-[1] w-[2px] rounded-full bg-[#b7dcc4]" />

          {state.status === "loading" ? (
            <ul aria-busy="true" aria-label="در حال بارگذاری خبرها">
              {Array.from({ length: HOME_NEWS_COUNT }, (_, index) => (
                <li className="flex h-[104px] animate-pulse items-center gap-3 pr-11 pl-4 motion-reduce:animate-none" key={index}>
                  <span className="flex-1 space-y-2.5">
                    <span className="block h-3 rounded bg-muted" />
                    <span className="block h-3 w-2/3 rounded bg-muted" />
                  </span>
                  <span className="h-[58px] w-[92px] rounded-2xl bg-muted" />
                </li>
              ))}
            </ul>
          ) : state.status === "error" ? (
            <div className="flex items-center justify-between gap-3 py-6 pr-11 pl-4" role="status">
              <p className="text-[12.5px] leading-6 text-muted-foreground">خبرها بارگذاری نشد. اینترنت را بررسی کنید.</p>
              <button
                className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-muted px-4 text-[12px] font-bold text-foreground active:scale-95"
                onClick={() => {
                  setState({ status: "loading" });
                  setAttempt((value) => value + 1);
                }}
                type="button"
              >
                <RotateCw className="size-3.5" />
                تلاش دوباره
              </button>
            </div>
          ) : (
            <ol>
              {state.items.map((item, index) => (
                <li className="relative" key={item.newsId}>
                  <StalkNode className="absolute top-4 right-3 z-10" important={item.isImportant} index={index} />
                  <NewsLink
                    className={cn(
                      "flex items-stretch gap-3 py-2.5 pr-11 pl-4 focus-visible:ring-inset",
                      item.isImportant ? "bg-[#fff5e8]" : "active:bg-[#f3f7f1]",
                    )}
                    href={item.link}
                  >
                    <span className="flex min-w-0 flex-1 flex-col justify-between gap-1">
                      <span className="line-clamp-2 text-[13.5px] leading-6 font-extrabold break-words text-foreground">
                        {item.title}
                      </span>
                      <StoryMeta important={item.isImportant} source={item.source} time={storyDayLabel(item.publishedAt)} />
                    </span>
                    <span className="flex w-[92px] shrink-0 flex-col gap-1.5">
                      <NewsImage className="h-[54px] w-full rounded-2xl bg-[#f1f5ee] text-primary" src={item.image} />
                      <ReadButton className="h-7 w-full px-0 text-[11px]" />
                    </span>
                  </NewsLink>
                </li>
              ))}
            </ol>
          )}
        </div>

        <Link
          className="group relative isolate flex h-[54px] items-center justify-between overflow-hidden bg-[#123d2b] pr-11 pl-4 text-white outline-none focus-visible:ring-2 focus-visible:ring-[#f4a261] focus-visible:ring-inset"
          href="/news"
        >
          <svg aria-hidden className="absolute inset-0 -z-10 size-full text-white/[0.08]" fill="none" preserveAspectRatio="none" viewBox="0 0 400 54">
            {[16, 30, 44, 58].map((y) => (
              <path d={`M0 ${y} C 120 ${y - 14} 280 ${y + 8} 400 ${y - 8}`} key={y} stroke="currentColor" strokeWidth="1.5" />
            ))}
          </svg>
          <span aria-hidden className="absolute top-0 right-[23px] h-3 w-[2px] rounded-b-full bg-[#b7dcc4]" />
          <span className="text-[13.5px] font-black">مشاهده همه خبرها</span>
          <ArrowLeft className="size-5 transition-transform group-active:-translate-x-1" strokeWidth={2.2} />
        </Link>
      </div>
    </section>
  );
}
