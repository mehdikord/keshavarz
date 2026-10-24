"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MotionConfig, motion } from "framer-motion";
import {
  Ban,
  CalendarDays,
  Check,
  Lock,
  MapPin,
  MessageSquareQuote,
  Navigation,
  Phone,
  Ruler,
  SearchX,
  UserRound,
  X,
} from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { ProviderPageHero } from "@/components/providers-panel/provider-page-hero";
import {
  RequestActionSheet,
  type RequestAction,
} from "@/components/providers-panel/requests/request-action-sheet";
import { TONE_PILL } from "@/components/providers-panel/requests/request-card";
import { MapPicker } from "@/components/shared/map-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { canShowPhone } from "@/lib/contact-privacy";
import { isApiClientError } from "@/lib/api/envelope";
import {
  acceptProviderRequest,
  cancelProviderRequest,
  fetchProviderRequest,
  rejectProviderRequest,
  viewProviderRequest,
  type AppProviderRequestDetail,
} from "@/lib/api/app-requests";
import { classifyProviderRequest } from "@/lib/requests/provider-tabs";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils/date";
import { formatAreaSqm, formatDistance, toPersianDigits } from "@/lib/utils/format";
import type { GeoLocation, RequestStatus } from "@/types";

const WORK_DATE = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

const STAMP = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function landToLocation(land: AppProviderRequestDetail["land"]): GeoLocation | null {
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

function SectionCard({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: typeof MapPin;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[24px] bg-surface p-4 shadow-[0_14px_30px_-22px_rgba(45,106,79,0.5)] ring-1 ring-border/60",
        className,
      )}
    >
      <h2 className="mb-3 flex items-center gap-2 text-[13.5px] font-black text-foreground">
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function ProviderRequestDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [detail, setDetail] = useState<AppProviderRequestDetail | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "not_found">("loading");
  const [action, setAction] = useState<RequestAction>("accept");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetKey, setSheetKey] = useState(0);
  const viewedRef = useRef(false);

  const reloadDetail = useCallback(
    (signal?: AbortSignal) => fetchProviderRequest(params.id, signal),
    [params.id],
  );

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    viewedRef.current = false;

    void (async () => {
      try {
        const nextDetail = await reloadDetail(controller.signal);
        if (cancelled) return;

        setDetail(nextDetail);
        setLoadState("ready");

        if (!viewedRef.current && nextDetail.linkStatus === "sent" && !nextDetail.viewedAt) {
          viewedRef.current = true;
          try {
            await viewProviderRequest(nextDetail.requestId);
            const refreshed = await reloadDetail(controller.signal);
            if (!cancelled) setDetail(refreshed);
          } catch {
            // Non-blocking: viewing is best-effort.
          }
        }
      } catch (cause: unknown) {
        if (cancelled || controller.signal.aborted) return;

        if (!(isApiClientError(cause) && cause.status === 404)) {
          toast.error(
            isApiClientError(cause) ? cause.message : "بارگذاری جزئیات درخواست ناموفق بود.",
          );
        }
        setLoadState("not_found");
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [reloadDetail]);

  const landLocation = useMemo(() => (detail ? landToLocation(detail.land) : null), [detail]);

  const openAction = (next: RequestAction) => {
    setAction(next);
    setSheetKey((key) => key + 1);
    setSheetOpen(true);
  };

  const handleConfirm = async (reason?: string) => {
    if (!detail) return false;

    try {
      if (action === "accept") {
        await acceptProviderRequest(detail.requestId, { expectedVersion: detail.version });
        toast.success("درخواست پذیرفته شد", "اکنون می‌توانید با کشاورز تماس بگیرید");
      } else if (action === "reject") {
        await rejectProviderRequest(detail.requestId, { expectedVersion: detail.version, reason });
        toast.info("درخواست رد شد");
      } else {
        await cancelProviderRequest(detail.requestId, { expectedVersion: detail.version, reason });
        toast.success("کار لغو شد");
      }
      setSheetOpen(false);
      if (action === "reject") {
        router.push("/providers/requests");
      } else {
        setDetail(await reloadDetail());
      }
      return true;
    } catch (cause: unknown) {
      toast.error(isApiClientError(cause) ? cause.message : "انجام عملیات ناموفق بود.");
      void reloadDetail().then(setDetail).catch(() => undefined);
      return false;
    }
  };

  if (loadState === "loading") {
    return (
      <PageContainer withDock className="px-0 pt-0">
        <ProviderPageHero title="جزئیات درخواست" backHref="/providers/requests" />
        <div className="relative z-10 -mt-4 space-y-3 px-4">
          <Skeleton className="h-32 rounded-[24px]" />
          <Skeleton className="h-24 rounded-[24px]" />
          <Skeleton className="h-64 rounded-[24px]" />
        </div>
      </PageContainer>
    );
  }

  if (loadState === "not_found" || !detail) {
    return (
      <PageContainer withDock className="px-0 pt-0">
        <ProviderPageHero title="جزئیات درخواست" backHref="/providers/requests" />
        <div className="relative z-10 -mt-4 px-4">
          <div className="flex flex-col items-center rounded-[26px] bg-surface px-6 py-10 text-center ring-1 ring-border/60">
            <span className="flex size-14 items-center justify-center rounded-[20px] bg-muted text-muted-foreground">
              <SearchX className="size-7" strokeWidth={1.75} />
            </span>
            <h2 className="mt-3 text-[15px] font-black">درخواست پیدا نشد</h2>
            <p className="mt-1 text-[12px] text-muted-foreground">ممکن است حذف شده یا دیگر در دسترس شما نباشد.</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  const state = classifyProviderRequest(detail);
  const backHref = state.tab === "new" ? "/providers/requests" : `/providers/requests?tab=${state.tab}`;
  const canRespond = state.tab === "new";
  const canCancel = detail.status === "in_progress" && detail.isAssigned;
  const showPhone = canShowPhone(detail.status as RequestStatus) && Boolean(detail.consumer.phone);
  const price = detail.agreedPriceToman ?? detail.priceToman;
  const area = detail.land.areaSquareMeters ? formatAreaSqm(Number(detail.land.areaSquareMeters)) : null;
  const ownFlow = detail.linkStatus === "accepted" || canRespond;

  const steps = [
    { label: "درخواست ثبت شد", at: detail.createdAt, done: true },
    { label: "شما پذیرفتید", at: detail.acceptedAt, done: Boolean(detail.acceptedAt) },
    detail.status === "cancelled"
      ? { label: "لغو شد", at: detail.cancelledAt, done: true, cancelled: true }
      : { label: "کار انجام شد", at: detail.completedAt, done: Boolean(detail.completedAt) },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <PageContainer withDock className="px-0 pt-0">
        <ProviderPageHero eyebrow={detail.serviceCategoryName} title={detail.serviceName} backHref={backHref}>
          <div className="mt-5 rounded-[24px] bg-white/[0.08] p-4 ring-1 ring-white/12 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-2">
              <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-black", TONE_PILL[state.tone])}>
                {state.label}
              </span>
              <span className="text-[11px] text-white/60">{formatRelativeTime(detail.createdAt)}</span>
            </div>
            {price > 0 ? (
              <>
                <p className="mt-3 text-[11px] text-white/60">
                  {detail.agreedPriceToman ? "مبلغ توافقی" : "مبلغ بر اساس قیمت خدمت شما"}
                </p>
                <p className="mt-0.5 flex items-baseline gap-1.5">
                  <span className="text-[30px] font-black leading-none tabular-nums">
                    {new Intl.NumberFormat("fa-IR").format(price)}
                  </span>
                  <span className="text-sm font-bold text-[#95d5b2]">تومان</span>
                </p>
              </>
            ) : null}
          </div>
        </ProviderPageHero>

        <div className="relative z-10 -mt-4 space-y-4 px-4">
          {canRespond ? (
            <Reveal>
              <section className="rounded-[24px] bg-[linear-gradient(150deg,#fff6e6_0%,#ffffff_80%)] p-4 shadow-[0_18px_36px_-22px_rgba(224,138,43,0.6)] ring-1 ring-[#e9c46a]/50">
                <p className="text-[14px] font-black text-foreground">این درخواست منتظر پاسخ شماست</p>
                <p className="mt-1 text-[11.5px] leading-5 text-muted-foreground">
                  اولین خدمات‌دهنده‌ای که قبول کند، کار به او سپرده می‌شود.
                </p>
                <div className="mt-3.5 grid grid-cols-[1fr_auto] gap-2">
                  <button
                    type="button"
                    onClick={() => openAction("accept")}
                    className="flex h-12 items-center justify-center gap-1.5 rounded-2xl bg-primary text-[14px] font-black text-primary-foreground shadow-[0_12px_24px_-12px_rgba(45,106,79,0.9)] transition active:scale-[0.98]"
                  >
                    <Check className="size-5" strokeWidth={2.75} />
                    قبول درخواست
                  </button>
                  <button
                    type="button"
                    onClick={() => openAction("reject")}
                    className="flex h-12 items-center justify-center gap-1 rounded-2xl bg-surface px-5 text-[13px] font-bold text-destructive ring-1 ring-destructive/25 transition hover:bg-destructive/5"
                  >
                    <X className="size-4" />
                    رد
                  </button>
                </div>
              </section>
            </Reveal>
          ) : null}

          {ownFlow ? (
            <Reveal delay={0.05}>
              <section className="rounded-[24px] bg-surface p-4 shadow-[0_14px_30px_-22px_rgba(45,106,79,0.5)] ring-1 ring-border/60">
                <ol className="relative">
                  {steps.map((step, index) => (
                    <li key={step.label} className="relative flex gap-3 pb-4 last:pb-0">
                      {index < steps.length - 1 ? (
                        <span
                          aria-hidden
                          className={cn(
                            "absolute right-[13px] top-7 h-[calc(100%-1.25rem)] w-0.5 rounded-full",
                            steps[index + 1]?.done ? "bg-primary/40" : "bg-border",
                          )}
                        />
                      ) : null}
                      <span
                        className={cn(
                          "relative flex size-7 shrink-0 items-center justify-center rounded-full",
                          "cancelled" in step && step.cancelled
                            ? "bg-destructive text-white"
                            : step.done
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground ring-2 ring-background",
                        )}
                      >
                        {"cancelled" in step && step.cancelled ? (
                          <Ban className="size-3.5" />
                        ) : step.done ? (
                          <Check className="size-3.5" strokeWidth={3} />
                        ) : (
                          <span className="size-1.5 rounded-full bg-current" />
                        )}
                      </span>
                      <div className="pt-0.5">
                        <p className={cn("text-[13px] font-bold", step.done ? "text-foreground" : "text-muted-foreground")}>
                          {step.label}
                        </p>
                        {step.at ? (
                          <p className="mt-0.5 text-[11px] text-muted-foreground">{STAMP.format(new Date(step.at))}</p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
                {detail.status === "cancelled" && detail.cancelReason ? (
                  <p className="mt-3 rounded-2xl bg-[#fde2dc]/60 px-3 py-2.5 text-[12px] leading-5 text-[#8a2a15]">
                    <span className="font-black">دلیل لغو: </span>
                    {detail.cancelReason}
                  </p>
                ) : null}
              </section>
            </Reveal>
          ) : (
            <Reveal delay={0.05}>
              <p className="rounded-[20px] bg-muted/70 px-4 py-3 text-[12px] leading-5 text-muted-foreground">
                این درخواست در بایگانی شماست: {state.label}.
              </p>
            </Reveal>
          )}

          <Reveal delay={0.1}>
            <SectionCard icon={UserRound} title="کشاورز">
              <div className="flex items-center gap-3">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#fdefd6] to-[#f8dcae] text-[17px] font-black text-[#9a5b13]">
                  {detail.consumer.name.trim().charAt(0) || "؟"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-black text-foreground">{detail.consumer.name}</p>
                  {showPhone ? (
                    <p dir="ltr" className="text-right text-[12px] font-bold tabular-nums text-muted-foreground">
                      {toPersianDigits(detail.consumer.phone ?? "")}
                    </p>
                  ) : (
                    <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Lock className="size-3" />
                      شماره پس از قبول درخواست نمایش داده می‌شود
                    </p>
                  )}
                </div>
                {showPhone ? (
                  <a
                    href={`tel:${detail.consumer.phone}`}
                    className="flex h-11 shrink-0 items-center gap-1.5 rounded-2xl bg-primary px-4 text-[13px] font-black text-primary-foreground shadow-[0_10px_20px_-12px_rgba(45,106,79,0.9)] transition active:scale-95"
                  >
                    <Phone className="size-4" />
                    تماس
                  </a>
                ) : null}
              </div>
              {detail.consumerNote ? (
                <div className="mt-3 flex gap-2 rounded-2xl bg-muted/60 px-3 py-2.5">
                  <MessageSquareQuote className="mt-0.5 size-4 shrink-0 text-primary" />
                  <p className="text-[12.5px] leading-6 text-foreground/85">{detail.consumerNote}</p>
                </div>
              ) : null}
            </SectionCard>
          </Reveal>

          {detail.dates.length > 0 ? (
            <Reveal delay={0.15}>
              <SectionCard icon={CalendarDays} title="زمان درخواستی برای انجام کار">
                <ul className="flex flex-wrap gap-2">
                  {detail.dates.map((date) => (
                    <li
                      key={date}
                      className="rounded-xl bg-[#e3f4ff] px-3 py-1.5 text-[12px] font-bold text-sky-800"
                    >
                      {WORK_DATE.format(new Date(date))}
                    </li>
                  ))}
                </ul>
              </SectionCard>
            </Reveal>
          ) : null}

          <Reveal delay={0.2}>
            <SectionCard icon={MapPin} title="زمین">
              <p className="text-[14px] font-black text-foreground">{detail.land.title}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {area ? (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-[11px] font-bold text-foreground/75">
                    <Ruler className="size-3" />
                    {area.primary} {area.primaryUnit}
                  </span>
                ) : null}
                {detail.distanceKm > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-[11px] font-bold text-foreground/75">
                    <Navigation className="size-3" />
                    {formatDistance(detail.distanceKm)} از شما
                  </span>
                ) : null}
              </div>
              {landLocation ? (
                <>
                  <MapPicker value={landLocation} interactive={false} className="mt-3" />
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${landLocation.lat},${landLocation.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex h-11 w-full items-center justify-center gap-1.5 rounded-2xl bg-primary/10 text-[13px] font-bold text-primary transition-colors hover:bg-primary/15"
                  >
                    <Navigation className="size-4" />
                    مسیریابی تا زمین
                  </a>
                </>
              ) : null}
            </SectionCard>
          </Reveal>

          {canCancel ? (
            <Reveal delay={0.25}>
              <button
                type="button"
                onClick={() => openAction("cancel")}
                className="flex h-12 w-full items-center justify-center gap-1.5 rounded-2xl bg-surface text-[13px] font-bold text-destructive ring-1 ring-destructive/25 transition hover:bg-destructive/5"
              >
                <Ban className="size-4" />
                لغو این کار
              </button>
            </Reveal>
          ) : null}
        </div>

        <RequestActionSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          action={action}
          target={{ serviceName: detail.serviceName, landTitle: detail.land.title, priceToman: price }}
          formKey={sheetKey}
          onConfirm={handleConfirm}
        />
      </PageContainer>
    </MotionConfig>
  );
}
