"use client";

import Link from "next/link";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { LandPlot, Maximize, Plus, Search, Trophy } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ConsumerPageHero, HARVEST_GLASS_BUTTON } from "@/components/consumer-panel/consumer-hero";
import { LandCard } from "@/components/consumer-panel/land-card";
import { PageContainer } from "@/components/layout/page-container";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { deleteAppLand, fetchAppLands, mapAppLandToUi } from "@/lib/api/app-lands";
import { isApiClientError } from "@/lib/api/envelope";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { formatAreaSqm, toPersianDigits } from "@/lib/utils/format";
import { useAuthStore } from "@/stores/auth-store";
import type { Land } from "@/types";

type SortKey = "newest" | "largest" | "name";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "جدیدترین" },
  { key: "largest", label: "بزرگ‌ترین" },
  { key: "name", label: "نام" },
];

/** Search and sort only earn their space once the list gets long. */
const TOOLS_MIN_LANDS = 4;

export default function ConsumerLandsPage() {
  const user = useAuthStore((state) => state.user);
  const [lands, setLands] = useState<Land[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Land | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");

  const loadLands = useCallback(
    (signal: AbortSignal) => {
      if (!user) return;

      void fetchAppLands({ limit: 50, signal })
        .then((result) => {
          if (signal.aborted) return;
          setLands(result.items.map((land) => mapAppLandToUi(land, user.id)));
        })
        .catch((cause: unknown) => {
          if (signal.aborted) return;
          setLands([]);
          toast.error(isApiClientError(cause) ? cause.message : "بارگذاری زمین‌ها ناموفق بود");
        })
        .finally(() => {
          if (!signal.aborted) setLoading(false);
        });
    },
    [user],
  );

  useEffect(() => {
    if (!user) return;

    const controller = new AbortController();
    loadLands(controller.signal);
    return () => controller.abort();
  }, [user, loadLands]);

  const stats = useMemo(() => {
    const totalArea = lands.reduce((sum, land) => sum + land.areaSqm, 0);
    const largest = lands.reduce<Land | null>(
      (best, land) => (land.areaSqm > (best?.areaSqm ?? -1) ? land : best),
      null,
    );
    return { totalArea: formatAreaSqm(totalArea), largest };
  }, [lands]);

  const visible = useMemo(() => {
    const term = query.trim();
    const filtered = term
      ? lands.filter((land) => land.title.includes(term) || (land.description ?? "").includes(term))
      : lands;
    return [...filtered].sort((a, b) => {
      if (sort === "largest") return b.areaSqm - a.areaSqm;
      if (sort === "name") return a.title.localeCompare(b.title, "fa");
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [lands, query, sort]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;

    setDeleting(true);
    try {
      await deleteAppLand(target.id);
      setLands((current) => current.filter((land) => land.id !== target.id));
      setDeleteTarget(null);
      toast.success("زمین حذف شد");
    } catch (cause: unknown) {
      toast.error(isApiClientError(cause) ? cause.message : "حذف زمین ناموفق بود");
    } finally {
      setDeleting(false);
    }
  };

  if (!user) return null;

  const largestArea = stats.largest ? formatAreaSqm(stats.largest.areaSqm) : null;

  return (
    <MotionConfig reducedMotion="user">
      <PageContainer withDock className="px-0 pt-0">
        <ConsumerPageHero
          title="زمین‌های من"
          subtitle="زمین‌هایتان را ثبت کنید تا خدمات‌دهندگان نزدیک را برایشان پیدا کنیم."
          actions={
            <Link href="/users/lands/new" aria-label="افزودن زمین" className={HARVEST_GLASS_BUTTON}>
              <Plus className="size-5" strokeWidth={2.25} />
            </Link>
          }
        >
          <dl className="mt-5 grid grid-cols-3 gap-2">
            {[
              { icon: LandPlot, label: "تعداد زمین", value: toPersianDigits(lands.length) },
              { icon: Maximize, label: "مساحت کل", value: `${stats.totalArea.primary} ${stats.totalArea.primaryUnit}` },
              {
                icon: Trophy,
                label: "بزرگ‌ترین",
                value: largestArea ? `${largestArea.primary} ${largestArea.primaryUnit}` : "—",
              },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="rounded-2xl bg-white/45 px-3 py-2.5 ring-1 ring-white/70 backdrop-blur-md">
                  <dt className="flex items-center gap-1 truncate text-[10.5px] font-bold text-[#8a5a2b]">
                    <Icon className="size-3.5 shrink-0" />
                    {stat.label}
                  </dt>
                  <dd className="mt-1 truncate text-[14px] font-black tabular-nums">{loading ? "…" : stat.value}</dd>
                </div>
              );
            })}
          </dl>
        </ConsumerPageHero>

        <div className="relative z-10 -mt-4 space-y-4 px-4 pt-1">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-64 rounded-[26px] bg-white/70" />
              <Skeleton className="h-64 rounded-[26px] bg-white/70" />
            </div>
          ) : lands.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center rounded-[28px] bg-white px-6 py-9 text-center shadow-[0_18px_40px_-24px_rgba(160,86,26,0.55)] ring-1 ring-[#efe0c8]"
            >
              <span className="relative flex size-20 items-center justify-center rounded-[26px] bg-gradient-to-br from-[#ffe2ad] to-[#f0a94f] text-[#7a4513]">
                <LandPlot className="size-10" strokeWidth={1.5} />
                <span className="absolute -left-1.5 -top-1.5 flex size-7 items-center justify-center rounded-full bg-[#b9531f] text-white ring-4 ring-white">
                  <Plus className="size-4" strokeWidth={3} />
                </span>
              </span>
              <h2 className="mt-5 text-[17px] font-black text-[#3b2410]">هنوز زمینی ثبت نکرده‌اید</h2>
              <p className="mt-1.5 max-w-72 text-[12px] leading-6 text-[#8a6a48]">
                موقعیت زمین را روی نقشه انتخاب و مساحت آن را وارد کنید؛ بعد می‌توانید برایش خدمت درخواست دهید.
              </p>
              <Link
                href="/users/lands/new"
                className="mt-6 inline-flex h-12 items-center gap-2 rounded-2xl bg-[#b9531f] px-7 text-[14px] font-black text-white shadow-[0_14px_28px_-14px_rgba(185,83,31,0.9)] transition active:scale-[0.98]"
              >
                <Plus className="size-5" strokeWidth={2.5} />
                ثبت اولین زمین
              </Link>
            </motion.div>
          ) : (
            <>
              <Link
                href="/users/lands/new"
                className="group flex items-center gap-3 rounded-[24px] border-2 border-dashed border-[#e3c9a3] bg-white/60 p-3.5 transition-colors hover:bg-white active:scale-[0.99]"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#b9531f] text-white shadow-[0_10px_20px_-10px_rgba(185,83,31,0.9)] transition-transform group-hover:rotate-90">
                  <Plus className="size-5" strokeWidth={2.5} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-black text-[#b9531f]">افزودن زمین جدید</span>
                  <span className="block text-[11.5px] text-[#8a6a48]">موقعیت را روی نقشه مشخص کنید</span>
                </span>
              </Link>

              {lands.length >= TOOLS_MIN_LANDS ? (
                <div className="space-y-2.5">
                  <div className="relative">
                    <Search className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-[#a08463]" />
                    <input
                      type="search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="جستجو در زمین‌ها"
                      className="h-11 w-full rounded-2xl bg-white pl-3 pr-10 text-[13px] outline-none ring-1 ring-[#efe0c8] transition focus:ring-2 focus:ring-[#e3b97f]"
                    />
                  </div>
                  <div className="flex gap-1.5" role="group" aria-label="مرتب‌سازی">
                    {SORTS.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        aria-pressed={sort === item.key}
                        onClick={() => setSort(item.key)}
                        className={cn(
                          "h-8 rounded-full px-3.5 text-[11.5px] font-bold transition-colors",
                          sort === item.key
                            ? "bg-[#3b2410] text-[#fff3dc]"
                            : "bg-white text-[#6b4a26] ring-1 ring-[#efe0c8] hover:bg-[#fff8ec]",
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {visible.length === 0 ? (
                <p className="rounded-[22px] bg-white/70 px-4 py-8 text-center text-[12px] text-[#8a6a48] ring-1 ring-[#efe0c8]">
                  زمینی با «{query}» پیدا نشد.
                </p>
              ) : (
                <ul className="space-y-4">
                  <AnimatePresence initial={false}>
                    {visible.map((land, index) => (
                      <motion.li
                        key={land.id}
                        layout
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.25), ease: [0.16, 1, 0.3, 1] }}
                      >
                        <LandCard land={land} onDelete={setDeleteTarget} />
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </>
          )}
        </div>

        <ConfirmDialog
          open={deleteTarget !== null}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title="حذف زمین"
          description={deleteTarget ? `«${deleteTarget.title}» از فهرست زمین‌های شما حذف می‌شود.` : ""}
          confirmLabel="حذف"
          variant="destructive"
          loading={deleting}
          onConfirm={() => void handleDelete()}
        />
      </PageContainer>
    </MotionConfig>
  );
}
