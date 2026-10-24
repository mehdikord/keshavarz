"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MotionConfig, motion } from "framer-motion";
import {
  ArrowLeft,
  ChartNoAxesColumn,
  ClipboardCheck,
  Coins,
  LandPlot,
  RotateCw,
  Sprout,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";

import { ConsumerPageHero } from "@/components/consumer-panel/consumer-hero";
import { PageContainer } from "@/components/layout/page-container";
import { MonthlyBarChart, type MonthRow } from "@/components/shared/monthly-bar-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAppLands, type AppLand } from "@/lib/api/app-lands";
import {
  fetchConsumerFinancialSummary,
  fetchConsumerMonthlyCosts,
  type AppConsumerFinancialSummary,
} from "@/lib/api/app-reports";
import { isApiClientError } from "@/lib/api/envelope";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import { formatAreaSqm, toPersianDigits } from "@/lib/utils/format";

const DAY_MS = 86_400_000;
/** The per-land breakdown issues one request per land, so keep it bounded. */
const MAX_BREAKDOWN_LANDS = 8;

const RANGES = [
  { key: "30d", label: "۳۰ روز", caption: "۳۰ روز اخیر", days: 30 },
  { key: "90d", label: "۳ ماه", caption: "۳ ماه اخیر", days: 90 },
  { key: "180d", label: "۶ ماه", caption: "۶ ماه اخیر", days: 180 },
  { key: "365d", label: "یک سال", caption: "یک سال اخیر", days: 365 },
] as const;

type RangeKey = (typeof RANGES)[number]["key"];

const FULL = new Intl.NumberFormat("fa-IR");
const COMPACT = new Intl.NumberFormat("fa-IR", { notation: "compact", maximumFractionDigits: 1 });

interface LandCost {
  landId: string;
  title: string;
  totalToman: number;
  completedCount: number;
}

interface RangeData {
  key: string;
  current: AppConsumerFinancialSummary;
  previous: AppConsumerFinancialSummary;
  perLand: LandCost[];
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** The API buckets by calendar year; stitch two years into the trailing 12 months. */
function lastTwelveMonths(byYear: Array<{ year: number; months: Omit<MonthRow, "year">[] }>): MonthRow[] {
  const all = byYear.flatMap(({ year, months }) => months.map((row) => ({ ...row, year })));
  const now = new Date();
  const endKey = now.getFullYear() * 12 + now.getMonth();
  return all
    .filter((row) => {
      const key = row.year * 12 + (row.month - 1);
      return key <= endKey && key > endKey - 12;
    })
    .sort((a, b) => a.year * 12 + a.month - (b.year * 12 + b.month));
}

export default function ConsumerReportsPage() {
  const user = useAuthStore((state) => state.user);
  const [rangeKey, setRangeKey] = useState<RangeKey>("90d");
  const [landFilter, setLandFilter] = useState<string>("all");
  const [lands, setLands] = useState<AppLand[]>([]);
  const [monthly, setMonthly] = useState<MonthRow[]>([]);
  const [monthlyKey, setMonthlyKey] = useState<string | null>(null);
  const [rangeData, setRangeData] = useState<RangeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const range = RANGES.find((item) => item.key === rangeKey) ?? RANGES[1];
  const landId = landFilter === "all" ? undefined : landFilter;
  const requestKey = `${rangeKey}:${landFilter}:${reloadKey}`;

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    void fetchAppLands({ limit: 50, signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setLands(result.items);
      })
      .catch(() => undefined); // The land filter is optional.
    return () => controller.abort();
  }, [user]);

  // Trailing 12 months for the chart; depends only on the land filter.
  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    const year = new Date().getFullYear();
    const key = `${landFilter}:${reloadKey}`;
    Promise.all([
      fetchConsumerMonthlyCosts({ landId, year: year - 1, signal: controller.signal }),
      fetchConsumerMonthlyCosts({ landId, year, signal: controller.signal }),
    ])
      .then((years) => {
        if (controller.signal.aborted) return;
        setMonthly(lastTwelveMonths(years));
        setMonthlyKey(key);
      })
      .catch(() => {
        if (!controller.signal.aborted) setMonthlyKey(key);
      });
    return () => controller.abort();
  }, [user, landId, landFilter, reloadKey]);

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    const to = new Date();
    const from = new Date(to.getTime() - range.days * DAY_MS);
    const previousFrom = new Date(from.getTime() - range.days * DAY_MS);
    const breakdownLands = landId ? [] : lands.slice(0, MAX_BREAKDOWN_LANDS);

    Promise.all([
      fetchConsumerFinancialSummary({ from: from.toISOString(), to: to.toISOString(), landId, signal: controller.signal }),
      fetchConsumerFinancialSummary({ from: previousFrom.toISOString(), to: from.toISOString(), landId, signal: controller.signal }),
      Promise.all(
        breakdownLands.map((land) =>
          fetchConsumerFinancialSummary({
            from: from.toISOString(),
            to: to.toISOString(),
            landId: land.landId,
            signal: controller.signal,
          }).then((summary) => ({
            landId: land.landId,
            title: land.title,
            totalToman: summary.totalCostToman,
            completedCount: summary.completedCount,
          })),
        ),
      ),
    ])
      .then(([current, previous, perLand]) => {
        if (controller.signal.aborted) return;
        setRangeData({ key: requestKey, current, previous, perLand });
        setError(null);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(isApiClientError(cause) ? cause.message : "بارگذاری گزارش‌ها ناموفق بود");
      });
    return () => controller.abort();
  }, [user, range.days, landId, lands, requestKey]);

  const selectedLand = lands.find((land) => land.landId === landFilter) ?? null;
  const totalAreaSqm = useMemo(
    () => (selectedLand ? [selectedLand] : lands).reduce((sum, land) => sum + Number(land.areaSquareMeters), 0),
    [lands, selectedLand],
  );

  if (!user) return null;

  const loading = rangeData === null && !error;
  const rangeLoading = rangeData?.key !== requestKey;
  const current = rangeData?.current;
  const total = current?.totalCostToman ?? 0;
  const count = current?.completedCount ?? 0;
  const average = count > 0 ? Math.round(total / count) : 0;
  const hectares = totalAreaSqm / 10_000;
  const perHectare = hectares >= 0.1 && total > 0 ? Math.round(total / hectares) : 0;
  const previousTotal = rangeData?.previous.totalCostToman ?? 0;
  const change = previousTotal > 0 ? Math.round(((total - previousTotal) / previousTotal) * 100) : null;
  const monthlyLoading = monthlyKey !== `${landFilter}:${reloadKey}`;
  const hasMonthlyCost = monthly.some((row) => row.totalToman > 0);
  const hasAnyCost = total > 0 || hasMonthlyCost;
  const landRows = (rangeData?.perLand ?? []).filter((row) => row.totalToman > 0).sort((a, b) => b.totalToman - a.totalToman);
  const landMax = landRows[0]?.totalToman ?? 0;
  const landSum = landRows.reduce((sum, row) => sum + row.totalToman, 0);

  return (
    <MotionConfig reducedMotion="user">
      <PageContainer withDock className="px-0 pt-0">
        <ConsumerPageHero title="گزارش هزینه‌ها" subtitle="ببینید هزینه خدمات کشاورزی زمین‌هایتان چطور پیش می‌رود.">
          {!error ? (
            <div className="mt-5 rounded-[22px] bg-white/55 p-4 ring-1 ring-white/80 backdrop-blur-md">
              <div role="tablist" aria-label="بازه زمانی" className="grid grid-cols-4 gap-1 rounded-2xl bg-[#3b2410]/10 p-1">
                {RANGES.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    role="tab"
                    aria-selected={item.key === rangeKey}
                    onClick={() => setRangeKey(item.key)}
                    className={cn(
                      "relative h-9 rounded-xl text-[12px] font-bold transition-colors",
                      item.key === rangeKey ? "text-white" : "text-[#6b4a26] hover:text-[#3b2410]",
                    )}
                  >
                    {item.key === rangeKey ? (
                      <motion.span
                        layoutId="consumer-report-range"
                        className="absolute inset-0 rounded-xl bg-[#b9531f] shadow-sm"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    ) : null}
                    <span className="relative">{item.label}</span>
                  </button>
                ))}
              </div>

              <p className="mt-4 text-[11.5px] font-bold text-[#8a5a2b]">
                هزینه {range.caption}
                {selectedLand ? ` · ${selectedLand.title}` : ""}
              </p>
              {loading ? (
                <div className="mt-2 h-10 w-48 animate-pulse rounded-xl bg-white/70" />
              ) : (
                <div className={cn("transition-opacity", rangeLoading && "opacity-60")}>
                  <p className="mt-1 flex items-baseline gap-2">
                    <span className="text-[34px] font-black leading-none tracking-tight tabular-nums">{FULL.format(total)}</span>
                    <span className="text-sm font-bold text-[#a0561a]">تومان</span>
                  </p>
                  {change !== null ? (
                    <p
                      className={cn(
                        "mt-2.5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black",
                        // For costs, spending less than before is the good direction.
                        change <= 0 ? "bg-[#e1f0dc] text-[#2f6a35]" : "bg-[#fde2dc] text-[#b23a1f]",
                      )}
                    >
                      {change <= 0 ? <TrendingDown className="size-3.5" /> : <TrendingUp className="size-3.5" />}
                      {toPersianDigits(Math.abs(change))}٪ {change <= 0 ? "کمتر" : "بیشتر"} از دوره قبل
                    </p>
                  ) : (
                    <p className="mt-2.5 text-[11px] text-[#8a6a48]">داده‌ای برای مقایسه با دوره قبل نیست</p>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </ConsumerPageHero>

        <div className="relative z-10 -mt-4 space-y-4 px-4 pt-1">
          {error ? (
            <div className="flex flex-col items-center gap-3 rounded-[24px] bg-white px-6 py-10 text-center ring-1 ring-[#efe0c8]">
              <p className="text-sm text-[#8a6a48]">{error}</p>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setRangeData(null);
                  setReloadKey((key) => key + 1);
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#b9531f] px-4 py-2 text-xs font-bold text-white"
              >
                <RotateCw className="size-3.5" />
                تلاش مجدد
              </button>
            </div>
          ) : (
            <>
              {lands.length > 1 ? (
                <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" role="group" aria-label="فیلتر زمین">
                  {[{ landId: "all", title: "همه زمین‌ها" }, ...lands].map((land) => {
                    const active = landFilter === land.landId;
                    return (
                      <button
                        key={land.landId}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setLandFilter(land.landId)}
                        className={cn(
                          "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-[12px] font-bold transition-colors",
                          active ? "bg-[#3b2410] text-[#fff3dc]" : "bg-white text-[#6b4a26] ring-1 ring-[#efe0c8]",
                        )}
                      >
                        {land.landId !== "all" ? <LandPlot className="size-3.5" /> : null}
                        {land.title}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-24 rounded-[22px] bg-white/70" />
                  <Skeleton className="h-72 rounded-[26px] bg-white/70" />
                </div>
              ) : (
                <>
                  <Reveal>
                    <section aria-label="شاخص‌ها" className="grid grid-cols-3 gap-2">
                      {[
                        { icon: ClipboardCheck, label: "خدمت دریافت‌شده", value: toPersianDigits(count), tone: "bg-[#e1f0dc] text-[#2f6a35]" },
                        { icon: Coins, label: "میانگین هر خدمت", value: average > 0 ? COMPACT.format(average) : "۰", tone: "bg-[#fdebd3] text-[#b9531f]" },
                        { icon: Sprout, label: "هزینه هر هکتار", value: perHectare > 0 ? COMPACT.format(perHectare) : "—", tone: "bg-[#e6f3fb] text-sky-700" },
                      ].map((tile) => {
                        const Icon = tile.icon;
                        return (
                          <div
                            key={tile.label}
                            className={cn(
                              "rounded-[22px] bg-white p-3 shadow-[0_14px_30px_-22px_rgba(160,86,26,0.45)] ring-1 ring-[#efe0c8] transition-opacity",
                              rangeLoading && "opacity-60",
                            )}
                          >
                            <span className={cn("flex size-9 items-center justify-center rounded-xl", tile.tone)}>
                              <Icon className="size-[18px]" />
                            </span>
                            <p className="mt-2.5 text-[17px] font-black leading-none tabular-nums text-[#3b2410]">{tile.value}</p>
                            <p className="mt-1 text-[10.5px] font-bold text-[#a08463]">{tile.label}</p>
                          </div>
                        );
                      })}
                    </section>
                  </Reveal>

                  {!hasAnyCost && !rangeLoading && !monthlyLoading ? (
                    <Reveal delay={0.06}>
                      <div className="flex flex-col items-center rounded-[26px] border-2 border-dashed border-[#ecd9bd] bg-white/60 px-6 py-9 text-center">
                        <span className="flex size-14 items-center justify-center rounded-[20px] bg-[#fdebd3] text-[#b9531f]">
                          <ChartNoAxesColumn className="size-7" strokeWidth={1.75} />
                        </span>
                        <h2 className="mt-3 text-[15px] font-black text-[#3b2410]">هنوز هزینه‌ای ثبت نشده</h2>
                        <p className="mt-1 max-w-72 text-[12px] leading-6 text-[#8a6a48]">
                          وقتی کاری را «انجام شد» اعلام کنید، هزینه آن در این گزارش‌ها نمایش داده می‌شود.
                        </p>
                        <Link
                          href="/users/search"
                          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#fdebd3] px-4 py-2 text-[12px] font-bold text-[#a0561a]"
                        >
                          جستجوی خدمات
                          <ArrowLeft className="size-3.5" />
                        </Link>
                      </div>
                    </Reveal>
                  ) : (
                    <>
                      {monthlyLoading ? (
                        <Skeleton className="h-72 rounded-[26px] bg-white/70" />
                      ) : hasMonthlyCost ? (
                        <Reveal delay={0.06}>
                          <MonthlyBarChart
                            months={monthly}
                            title="هزینه ماه‌به‌ماه"
                            countLabel="خدمت دریافت‌شده"
                            tone="harvest"
                          />
                        </Reveal>
                      ) : null}

                      {current?.topService || (!selectedLand && current?.topLand) ? (
                        <Reveal delay={0.12}>
                          <section aria-label="نکات برجسته" className="grid grid-cols-2 gap-2">
                            <div className="rounded-[22px] bg-[linear-gradient(150deg,#fff1df_0%,#ffffff_80%)] p-3.5 ring-1 ring-[#f3d3a8]">
                              <p className="flex items-center gap-1.5 text-[11px] font-bold text-[#9a4f12]">
                                <Trophy className="size-3.5" />
                                پرهزینه‌ترین خدمت
                              </p>
                              <p className="mt-1.5 truncate text-[13.5px] font-black text-[#3b2410]">{current?.topService?.name ?? "—"}</p>
                              {current?.topService ? (
                                <p className="mt-0.5 text-[11px] tabular-nums text-[#8a6a48]">
                                  {FULL.format(current.topService.totalToman)} تومان
                                </p>
                              ) : null}
                            </div>
                            <div className="rounded-[22px] bg-[linear-gradient(150deg,#eef6e6_0%,#ffffff_80%)] p-3.5 ring-1 ring-[#cfe5c2]">
                              <p className="flex items-center gap-1.5 text-[11px] font-bold text-[#2f6a35]">
                                <LandPlot className="size-3.5" />
                                {selectedLand ? "مساحت زمین" : "پرهزینه‌ترین زمین"}
                              </p>
                              <p className="mt-1.5 truncate text-[13.5px] font-black text-[#3b2410]">
                                {selectedLand
                                  ? `${formatAreaSqm(Number(selectedLand.areaSquareMeters)).primary} ${formatAreaSqm(Number(selectedLand.areaSquareMeters)).primaryUnit}`
                                  : (current?.topLand?.title ?? "—")}
                              </p>
                              {!selectedLand && current?.topLand ? (
                                <p className="mt-0.5 text-[11px] tabular-nums text-[#8a6a48]">
                                  {FULL.format(current.topLand.totalToman)} تومان
                                </p>
                              ) : null}
                            </div>
                          </section>
                        </Reveal>
                      ) : null}

                      {!selectedLand && landRows.length > 1 ? (
                        <Reveal delay={0.18}>
                          <section className="rounded-[26px] bg-white p-4 shadow-[0_14px_30px_-22px_rgba(160,86,26,0.45)] ring-1 ring-[#efe0c8]">
                            <h2 className="text-[14px] font-black text-[#3b2410]">سهم هر زمین از هزینه</h2>
                            <p className="mt-0.5 text-[11px] text-[#8a6a48]">در {range.caption} · برای جزئیات روی زمین بزنید</p>
                            <ul className="mt-4 space-y-3.5">
                              {landRows.map((row) => (
                                <li key={row.landId}>
                                  <button
                                    type="button"
                                    onClick={() => setLandFilter(row.landId)}
                                    className="flex w-full items-center gap-2.5 text-right"
                                  >
                                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#fdebd3] text-[#a0561a]">
                                      <LandPlot className="size-4" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                      <span className="flex items-baseline justify-between gap-2">
                                        <span className="truncate text-[12.5px] font-bold text-[#3b2410]">{row.title}</span>
                                        <span className="shrink-0 text-[12px] font-black tabular-nums text-[#3b2410]">
                                          {toPersianDigits(landSum > 0 ? Math.round((row.totalToman / landSum) * 100) : 0)}٪
                                        </span>
                                      </span>
                                      <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-[#f6ece0]">
                                        <span
                                          className="block h-full rounded-full bg-[#b9531f]"
                                          style={{ width: `${landMax > 0 ? Math.max(3, (row.totalToman / landMax) * 100) : 0}%` }}
                                        />
                                      </span>
                                      <span className="mt-1 block text-[10.5px] text-[#8a6a48]">
                                        {FULL.format(row.totalToman)} تومان، {toPersianDigits(row.completedCount)} خدمت
                                      </span>
                                    </span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </section>
                        </Reveal>
                      ) : null}
                    </>
                  )}

                  <p className="px-2 text-center text-[10.5px] leading-5 text-[#a08463]">
                    گزارش‌ها فقط کارهایی را شامل می‌شوند که شما «انجام شد» اعلام کرده‌اید.
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </PageContainer>
    </MotionConfig>
  );
}
