"use client";

import { motion, MotionConfig, type MotionValue, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  ArrowLeft,
  BookOpenText,
  ChevronRight,
  Clock3,
  FileText,
  LayoutGrid,
  Share2,
  Sparkles,
  Tractor,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { FieldHills } from "@/components/shared/field-hills";
import { ServiceThumb } from "@/components/shared/service-thumb";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils/date";
import { toPersianDigits } from "@/lib/utils/format";

const EASE = [0.16, 1, 0.3, 1] as const;
const HERO_HEIGHT = 440;

interface ServiceIntroScreenProps {
  category: { categoryId: string; image: string | null; name: string };
  /** The rendered rich text (server component), when the admin wrote one. */
  children?: React.ReactNode;
  description: string | null;
  hasDetails: boolean;
  image: string | null;
  isSpecial: boolean;
  name: string;
  readingMinutes: number | null;
  related: Array<{ image: string | null; name: string; serviceId: string }>;
  serviceId: string;
  updatedAt: string;
}

export function ServiceIntroScreen(props: ServiceIntroScreenProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll({ container: scroller });

  // Parallax on the picture, and a solid top bar once the hero has scrolled away.
  const heroY = useTransform(scrollY, [0, HERO_HEIGHT], [0, reduceMotion ? 0 : HERO_HEIGHT * 0.35]);
  const heroFade = useTransform(scrollY, [0, HERO_HEIGHT * 0.8], [1, reduceMotion ? 1 : 0.35]);
  const barOpacity = useTransform(scrollY, [HERO_HEIGHT - 170, HERO_HEIGHT - 90], [0, 1]);
  const titleY = useTransform(scrollY, [HERO_HEIGHT - 150, HERO_HEIGHT - 80], [8, 0]);

  return (
    <MotionConfig reducedMotion="user">
      <div
        className="relative flex h-0 min-h-0 flex-1 touch-pan-y flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain [&>*]:shrink-0"
        ref={scroller}
      >
        <TopBar barOpacity={barOpacity} name={props.name} titleY={titleY} />
        <Hero {...props} heroFade={heroFade} heroY={heroY} />
        <Sheet {...props} />
      </div>
    </MotionConfig>
  );
}

// ------------------------------------------------------------------ top bar

function TopBar({
  barOpacity,
  name,
  titleY,
}: {
  barOpacity: MotionValue<number>;
  name: string;
  titleY: MotionValue<number>;
}) {
  const router = useRouter();

  function goBack() {
    const cameFromApp = typeof document !== "undefined" && document.referrer.startsWith(window.location.origin);
    if (cameFromApp && window.history.length > 1) router.back();
    else router.push("/");
  }

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ text: `آشنایی با ${name} در اپلیکیشن کشاورز`, title: name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("پیوند صفحه کپی شد");
    } catch (error) {
      if ((error as DOMException)?.name !== "AbortError") toast.error("اشتراک‌گذاری ممکن نشد");
    }
  }

  // Glass over the picture, quiet tinted buttons once the bar turns solid.
  const buttonStyle = {
    backgroundColor: useTransform(barOpacity, [0, 1], ["rgba(0,0,0,0.28)", "rgba(26,46,26,0.06)"]),
    boxShadow: useTransform(barOpacity, [0, 1], ["0 0 0 1px rgba(255,255,255,0.22)", "0 0 0 1px rgba(26,46,26,0.08)"]),
    color: useTransform(barOpacity, [0, 1], ["#ffffff", "#1a2e1a"]),
  };
  const glass =
    "flex size-11 items-center justify-center rounded-full backdrop-blur-md transition-transform duration-200 active:scale-90";

  return (
    <div className="sticky top-0 z-30 h-0">
      <div className="absolute inset-x-0 top-0">
        <motion.div
          aria-hidden
          className="absolute inset-0 border-b border-border/70 bg-background/90 shadow-[0_8px_24px_-18px_rgba(26,46,26,0.5)] backdrop-blur-xl"
          style={{ opacity: barOpacity }}
        />
        <div className="relative flex items-center gap-3 px-4 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] pb-3">
          <motion.button aria-label="بازگشت" className={glass} onClick={goBack} style={buttonStyle} type="button">
            <ChevronRight className="size-[22px]" strokeWidth={2} />
          </motion.button>
          <motion.p
            aria-hidden
            className="min-w-0 flex-1 truncate text-center text-[15px] font-black text-foreground"
            style={{ opacity: barOpacity, y: titleY }}
          >
            {name}
          </motion.p>
          <motion.button
            aria-label="اشتراک‌گذاری"
            className={glass}
            onClick={() => void share()}
            style={buttonStyle}
            type="button"
          >
            <Share2 className="size-[19px]" strokeWidth={2} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------- hero

function Hero({
  category,
  description,
  heroFade,
  heroY,
  image,
  isSpecial,
  name,
}: ServiceIntroScreenProps & {
  heroFade: MotionValue<number>;
  heroY: MotionValue<number>;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(image) && !failed;

  return (
    <section className="relative isolate h-[min(62vh,440px)] min-h-[340px] overflow-hidden bg-[linear-gradient(165deg,#071d14_0%,#0f3324_45%,#1f5c41_100%)]">
      <motion.div className="absolute inset-0 -z-10" style={{ opacity: heroFade, y: heroY }}>
        {showImage ? (
          <motion.img
            alt=""
            animate={{ opacity: 1, scale: 1 }}
            className="size-full object-cover"
            decoding="async"
            initial={{ opacity: 0, scale: 1.08 }}
            onError={() => setFailed(true)}
            src={image ?? undefined}
            transition={{ duration: 1.1, ease: EASE }}
          />
        ) : (
          <div aria-hidden className="relative size-full">
            <div className="bg-grain absolute inset-0 opacity-[0.08] mix-blend-overlay" />
            <div className="absolute -top-24 -left-20 size-80 rounded-full bg-[radial-gradient(circle,rgba(255,209,128,0.4)_0%,rgba(244,162,97,0.12)_45%,transparent_70%)]" />
            <div className="absolute -right-16 top-16 size-64 rounded-full bg-[#40916c]/30 blur-3xl" />
            <div className="absolute inset-x-0 top-[26%] flex justify-center">
              <span className="flex size-28 items-center justify-center rounded-[34px] bg-gradient-to-br from-white/20 to-white/[0.04] text-white ring-1 ring-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_24px_48px_-16px_rgba(0,0,0,0.5)] backdrop-blur-sm">
                <Tractor className="size-14" strokeWidth={1.4} />
              </span>
            </div>
            <FieldHills className="absolute inset-x-0 bottom-0" />
          </div>
        )}
      </motion.div>

      {/* Legibility: a dark veil at the top for the buttons, a deep one at the bottom for the title. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/45 to-transparent" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[72%] bg-[linear-gradient(0deg,rgba(5,20,13,0.94)_0%,rgba(7,29,20,0.72)_38%,rgba(7,29,20,0)_100%)]"
      />

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="absolute inset-x-0 bottom-0 px-5 pb-12 text-white"
        initial={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.15, duration: 0.6, ease: EASE }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/14 py-1 pr-1 pl-3 text-[11.5px] font-bold text-white ring-1 ring-white/20 backdrop-blur-md">
            <ServiceThumb
              className="size-5 rounded-full ring-white/30"
              fallback={
                <span className="flex size-5 items-center justify-center rounded-full bg-white/20">
                  <LayoutGrid className="size-3" />
                </span>
              }
              image={category.image}
              name=""
            />
            {category.name}
          </span>
          {isSpecial ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#f4a261] px-2.5 py-1 text-[11px] font-black text-[#3d2914] shadow-[0_6px_16px_-6px_rgba(244,162,97,0.8)]">
              <Sparkles className="size-3.5" />
              ادوات ویژه
            </span>
          ) : null}
        </div>
        <h1 className="mt-3 text-[28px] leading-[1.35] font-black tracking-tight text-balance drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]">
          {name}
        </h1>
        {description ? (
          <p className="mt-2 line-clamp-3 text-[13.5px] leading-7 text-white/78">{description}</p>
        ) : null}
      </motion.div>
    </section>
  );
}

// -------------------------------------------------------------------- sheet

function Fact({
  icon,
  label,
  tone,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  tone: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col justify-between gap-2 rounded-[20px] bg-surface p-3 shadow-[0_6px_18px_-12px_rgba(45,106,79,0.35)] ring-1 ring-border/60">
      <span className={cn("flex size-9 items-center justify-center rounded-xl [&_svg]:size-[18px]", tone)}>{icon}</span>
      <div className="min-w-0">
        <p className="text-[10.5px] font-semibold text-muted-foreground">{label}</p>
        <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-5 font-black text-foreground">{value}</p>
      </div>
    </div>
  );
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      transition={{ delay, duration: 0.5, ease: EASE }}
      viewport={{ margin: "0px 0px -40px 0px", once: true }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      {children}
    </motion.div>
  );
}

function Sheet({
  category,
  children,
  hasDetails,
  name,
  readingMinutes,
  related,
  serviceId,
  updatedAt,
}: ServiceIntroScreenProps) {
  const searchHref = `/users/search?service=${encodeURIComponent(serviceId)}&category=${encodeURIComponent(category.categoryId)}`;

  return (
    <>
      <div className="relative z-10 -mt-7 flex flex-1 flex-col rounded-t-[30px] bg-background px-5 pt-3 shadow-[0_-12px_30px_-20px_rgba(0,0,0,0.5)]">
        <span aria-hidden className="mx-auto mb-5 h-1.5 w-11 rounded-full bg-foreground/10" />

        <Reveal delay={0.1}>
          <div className="grid grid-cols-3 gap-2.5">
            <Fact icon={<LayoutGrid />} label="دسته‌بندی" tone="bg-[#d8f3dc] text-[#2d6a4f]" value={category.name} />
            <Fact
              icon={<Clock3 />}
              label="زمان مطالعه"
              tone="bg-[#fdefd6] text-[#b4661a]"
              value={readingMinutes ? `${toPersianDigits(String(readingMinutes))} دقیقه` : "—"}
            />
            <Fact
              icon={<BookOpenText />}
              label="به‌روزرسانی"
              tone="bg-[#e3eefc] text-[#2f5d9a]"
              value={<span suppressHydrationWarning>{formatRelativeTime(updatedAt)}</span>}
            />
          </div>
        </Reveal>

        <Reveal delay={0.18}>
          <section aria-labelledby="intro-title" className="mt-7">
            <h2 className="flex items-center gap-2 text-[17px] font-black text-foreground" id="intro-title">
              <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileText className="size-[17px]" />
              </span>
              معرفی کامل
            </h2>
            {hasDetails ? (
              <article className="mt-4">{children}</article>
            ) : (
              <div className="mt-4 flex flex-col items-center gap-3 rounded-[24px] border border-dashed border-border bg-surface/60 px-6 py-9 text-center">
                <span className="flex size-14 items-center justify-center rounded-[18px] bg-[#fdefd6] text-[#b4661a]">
                  <BookOpenText className="size-7" strokeWidth={1.7} />
                </span>
                <p className="text-[14px] font-bold text-foreground">توضیحات کامل به‌زودی</p>
                <p className="text-[12.5px] leading-6 text-muted-foreground">
                  معرفی جامع {name} در حال آماده شدن است. تا آن موقع می‌توانید خدمات‌دهندگان این خدمت را پیدا کنید.
                </p>
              </div>
            )}
          </section>
        </Reveal>

        {related.length > 0 ? (
          <Reveal>
            <section aria-labelledby="related-title" className="mt-9">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-[15px] font-black text-foreground" id="related-title">
                  ادوات دیگر در «{category.name}»
                </h2>
              </div>
              <ul className="no-scrollbar -mx-5 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 pb-2">
                {related.map((item) => (
                  <li className="snap-start" key={item.serviceId}>
                    <Link
                      className="group flex w-[132px] flex-col gap-2 rounded-[22px] bg-surface p-2 shadow-[0_6px_18px_-12px_rgba(45,106,79,0.35)] ring-1 ring-border/60 transition-transform duration-200 active:scale-95"
                      href={`/services/${encodeURIComponent(item.serviceId)}`}
                    >
                      <ServiceThumb
                        className="aspect-square size-auto w-full rounded-[16px]"
                        fallback={
                          <span className="flex aspect-square w-full items-center justify-center rounded-[16px] bg-[linear-gradient(150deg,#e7f1e2,#cfe6d3)] text-[#2d6a4f]">
                            <Tractor className="size-9" strokeWidth={1.5} />
                          </span>
                        }
                        image={item.image}
                        name=""
                      />
                      <span className="line-clamp-2 min-h-10 px-1 text-[12px] leading-5 font-bold text-foreground">
                        {item.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </Reveal>
        ) : null}

        <div className="h-28" />
      </div>

      {/* Primary action, pinned to the bottom of the scroll area. */}
      <div className="sticky bottom-0 z-20 -mt-24 bg-gradient-to-t from-background via-background/95 to-transparent px-4 pt-6 pb-[calc(env(safe-area-inset-bottom,0px)+0.9rem)]">
        <Link
          className="group relative flex h-[58px] items-center justify-between gap-3 overflow-hidden rounded-[20px] bg-[linear-gradient(135deg,#123d2b_0%,#1f5c41_55%,#2d7a55_100%)] pr-5 pl-2 text-white shadow-[0_18px_36px_-16px_rgba(18,61,43,0.85)] ring-1 ring-white/10 transition-transform duration-200 active:scale-[0.98]"
          href={searchHref}
        >
          <span aria-hidden className="absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-20deg] bg-white/10 blur-md transition-transform duration-700 group-hover:translate-x-[420%]" />
          <span className="min-w-0">
            <span className="block text-[15px] font-black">درخواست این خدمت</span>
            <span className="block truncate text-[11px] font-medium text-white/65">خدمات‌دهندگان نزدیک زمین شما</span>
          </span>
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#1f5c41] transition-transform duration-300 group-active:-translate-x-0.5">
            <ArrowLeft className="size-5" strokeWidth={2.2} />
          </span>
        </Link>
      </div>
    </>
  );
}
