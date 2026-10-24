"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { MotionConfig, motion } from "framer-motion";
import {
  Ban,
  BadgeCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  MapPin,
  MessageSquareQuote,
  Phone,
  RotateCw,
  Ruler,
  SearchX,
  UserPlus,
  Users,
} from "lucide-react";

import { CancelRequestSheet } from "@/components/consumer-panel/cancel-request-sheet";
import { ConsumerPageHero } from "@/components/consumer-panel/consumer-hero";
import { PageContainer } from "@/components/layout/page-container";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { MapPicker } from "@/components/shared/map-picker";
import { Skeleton } from "@/components/ui/skeleton";
import {
  cancelConsumerRequest,
  completeConsumerRequest,
  fetchConsumerRequest,
  type AppConsumerRequestDetail,
} from "@/lib/api/app-requests";
import { isApiClientError } from "@/lib/api/envelope";
import { CONSUMER_TONE_PILL, consumerRequestState } from "@/lib/requests/consumer-status";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils/date";
import { formatAreaSqm, formatDistance, toPersianDigits } from "@/lib/utils/format";
import { useAuthStore } from "@/stores/auth-store";
import type { GeoLocation } from "@/types";

const FULL = new Intl.NumberFormat("fa-IR");
const WORK_DATE = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { weekday: "long", month: "long", day: "numeric" });
const STAMP = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const PROVIDER_STATUS: Record<string, { label: string; className: string }> = {
  sent: { label: "منتظر پاسخ", className: "bg-[#fdebd3] text-[#9a4f12]" },
  rejected: { label: "نپذیرفت", className: "bg-[#fde2dc] text-[#b23a1f]" },
  accepted: { label: "پذیرفت", className: "bg-[#e1f0dc] text-[#2f6a35]" },
  removed: { label: "بسته شد", className: "bg-[#f1e6d6] text-[#8a6a48]" },
};

function landLocation(land: AppConsumerRequestDetail["land"]): GeoLocation | null {
  if (!land.latitude || !land.longitude) return null;
  return { lat: Number(land.latitude), lng: Number(land.longitude) };
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

function Section({ icon: Icon, title, children }: { icon: typeof MapPin; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[24px] bg-white p-4 shadow-[0_14px_30px_-22px_rgba(160,86,26,0.45)] ring-1 ring-[#efe0c8]">
      <h2 className="mb-3 flex items-center gap-2 text-[13.5px] font-black text-[#3b2410]">
        <span className="flex size-7 items-center justify-center rounded-lg bg-[#fdebd3] text-[#b9531f]">
          <Icon className="size-4" />
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function ConsumerRequestDetailContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const searchId = searchParams.get("searchId");
  const user = useAuthStore((state) => state.user);

  const [request, setRequest] = useState<AppConsumerRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelKey, setCancelKey] = useState(0);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    void fetchConsumerRequest(params.id, controller.signal)
      .then((detail) => {
        if (!controller.signal.aborted) setRequest(detail);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setRequest(null);
        if (!isApiClientError(cause) || cause.status !== 404) {
          toast.error(isApiClientError(cause) ? cause.message : "بارگذاری درخواست ناموفق بود");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [params.id, user, reloadKey]);

  const location = useMemo(() => (request ? landLocation(request.land) : null), [request]);
  const assigned = useMemo(
    () =>
      request?.providers.find((item) => item.providerId === request.assignedProviderId || item.status === "accepted") ??
      null,
    [request],
  );

  const reload = () => setReloadKey((key) => key + 1);

  const handleCancel = async (reason: string) => {
    if (!request) return false;
    try {
      await cancelConsumerRequest(request.requestId, { expectedVersion: request.version, reason });
      setCancelOpen(false);
      toast.success("درخواست لغو شد");
      reload();
      return true;
    } catch (cause: unknown) {
      toast.error(isApiClientError(cause) ? cause.message : "لغو درخواست ناموفق بود");
      return false;
    }
  };

  const handleComplete = async () => {
    if (!request) return;
    setCompleting(true);
    try {
      await completeConsumerRequest(request.requestId, { expectedVersion: request.version });
      setCompleteOpen(false);
      toast.success("کار با موفقیت پایان یافت", "از همراهی شما سپاسگزاریم");
      reload();
    } catch (cause: unknown) {
      toast.error(isApiClientError(cause) ? cause.message : "تأیید پایان کار ناموفق بود");
    } finally {
      setCompleting(false);
    }
  };

  if (!user) return null;

  if (loading && !request) {
    return (
      <PageContainer withDock className="px-0 pt-0">
        <ConsumerPageHero title="جزئیات درخواست" backHref="/users/requests" />
        <div className="relative z-10 -mt-4 space-y-3 px-4">
          <Skeleton className="h-40 rounded-[24px] bg-white/70" />
          <Skeleton className="h-28 rounded-[24px] bg-white/70" />
        </div>
      </PageContainer>
    );
  }

  if (!request) {
    return (
      <PageContainer withDock className="px-0 pt-0">
        <ConsumerPageHero title="جزئیات درخواست" backHref="/users/requests" />
        <div className="relative z-10 -mt-4 px-4">
          <div className="flex flex-col items-center rounded-[26px] bg-white px-6 py-10 text-center ring-1 ring-[#efe0c8]">
            <span className="flex size-14 items-center justify-center rounded-[20px] bg-[#fdebd3] text-[#b9531f]">
              <SearchX className="size-7" strokeWidth={1.75} />
            </span>
            <h2 className="mt-3 text-[15px] font-black text-[#3b2410]">درخواست پیدا نشد</h2>
          </div>
        </div>
      </PageContainer>
    );
  }

  const state = consumerRequestState(request.status);
  const backTab = request.status === "pending_provider" ? "" : `?tab=${request.status}`;
  const area = request.land.areaSquareMeters ? formatAreaSqm(Number(request.land.areaSquareMeters)) : null;
  const linkedProviders = request.providers.filter((item) => item.status !== "removed");
  const waitingCount = linkedProviders.filter((item) => item.status === "sent").length;
  const price = request.agreedPriceToman ?? assigned?.priceToman ?? null;

  const steps = [
    { label: "درخواست ثبت شد", at: request.createdAt, done: true, cancelled: false },
    { label: "خدمات‌دهنده پذیرفت", at: request.acceptedAt, done: Boolean(request.acceptedAt), cancelled: false },
    request.status === "cancelled"
      ? { label: "لغو شد", at: request.cancelledAt, done: true, cancelled: true }
      : { label: "کار انجام شد", at: request.completedAt, done: Boolean(request.completedAt), cancelled: false },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <PageContainer withDock className="px-0 pt-0">
        <ConsumerPageHero
          eyebrow={request.serviceCategoryName}
          title={request.serviceName}
          backHref={`/users/requests${backTab}`}
        >
          <div className="mt-5 rounded-[22px] bg-white/55 p-4 ring-1 ring-white/80 backdrop-blur-md">
            <div className="flex items-center justify-between gap-2">
              <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-black", CONSUMER_TONE_PILL[state.tone])}>
                {state.label}
              </span>
              <span className="text-[11px] text-[#8a6a48]">{formatRelativeTime(request.createdAt)}</span>
            </div>
            {price ? (
              <>
                <p className="mt-3 text-[11px] font-bold text-[#8a5a2b]">
                  {request.agreedPriceToman ? "مبلغ توافقی" : "قیمت اعلام‌شده خدمات‌دهنده"}
                </p>
                <p className="mt-0.5 flex items-baseline gap-1.5">
                  <span className="text-[28px] font-black leading-none tabular-nums">{FULL.format(price)}</span>
                  <span className="text-sm font-bold text-[#a0561a]">تومان</span>
                </p>
              </>
            ) : (
              <p className="mt-3 text-[12px] text-[#6b4a26]">قیمت پس از پذیرش خدمات‌دهنده مشخص می‌شود.</p>
            )}
          </div>
        </ConsumerPageHero>

        <div className="relative z-10 -mt-4 space-y-4 px-4 pt-1">
          {request.status === "pending_provider" ? (
            <Reveal>
              <section className="rounded-[24px] bg-[linear-gradient(150deg,#fff1df_0%,#ffffff_85%)] p-4 ring-1 ring-[#f3d3a8]">
                <div className="flex items-center gap-3">
                  <span className="relative flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#e8892c] text-white">
                    <Clock3 className="size-5" />
                    <span className="absolute -left-0.5 -top-0.5 size-3 animate-ping rounded-full bg-[#e8892c]/60" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[14px] font-black text-[#5c3410]">
                      منتظر پاسخ {toPersianDigits(waitingCount)} خدمات‌دهنده
                    </p>
                    <p className="text-[11.5px] text-[#8a6a48]">با اولین پذیرش، شماره تماس برایتان نمایش داده می‌شود.</p>
                  </div>
                </div>
                <div className="mt-3.5 grid grid-cols-[1fr_auto] gap-2">
                  <Link
                    href={searchId ? `/users/search/results?searchId=${searchId}&requestId=${request.requestId}` : "/users/search"}
                    className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-[#b9531f] text-[13px] font-black text-white"
                  >
                    <UserPlus className="size-4" />
                    {searchId ? "ارسال به خدمات‌دهندگان بیشتر" : "جستجوی دوباره"}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setCancelKey((key) => key + 1);
                      setCancelOpen(true);
                    }}
                    className="h-11 rounded-2xl bg-white px-4 text-[12.5px] font-bold text-[#b23a1f] ring-1 ring-[#f3c4b8]"
                  >
                    لغو
                  </button>
                </div>
              </section>
            </Reveal>
          ) : null}

          {request.status === "in_progress" ? (
            <Reveal>
              <section className="rounded-[24px] bg-[linear-gradient(150deg,#e1f0dc_0%,#ffffff_85%)] p-4 ring-1 ring-[#bfe0b4]">
                <p className="text-[11.5px] font-bold text-[#3f6b43]">خدمات‌دهنده شما</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#4f9a55] text-[17px] font-black text-white">
                    {(request.assignedProviderName ?? "؟").trim().charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-black text-[#1f4d26]">{request.assignedProviderName ?? "خدمات‌دهنده"}</p>
                    {assigned?.phone ? (
                      <p dir="ltr" className="text-right text-[12px] font-bold tabular-nums text-[#3f6b43]">
                        {toPersianDigits(assigned.phone)}
                      </p>
                    ) : null}
                  </div>
                  {assigned?.phone ? (
                    <a
                      href={`tel:${assigned.phone}`}
                      className="flex h-11 shrink-0 items-center gap-1.5 rounded-2xl bg-[#4f9a55] px-4 text-[13px] font-black text-white"
                    >
                      <Phone className="size-4" />
                      تماس
                    </a>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setCompleteOpen(true)}
                  className="mt-3.5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#2f6a35] text-[14px] font-black text-white shadow-[0_14px_28px_-14px_rgba(47,106,53,0.9)] transition active:scale-[0.98]"
                >
                  <CheckCircle2 className="size-5" />
                  کار انجام شد
                </button>
                <p className="mt-2 text-center text-[11px] text-[#5c7a5f]">پس از اتمام کار روی زمین، این دکمه را بزنید.</p>
              </section>
            </Reveal>
          ) : null}

          {request.status === "completed" ? (
            <Reveal>
              <section className="flex items-center gap-3 rounded-[24px] bg-[linear-gradient(150deg,#e1f0dc_0%,#ffffff_85%)] p-4 ring-1 ring-[#bfe0b4]">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#4f9a55] text-white">
                  <BadgeCheck className="size-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-black text-[#1f4d26]">کار با موفقیت انجام شد</p>
                  <p className="truncate text-[11.5px] text-[#3f6b43]">توسط {request.assignedProviderName ?? "خدمات‌دهنده"}</p>
                </div>
                <Link
                  href="/users/search"
                  className="flex h-10 shrink-0 items-center gap-1 rounded-2xl bg-white px-3 text-[12px] font-black text-[#2f6a35] ring-1 ring-[#bfe0b4]"
                >
                  <RotateCw className="size-3.5" />
                  درخواست دوباره
                </Link>
              </section>
            </Reveal>
          ) : null}

          <Reveal delay={0.05}>
            <section className="rounded-[24px] bg-white p-4 shadow-[0_14px_30px_-22px_rgba(160,86,26,0.45)] ring-1 ring-[#efe0c8]">
              <ol>
                {steps.map((step, index) => (
                  <li key={step.label} className="relative flex gap-3 pb-4 last:pb-0">
                    {index < steps.length - 1 ? (
                      <span
                        aria-hidden
                        className={cn(
                          "absolute right-[13px] top-7 h-[calc(100%-1.25rem)] w-0.5 rounded-full",
                          steps[index + 1]?.done ? "bg-[#4f9a55]/40" : "bg-[#f1e6d6]",
                        )}
                      />
                    ) : null}
                    <span
                      className={cn(
                        "relative flex size-7 shrink-0 items-center justify-center rounded-full",
                        step.cancelled
                          ? "bg-[#c2402a] text-white"
                          : step.done
                            ? "bg-[#4f9a55] text-white"
                            : "bg-[#f6ece0] text-[#b8a189]",
                      )}
                    >
                      {step.cancelled ? (
                        <Ban className="size-3.5" />
                      ) : step.done ? (
                        <Check className="size-3.5" strokeWidth={3} />
                      ) : (
                        <span className="size-1.5 rounded-full bg-current" />
                      )}
                    </span>
                    <div className="pt-0.5">
                      <p className={cn("text-[13px] font-bold", step.done ? "text-[#3b2410]" : "text-[#b8a189]")}>{step.label}</p>
                      {step.at ? <p className="mt-0.5 text-[11px] text-[#8a6a48]">{STAMP.format(new Date(step.at))}</p> : null}
                    </div>
                  </li>
                ))}
              </ol>
              {request.status === "cancelled" && request.cancelReason ? (
                <p className="mt-3 rounded-2xl bg-[#fde2dc]/60 px-3 py-2.5 text-[12px] leading-5 text-[#8a2a15]">
                  <span className="font-black">دلیل لغو: </span>
                  {request.cancelReason}
                </p>
              ) : null}
            </section>
          </Reveal>

          {request.status === "pending_provider" && linkedProviders.length > 0 ? (
            <Reveal delay={0.1}>
              <Section icon={Users} title="خدمات‌دهندگان این درخواست">
                <ul className="divide-y divide-[#f1e6d6]">
                  {linkedProviders.map((item) => {
                    const status = PROVIDER_STATUS[item.status] ?? PROVIDER_STATUS.removed!;
                    return (
                      <li key={item.providerId} className="flex items-center gap-3 py-2.5">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#fdebd3] text-[13px] font-black text-[#8a4512]">
                          {item.name.trim().charAt(0)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-bold text-[#3b2410]">{item.name}</p>
                          <p className="text-[11px] text-[#8a6a48]">
                            {formatDistance(item.distanceKm)} · {FULL.format(item.priceToman)} تومان
                          </p>
                        </div>
                        <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-black", status.className)}>
                          {status.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </Section>
            </Reveal>
          ) : null}

          {request.dates.length > 0 ? (
            <Reveal delay={0.15}>
              <Section icon={CalendarDays} title="روزهای مناسب برای انجام کار">
                <ul className="flex flex-wrap gap-2">
                  {[...request.dates].sort().map((date) => (
                    <li key={date} className="rounded-xl bg-[#fff1df] px-3 py-1.5 text-[12px] font-bold text-[#8a4512]">
                      {WORK_DATE.format(new Date(date))}
                    </li>
                  ))}
                </ul>
              </Section>
            </Reveal>
          ) : null}

          {request.consumerNote ? (
            <Reveal delay={0.18}>
              <Section icon={MessageSquareQuote} title="توضیح شما برای خدمات‌دهنده">
                <p className="text-[12.5px] leading-6 text-[#5c4120]">{request.consumerNote}</p>
              </Section>
            </Reveal>
          ) : null}

          <Reveal delay={0.2}>
            <Section icon={MapPin} title="زمین">
              <p className="text-[14px] font-black text-[#3b2410]">{request.land.title}</p>
              {area ? (
                <p className="mt-1 inline-flex items-center gap-1 rounded-lg bg-[#fcf7ee] px-2 py-1 text-[11px] font-bold text-[#6b4a26]">
                  <Ruler className="size-3" />
                  {area.primary} {area.primaryUnit}
                </p>
              ) : null}
              {location ? <MapPicker value={location} interactive={false} className="mt-3" /> : null}
            </Section>
          </Reveal>

          {request.status === "in_progress" ? (
            <button
              type="button"
              onClick={() => {
                setCancelKey((key) => key + 1);
                setCancelOpen(true);
              }}
              className="flex h-12 w-full items-center justify-center gap-1.5 rounded-2xl bg-white text-[13px] font-bold text-[#b23a1f] ring-1 ring-[#f3c4b8]"
            >
              <Ban className="size-4" />
              لغو این کار
            </button>
          ) : null}
        </div>

        <CancelRequestSheet
          open={cancelOpen}
          onOpenChange={setCancelOpen}
          serviceName={request.serviceName}
          reasonRequired={request.status === "in_progress"}
          formKey={cancelKey}
          onConfirm={handleCancel}
        />

        <ConfirmDialog
          open={completeOpen}
          onOpenChange={setCompleteOpen}
          title="پایان کار"
          description="آیا کار روی زمین شما انجام شده است؟ پس از تأیید، درخواست به «انجام‌شده» منتقل می‌شود."
          confirmLabel="بله، کار انجام شد"
          loading={completing}
          onConfirm={() => void handleComplete()}
        />
      </PageContainer>
    </MotionConfig>
  );
}

export default function ConsumerRequestDetailPage() {
  return (
    <Suspense>
      <ConsumerRequestDetailContent />
    </Suspense>
  );
}
