"use client";

import Link from "next/link";
import {
  BadgeCheck,
  ChevronRight,
  Images,
  MapPin,
  Radar,
  Sprout,
  UserRound,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";

import { AppMenuTrigger } from "@/components/layout/app-menu-trigger";
import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { PriceDisplay } from "@/components/shared/price-display";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  fetchPublicProviderProfile,
  type AppPublicProviderGalleryImage,
  type AppPublicProviderProfile,
} from "@/lib/api/app-public-provider";
import { isApiClientError } from "@/lib/api/envelope";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/utils/format";

const PRICING_UNIT_LABELS: Record<string, string> = {
  fixed: "قیمت پایه",
  per_hectare: "هر هکتار",
  per_square_meter: "هر متر مربع",
  per_hour: "هر ساعت",
  per_day: "هر روز",
};

function locationLabel(
  location: AppPublicProviderProfile["location"],
): string | null {
  if (!location) return null;
  if (location.cityName && location.provinceName) {
    return `${location.cityName}، ${location.provinceName}`;
  }
  return location.cityName ?? location.provinceName;
}

interface ProviderPublicProfileProps {
  providerId: string;
  backHref?: string;
}

export function ProviderPublicProfile({
  providerId,
  backHref = "/users/search",
}: ProviderPublicProfileProps) {
  const [profile, setProfile] = useState<AppPublicProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lightbox, setLightbox] =
    useState<AppPublicProviderGalleryImage | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    setLoading(true);
    setNotFound(false);

    void fetchPublicProviderProfile(providerId, controller.signal)
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch((cause: unknown) => {
        if (cancelled || controller.signal.aborted) return;
        if (isApiClientError(cause) && cause.status === 404) {
          setNotFound(true);
          return;
        }
        toast.error(
          isApiClientError(cause)
            ? cause.message
            : "بارگذاری پروفایل خدمات‌دهنده ناموفق بود.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [providerId]);

  if (loading) {
    return (
      <PageContainer withDock>
        <LoadingSpinner fullPage label="در حال بارگذاری پروفایل…" />
      </PageContainer>
    );
  }

  if (notFound || !profile) {
    return (
      <PageContainer withDock>
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link
            href={backHref}
            className="flex size-9 items-center justify-center rounded-xl border border-border bg-surface text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="بازگشت"
          >
            <ChevronRight className="size-5" strokeWidth={1.75} />
          </Link>
          <AppMenuTrigger />
        </div>
        <EmptyState
          icon={UserRound}
          title="خدمات‌دهنده یافت نشد"
          description="ممکن است این پروفایل غیرفعال شده باشد یا دیگر در دسترس نباشد."
          action={{ label: "بازگشت به جستجو", href: backHref }}
        />
      </PageContainer>
    );
  }

  const place = locationLabel(profile.location);
  const pricingUnitLabel = (unit: string) =>
    PRICING_UNIT_LABELS[unit] ?? PRICING_UNIT_LABELS.fixed;

  return (
    <PageContainer withDock className="!px-0 !pt-0">
      <section className="relative overflow-hidden bg-[linear-gradient(155deg,#1a4332_0%,#2d6a4f_48%,#3d8b6a_100%)] px-4 pb-16 pt-4 text-white shadow-[0_20px_40px_rgba(45,106,79,0.28)] animate-slide-up motion-reduce:animate-none">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_-20%,rgba(255,255,255,0.22),transparent_55%)]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-10 size-56 rounded-full bg-secondary/20 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-12 top-8 size-40 rounded-full bg-white/10 blur-2xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/90 to-transparent"
          aria-hidden="true"
        />

        <div className="relative flex items-start justify-between gap-3">
          <Link
            href={backHref}
            className="flex size-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20"
            aria-label="بازگشت"
          >
            <ChevronRight className="size-5" strokeWidth={1.75} />
          </Link>
          <AppMenuTrigger
            variant="ghost"
            className="text-white hover:bg-white/10"
          />
        </div>

        <div className="relative mt-6 flex flex-col items-center text-center animate-fade-in motion-reduce:animate-none">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-white/40 via-secondary/50 to-transparent opacity-80 blur-[2px]" />
            <Avatar className="relative size-24 border-[3px] border-white/40 bg-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.2)]">
              {profile.image ? (
                <AvatarImage src={profile.image} alt={profile.name} />
              ) : null}
              <AvatarFallback className="bg-gradient-to-br from-primary/30 to-accent/20 text-white">
                <UserRound className="size-10" aria-hidden="true" />
              </AvatarFallback>
            </Avatar>
            {profile.isAvailable ? (
              <span
                className="absolute bottom-1 left-1 size-4 rounded-full border-2 border-white bg-emerald-400 shadow-sm"
                title="آماده پذیرش درخواست"
              />
            ) : null}
          </div>

          <h1 className="mt-4 max-w-[18rem] text-2xl font-bold leading-tight tracking-tight">
            {profile.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {profile.approved ? (
              <Badge className="border-white/25 bg-white/15 text-white backdrop-blur-md">
                <BadgeCheck className="size-3.5" aria-hidden="true" />
                تأیید‌شده
              </Badge>
            ) : null}
            <Badge
              className={cn(
                "border-white/25 backdrop-blur-md",
                profile.isAvailable
                  ? "bg-emerald-400/20 text-white"
                  : "bg-white/10 text-white/80",
              )}
            >
              {profile.isAvailable ? "آماده همکاری" : "فعلاً در دسترس نیست"}
            </Badge>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-white/85">
            {place ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/10 px-3 py-1.5 backdrop-blur-sm">
                <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                {place}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <div className="relative z-10 -mt-10 space-y-5 px-4 pb-2">
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-border/70 bg-surface/95 p-2.5 shadow-[0_14px_36px_rgba(45,106,79,0.14)] backdrop-blur-md sm:gap-3 sm:p-3">
          <div className="rounded-xl bg-primary/[0.06] px-2 py-3 text-center">
            <Wrench className="mx-auto size-4 text-primary" aria-hidden="true" />
            <p className="mt-1.5 text-base font-bold tabular-nums text-foreground">
              {toPersianDigits(profile.servicesCount)}
            </p>
            <p className="text-[10px] font-medium text-muted-foreground">خدمت</p>
          </div>
          <div className="rounded-xl bg-accent/10 px-2 py-3 text-center">
            <Radar className="mx-auto size-4 text-accent" aria-hidden="true" />
            <p className="mt-1.5 text-base font-bold tabular-nums text-foreground">
              {toPersianDigits(profile.workRadiusKm)}
            </p>
            <p className="text-[10px] font-medium text-muted-foreground">کیلومتر</p>
          </div>
          <div className="rounded-xl bg-muted/60 px-2 py-3 text-center">
            <Images className="mx-auto size-4 text-primary/80" aria-hidden="true" />
            <p className="mt-1.5 text-base font-bold tabular-nums text-foreground">
              {toPersianDigits(profile.gallery.length)}
            </p>
            <p className="text-[10px] font-medium text-muted-foreground">گالری</p>
          </div>
        </div>

        {profile.bio ? (
          <section className="rounded-2xl border border-border/70 bg-surface p-4 shadow-[0_8px_24px_rgba(45,106,79,0.08)] animate-fade-in motion-reduce:animate-none">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sprout className="size-4" aria-hidden="true" />
              </span>
              <h2 className="text-sm font-bold text-foreground">درباره خدمات‌دهنده</h2>
            </div>
            <p className="text-sm leading-7 text-muted-foreground whitespace-pre-wrap">
              {profile.bio}
            </p>
          </section>
        ) : null}

        <section className="animate-fade-in [animation-delay:60ms] motion-reduce:animate-none">
          <div className="mb-3 flex items-end justify-between gap-3 px-0.5">
            <div>
              <h2 className="text-base font-bold text-foreground">خدمات قابل ارائه</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                قیمت‌ها به‌ازای واحد اعلام‌شده است
              </p>
            </div>
          </div>

          {profile.services.length === 0 ? (
            <EmptyState
              icon={Wrench}
              title="خدمتی ثبت نشده"
              description="این خدمات‌دهنده هنوز خدمت فعالی برای نمایش ندارد."
              className="py-8"
            />
          ) : (
            <ul className="flex flex-col gap-2.5">
              {profile.services.map((service, index) => (
                <li
                  key={service.serviceId}
                  className="overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-[0_4px_14px_rgba(45,106,79,0.06)] transition-colors hover:border-primary/20"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <div className="flex gap-0">
                    {service.image ? (
                      <div className="relative hidden w-24 shrink-0 overflow-hidden sm:block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={service.image}
                          alt=""
                          className="size-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-l from-surface to-transparent" />
                      </div>
                    ) : null}
                    <div className="min-w-0 flex-1 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[15px] font-bold leading-snug text-foreground">
                            {service.serviceName}
                          </p>
                          <p className="mt-1 text-[11px] font-medium text-primary/80">
                            {service.categoryName}
                          </p>
                        </div>
                        <div className="shrink-0 text-left">
                          <PriceDisplay amount={service.priceToman} size="sm" />
                          <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">
                            {pricingUnitLabel(service.pricingUnit)}
                          </p>
                        </div>
                      </div>
                      {service.description ? (
                        <p className="mt-2.5 line-clamp-2 text-xs leading-5 text-muted-foreground">
                          {service.description}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="animate-fade-in [animation-delay:120ms] motion-reduce:animate-none">
          <div className="mb-3 flex items-end justify-between gap-3 px-0.5">
            <div>
              <h2 className="text-base font-bold text-foreground">گالری تصاویر</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                نمونه‌کارها و تصاویر ثبت‌شده توسط خدمات‌دهنده
              </p>
            </div>
            {profile.gallery.length > 0 ? (
              <span className="rounded-full bg-primary/8 px-2.5 py-1 text-[10px] font-semibold text-primary">
                {toPersianDigits(profile.gallery.length)} تصویر
              </span>
            ) : null}
          </div>

          {profile.gallery.length === 0 ? (
            <EmptyState
              icon={Images}
              title="گالری خالی است"
              description="هنوز تصویری از سوی این خدمات‌دهنده ثبت نشده است."
              className="py-8"
            />
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {profile.gallery.map((item, index) => (
                <button
                  key={item.imageId}
                  type="button"
                  onClick={() => setLightbox(item)}
                  className={cn(
                    "group relative aspect-[4/5] overflow-hidden rounded-2xl border border-border/60 bg-muted/40 text-right shadow-sm transition-transform duration-200 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    index === 0 && "sm:col-span-2 sm:row-span-2 sm:aspect-auto sm:min-h-[220px]",
                  )}
                  aria-label={item.caption || `تصویر ${toPersianDigits(index + 1)}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.caption || ""}
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-80" />
                  {item.caption ? (
                    <span className="absolute inset-x-0 bottom-0 truncate px-2.5 pb-2.5 text-[11px] font-medium text-white">
                      {item.caption}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      <Dialog
        open={Boolean(lightbox)}
        onOpenChange={(open) => {
          if (!open) setLightbox(null);
        }}
      >
        <DialogContent
          showCloseButton
          className="max-w-[min(100%,28rem)] overflow-hidden border-border/60 bg-background p-0 sm:rounded-2xl"
        >
          <DialogTitle className="sr-only">
            {lightbox?.caption || "تصویر گالری"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            بزرگ‌نمایی تصویر گالری خدمات‌دهنده
          </DialogDescription>
          {lightbox ? (
            <div className="flex flex-col">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightbox.url}
                alt={lightbox.caption || ""}
                className="max-h-[70dvh] w-full object-contain bg-black/90"
              />
              {lightbox.caption ? (
                <p className="px-4 py-3 text-sm text-muted-foreground">
                  {lightbox.caption}
                </p>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
