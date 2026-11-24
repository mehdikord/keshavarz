"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Shuffle, Sparkles, Tractor } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { type AppFeaturedService, fetchAppFeaturedServices } from "@/lib/api/app-catalog";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/utils/format";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Tile colours for services that have no picture yet. */
const FALLBACK_TONES = [
  "bg-[linear-gradient(150deg,#2d7a55_0%,#1f5c41_55%,#123d2b_100%)]",
  "bg-[linear-gradient(150deg,#f8b26a_0%,#e07b1f_60%,#a9520c_100%)]",
  "bg-[linear-gradient(150deg,#52796f_0%,#354f52_60%,#1f3133_100%)]",
];

type State =
  | { status: "loading" }
  | { status: "hidden" }
  | { services: AppFeaturedService[]; status: "ready" };

/**
 * Home section «آیا این ادوات را می‌شناسید؟»: three random services the admin
 * marked special, drawn again on every visit (and on «بُر زدن»). Each card opens
 * the service's intro page. Hidden entirely when there is nothing to show.
 */
export function FeaturedServices() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [shuffling, setShuffling] = useState(false);
  const [spin, setSpin] = useState(0);
  const controllerRef = useRef<AbortController | null>(null);

  /** Starts a draw, cancelling any draw still in flight. */
  const request = useCallback((exclude: string[]) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    return fetchAppFeaturedServices({ exclude, limit: 3, signal: controller.signal }).then(
      (services) => {
        if (controller.signal.aborted) return;
        setState(services.length > 0 ? { services, status: "ready" } : { status: "hidden" });
      },
      () => {
        // A side section: on failure keep what is on screen, or quietly hide.
        if (!controller.signal.aborted) {
          setState((current) => (current.status === "ready" ? current : { status: "hidden" }));
        }
      },
    );
  }, []);

  useEffect(() => {
    void request([]);
    return () => controllerRef.current?.abort();
  }, [request]);

  if (state.status === "hidden") return null;

  const services = state.status === "ready" ? state.services : [];

  async function reshuffle() {
    if (shuffling) return;
    setShuffling(true);
    setSpin((value) => value + 1);
    await request(services.map((service) => service.serviceId));
    setShuffling(false);
  }

  return (
    <section aria-labelledby="featured-services-title" className="px-4">
      <div className="relative isolate overflow-hidden rounded-[30px] bg-[linear-gradient(160deg,#0b2619_0%,#123d2b_45%,#1b5038_100%)] p-4 pb-5 text-white shadow-[0_24px_48px_-24px_rgba(11,38,25,0.8)]">
        {/* Atmosphere: grain, a warm sun glow and a cool field glow. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="bg-grain absolute inset-0 opacity-[0.07] mix-blend-overlay" />
          <div className="absolute -top-20 -left-16 size-60 rounded-full bg-[radial-gradient(circle,rgba(244,162,97,0.38)_0%,rgba(244,162,97,0.08)_45%,transparent_70%)]" />
          <div className="absolute -right-20 -bottom-24 size-72 rounded-full bg-[#40916c]/25 blur-3xl" />
          <svg className="absolute top-0 right-0 h-28 w-40 text-white/[0.06]" fill="none" viewBox="0 0 160 112">
            {[0, 1, 2, 3, 4, 5].map((row) => (
              <path d={`M0 ${18 + row * 16} C 40 ${8 + row * 16}, 120 ${28 + row * 16}, 160 ${14 + row * 16}`} key={row} stroke="currentColor" strokeWidth="1.5" />
            ))}
          </svg>
        </div>

        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f4a261]/18 px-2.5 py-1 text-[10.5px] font-black text-[#ffc58f] ring-1 ring-[#f4a261]/25">
              <Sparkles className="size-3.5" />
              ادوات ویژه
            </span>
            <h2 className="mt-2.5 text-[18px] leading-8 font-black tracking-tight" id="featured-services-title">
              آیا این ادوات را می‌شناسید؟
            </h2>
            <p className="text-[11.5px] leading-5 text-white/60">با ابزارهای کار کشاورزی بیشتر آشنا شوید</p>
          </div>
          {services.length > 0 ? (
            <button
              aria-label="نمایش ادوات دیگر"
              className="mt-1 flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/15 backdrop-blur-md transition-[transform,background-color] duration-200 hover:bg-white/15 active:scale-90 disabled:opacity-60"
              disabled={shuffling}
              onClick={() => void reshuffle()}
              type="button"
            >
              <motion.span
                animate={{ rotate: spin * 180 }}
                className="flex"
                transition={{ duration: 0.55, ease: EASE }}
              >
                <Shuffle className="size-[18px]" strokeWidth={2} />
              </motion.span>
            </button>
          ) : null}
        </header>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {state.status === "loading" ? (
            <>
              <div className="col-span-2 aspect-[16/10] animate-pulse rounded-[24px] bg-white/[0.08]" />
              <div className="aspect-[4/5] animate-pulse rounded-[24px] bg-white/[0.08]" />
              <div className="aspect-[4/5] animate-pulse rounded-[24px] bg-white/[0.08]" />
            </>
          ) : (
            <AnimatePresence initial mode="popLayout">
              {services.map((service, index) => (
                <FeaturedCard
                  index={index}
                  key={service.serviceId}
                  // The lead card spans the row; a lone second card does too.
                  layout={index === 0 || services.length === 2 ? "wide" : "tall"}
                  service={service}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </section>
  );
}

function FeaturedCard({
  index,
  layout,
  service,
}: {
  index: number;
  layout: "tall" | "wide";
  service: AppFeaturedService;
}) {
  const [failed, setFailed] = useState(false);
  const wide = layout === "wide";
  const lead = index === 0;
  const showImage = Boolean(service.image) && !failed;

  return (
    <motion.div
      animate={{ filter: "blur(0px)", opacity: 1, scale: 1, y: 0 }}
      className={cn(wide && "col-span-2")}
      exit={{ filter: "blur(6px)", opacity: 0, scale: 0.94, transition: { duration: 0.22 } }}
      initial={{ filter: "blur(6px)", opacity: 0, scale: 0.94, y: 14 }}
      transition={{ delay: 0.06 + index * 0.08, duration: 0.55, ease: EASE }}
    >
      <Link
        aria-label={`آشنایی با ${service.name}`}
        className={cn(
          "group relative isolate block overflow-hidden rounded-[24px] ring-1 ring-white/12 shadow-[0_16px_32px_-18px_rgba(0,0,0,0.7)] transition-transform duration-200 active:scale-[0.97]",
          wide ? (lead ? "aspect-[16/10]" : "aspect-[16/8]") : "aspect-[4/5]",
        )}
        href={`/services/${encodeURIComponent(service.serviceId)}`}
      >
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin uploads served from /storage or the object gateway
          <img
            alt=""
            className="absolute inset-0 -z-10 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            decoding="async"
            onError={() => setFailed(true)}
            src={service.image ?? undefined}
          />
        ) : (
          <div aria-hidden className={cn("absolute inset-0 -z-10", FALLBACK_TONES[index % FALLBACK_TONES.length])}>
            <div className="bg-grain absolute inset-0 opacity-[0.1] mix-blend-overlay" />
            <Tractor
              className={cn(
                "absolute text-white/20",
                wide ? "top-1/2 left-6 size-28 -translate-y-1/2" : "top-6 left-1/2 size-20 -translate-x-1/2",
              )}
              strokeWidth={1.2}
            />
          </div>
        )}

        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(4,16,10,0.92)_0%,rgba(4,16,10,0.45)_42%,rgba(4,16,10,0)_72%)]"
        />

        <span className="absolute top-3 right-3 rounded-full bg-black/30 px-2 py-0.5 text-[10.5px] font-black tracking-wider text-white/90 ring-1 ring-white/15 backdrop-blur-md tabular-nums">
          {toPersianDigits(String(index + 1).padStart(2, "0"))}
        </span>

        <div className={cn("absolute inset-x-0 bottom-0 flex items-end gap-2", wide ? "p-4" : "p-3")}>
          <div className="min-w-0 flex-1">
            <span className="inline-block max-w-full truncate rounded-full bg-white/14 px-2 py-0.5 text-[10px] font-bold text-white/85 ring-1 ring-white/15 backdrop-blur-md">
              {service.category.name}
            </span>
            <p
              className={cn(
                "mt-1.5 font-black text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.4)]",
                wide ? "line-clamp-1 text-[17px] leading-7" : "line-clamp-2 text-[13.5px] leading-6",
              )}
            >
              {service.name}
            </p>
            {lead && service.description ? (
              <p className="mt-0.5 line-clamp-1 text-[11.5px] leading-5 text-white/65">{service.description}</p>
            ) : null}
          </div>
          <span
            className={cn(
              "flex shrink-0 items-center justify-center rounded-full bg-white text-[#123d2b] shadow-lg transition-transform duration-300 group-hover:-translate-x-0.5",
              wide ? "size-10" : "size-8",
            )}
          >
            <ArrowLeft className={wide ? "size-[18px]" : "size-4"} strokeWidth={2.4} />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
