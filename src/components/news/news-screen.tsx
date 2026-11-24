"use client";

import { ChevronRight, LoaderCircle, RotateCw, Search, SearchX, Sprout, WifiOff, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { NewsLink, ReadButton, StalkNode, StoryMeta } from "@/components/news/news-parts";
import { useNewsFeed } from "@/components/news/use-news-feed";
import { FieldHills } from "@/components/shared/field-hills";
import { NewsImage } from "@/components/shared/news-image";
import type { AppNewsItem } from "@/lib/api/app-news";
import { groupNewsByDay, storyTimeLabel, todayLabel } from "@/lib/news/news-dates";
import { highlightTitle, searchWords } from "@/lib/news/search-text";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/utils/format";

const SEARCH_DELAY_MS = 350;

/** «/news»: a fixed search bar over a day-by-day stalk of headlines; each opens on its source site. */
export function NewsScreen() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const value = input.trim();
    if (value === query) return;
    const timer = window.setTimeout(() => setQuery(value), SEARCH_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [input, query]);

  // New results are read from the top.
  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: 0 });
  }, [query]);

  function clear() {
    setInput("");
    setQuery("");
    inputRef.current?.focus();
  }

  return (
    <div className="flex h-0 min-h-0 flex-1 flex-col">
      <header className="z-20 shrink-0 bg-[#0f3324] px-4 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] pb-3 text-white">
        <div className="flex items-center gap-2.5">
          <Link
            aria-label="بازگشت به صفحه اصلی"
            className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 outline-none focus-visible:ring-2 focus-visible:ring-[#f4a261] active:scale-95"
            href="/"
          >
            <ChevronRight className="size-[22px]" strokeWidth={2} />
          </Link>
          <form
            className="relative min-w-0 flex-1"
            onSubmit={(event) => {
              event.preventDefault();
              setQuery(input.trim());
              inputRef.current?.blur();
            }}
            role="search"
          >
            <Search aria-hidden className="pointer-events-none absolute top-1/2 right-3.5 size-[18px] -translate-y-1/2 text-[#5c6b5c]" />
            <input
              aria-label="جستجو در عنوان خبرها"
              autoComplete="off"
              // 16px: anything smaller makes iOS zoom the page on focus.
              className="h-11 w-full rounded-2xl bg-white pr-11 pl-11 text-[16px] text-foreground outline-none placeholder:text-[14px] placeholder:text-[#5c6b5c] focus-visible:ring-2 focus-visible:ring-[#f4a261] [&::-webkit-search-cancel-button]:hidden"
              enterKeyHint="search"
              maxLength={100}
              onChange={(event) => setInput(event.target.value)}
              placeholder="جستجو در عنوان خبرها"
              ref={inputRef}
              type="search"
              value={input}
            />
            {input ? (
              <button
                aria-label="پاک کردن جستجو"
                className="absolute inset-y-0 left-0 flex w-11 items-center justify-center rounded-2xl text-[#5c6b5c] outline-none focus-visible:ring-2 focus-visible:ring-[#f4a261]"
                onClick={clear}
                type="button"
              >
                <X className="size-[18px]" />
              </button>
            ) : null}
          </form>
        </div>
      </header>

      <main
        className="flex min-h-0 flex-1 touch-pan-y flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain [&>*]:shrink-0"
        ref={scrollerRef}
      >
        {query ? <h1 className="sr-only">جستجو در اخبار کشاورزی</h1> : <Masthead />}
        <NewsFeedView onClear={clear} query={query} />
      </main>
    </div>
  );
}

function Masthead() {
  return (
    <section className="relative isolate overflow-hidden bg-[linear-gradient(180deg,#0f3324_0%,#1b5038_100%)] px-5 pt-5 pb-[92px] text-white">
      <div aria-hidden className="bg-grain pointer-events-none absolute inset-0 -z-10 opacity-[0.07] mix-blend-overlay" />
      <p className="text-[12px] font-bold text-[#f8c690]">{todayLabel()}</p>
      <h1 className="mt-1 text-[32px] leading-[1.45] font-black tracking-tight">اخبار کشاورزی</h1>
      <p className="mt-1 max-w-[30ch] text-[13px] leading-6 text-white/75">
        جدیدترین خبرهای حوزه کشاورزی. متن کامل هر خبر در سایت منبع باز می‌شود.
      </p>
      <FieldHills />
    </section>
  );
}

function NewsFeedView({ onClear, query }: { onClear: () => void; query: string }) {
  const feed = useNewsFeed(query);
  const { failed, items, loadMore, loading, loadingMore, moreFailed, nextCursor } = feed;
  const groups = useMemo(() => groupNewsByDay(items), [items]);
  const words = useMemo(() => searchWords(feed.query), [feed.query]);
  const searching = feed.query !== "";

  if (loading && items.length === 0) return <FeedSkeleton />;

  if (failed && !loading) {
    return (
      <Notice
        action={
          <NoticeButton onClick={feed.retry}>
            <RotateCw className="size-4" />
            تلاش دوباره
          </NoticeButton>
        }
        icon={<WifiOff />}
        text="اتصال اینترنت را بررسی کنید و دوباره تلاش کنید."
        title="خبرها بارگذاری نشد"
      />
    );
  }

  if (items.length === 0) {
    return searching ? (
      <Notice
        action={<NoticeButton onClick={onClear}>نمایش همه خبرها</NoticeButton>}
        icon={<SearchX />}
        text="کلمه کوتاه‌تر یا دیگری را جستجو کنید."
        title={`خبری با «${feed.query}» پیدا نشد`}
      />
    ) : (
      <Notice icon={<Sprout />} text="خبرهای تازه کشاورزی همین‌جا نمایش داده می‌شود." title="هنوز خبری منتشر نشده است" />
    );
  }

  return (
    <div
      aria-busy={loading}
      className={cn(
        "pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] transition-opacity duration-150",
        loading && "opacity-50",
      )}
    >
      {searching ? (
        <p className="px-5 pt-4 pb-1 text-[12.5px] text-muted-foreground" role="status">
          <b className="text-foreground">{toPersianDigits(feed.total)} خبر</b> با «{feed.query}» پیدا شد
        </p>
      ) : null}

      <div className="relative">
        <span aria-hidden className="absolute top-3 right-[23px] bottom-3 w-[2px] rounded-full bg-[#b7dcc4]" />
        {groups.map((group, groupIndex) => (
          <section aria-label={group.label} className="relative" key={group.key}>
            <h2 className="relative pt-4 pr-12 pb-2 text-[12.5px] font-black text-[#1f5c41]">
              <span
                aria-hidden
                className="absolute top-[21px] right-[19px] size-2.5 rounded-full border-2 border-[#2d6a4f] bg-background"
              />
              {group.label}
            </h2>
            <ol>
              {group.items.map((item, index) => (
                <li className="relative" key={item.newsId}>
                  <StalkNode className="absolute top-3.5 right-3 z-10" important={item.isImportant} index={index} />
                  {!searching && groupIndex === 0 && index === 0 ? (
                    <LeadStory item={item} />
                  ) : (
                    <Story item={item} words={words} />
                  )}
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      {nextCursor && !loading ? (
        <LoadMore auto={!moreFailed} busy={loadingMore} failed={moreFailed} onLoad={loadMore} />
      ) : null}
    </div>
  );
}

/** The newest story: a wide picture and a bigger headline. */
function LeadStory({ item }: { item: AppNewsItem }) {
  return (
    <NewsLink
      className={cn(
        "mr-11 mb-2 ml-4 block overflow-hidden rounded-[24px] shadow-[0_14px_30px_-22px_rgba(18,61,43,0.6)] ring-1 focus-visible:ring-offset-2",
        item.isImportant ? "bg-[#fff5e8] ring-[#f0cfa4]" : "bg-surface ring-border/70",
      )}
      href={item.link}
    >
      <NewsImage className="aspect-[1.91/1] w-full bg-[#eef3ea] text-primary" src={item.image} />
      <span className="block px-4 pt-3 pb-3.5">
        <span className="block text-[17px] leading-8 font-black break-words text-foreground">{item.title}</span>
        <span className="mt-3 flex items-center justify-between gap-3">
          <StoryMeta important={item.isImportant} source={item.source} time={storyTimeLabel(item.publishedAt)} />
          <ReadButton className="h-9 bg-[#1f5c41] px-4 text-white" />
        </span>
      </span>
    </NewsLink>
  );
}

function Story({ item, words }: { item: AppNewsItem; words: string[] }) {
  return (
    <NewsLink
      className={cn(
        "mr-11 ml-3 block rounded-[20px] px-2 py-3",
        item.isImportant ? "my-1 bg-[#fff5e8]" : "active:bg-[#eef3ea]",
      )}
      href={item.link}
    >
      <span className="flex items-start gap-3">
        <span className="line-clamp-3 min-w-0 flex-1 text-[14px] leading-[26px] font-extrabold break-words text-foreground">
          {highlightTitle(item.title, words).map((part, index) =>
            part.match ? (
              <mark className="bg-transparent bg-[linear-gradient(transparent_58%,#fbd08f_58%,#fbd08f_88%,transparent_88%)] text-inherit" key={index}>
                {part.text}
              </mark>
            ) : (
              part.text
            ),
          )}
        </span>
        <NewsImage className="h-[72px] w-24 rounded-2xl bg-[#eef3ea] text-primary" src={item.image} />
      </span>
      <span className="mt-2 flex items-center justify-between gap-3">
        <StoryMeta important={item.isImportant} source={item.source} time={storyTimeLabel(item.publishedAt)} />
        <ReadButton />
      </span>
    </NewsLink>
  );
}

/** Loads the next page as it nears the screen; the button is the fallback. */
function LoadMore({ auto, busy, failed, onLoad }: { auto: boolean; busy: boolean; failed: boolean; onLoad: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!auto || busy || !node) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) onLoad();
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [auto, busy, onLoad]);

  return (
    <div className="flex justify-center pt-4" ref={ref}>
      <button
        className="inline-flex h-11 items-center gap-2 rounded-full bg-surface px-5 text-[12.5px] font-bold text-foreground ring-1 ring-border active:scale-95 disabled:opacity-70"
        disabled={busy}
        onClick={onLoad}
        type="button"
      >
        {busy ? <LoaderCircle className="size-4 animate-spin" /> : null}
        {busy ? "در حال دریافت خبرها" : failed ? "دریافت نشد، تلاش دوباره" : "خبرهای بیشتر"}
      </button>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div aria-busy="true" aria-label="در حال بارگذاری خبرها" className="animate-pulse pt-5 pr-11 pl-4 motion-reduce:animate-none">
      <div className="aspect-[16/11] rounded-[24px] bg-muted" />
      {[0, 1, 2].map((row) => (
        <div className="flex gap-3 pt-6" key={row}>
          <div className="flex-1 space-y-3 pt-1">
            <div className="h-3 rounded bg-muted" />
            <div className="h-3 w-3/4 rounded bg-muted" />
          </div>
          <div className="h-[72px] w-24 rounded-2xl bg-muted" />
        </div>
      ))}
    </div>
  );
}

function Notice({ action, icon, text, title }: { action?: React.ReactNode; icon: React.ReactNode; text: string; title: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 py-14 text-center" role="status">
      <span className="mb-2 flex size-16 items-center justify-center rounded-full bg-[#e3efe4] text-[#1f5c41] [&_svg]:size-7">
        {icon}
      </span>
      <p className="max-w-full text-[15px] font-black break-words text-foreground">{title}</p>
      <p className="text-[12.5px] leading-6 text-muted-foreground">{text}</p>
      {action}
    </div>
  );
}

function NoticeButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      className="mt-3 inline-flex h-11 items-center gap-2 rounded-full bg-[#1f5c41] px-5 text-[13px] font-bold text-white active:scale-95"
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
