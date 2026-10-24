"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Check,
  ChevronRight,
  Images,
  MapPin,
  Radar,
  Sprout,
  UserRound,
  Wrench,
} from "lucide-react";

import { ConsumerHeroShell, HARVEST_GLASS_BUTTON } from "@/components/consumer-panel/consumer-hero";
import { AppMenuTrigger } from "@/components/layout/app-menu-trigger";
import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { pricingUnitLabel } from "@/lib/api/app-provider";
import {
  fetchPublicProviderProfile,
  type AppPublicProviderGalleryImage,
  type AppPublicProviderProfile,
} from "@/lib/api/app-public-provider";
import { isApiClientError } from "@/lib/api/envelope";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/utils/format";

const FULL = new Intl.NumberFormat("fa-IR");

function locationLabel(location: AppPublicProviderProfile["location"]): string | null {
  if (!location) return null;
  if (location.cityName && location.provinceName) return `${location.cityName}، ${location.provinceName}`;
  return location.cityName ?? location.provinceName;
}

interface ProviderPublicProfileProps {
  providerId: string;
  backHref?: string;
  /** When opened from search results, lets the farmer pick this provider and go back. */
  selectHref?: string | null;
}

function Header({ backHref }: { backHref: string }) {
  return (
    <header className="flex items-center justify-between gap-3">
      <Link href={backHref} aria-label="بازگشت" className={HARVEST_GLASS_BUTTON}>
        <ChevronRight className="size-5" />
      </Link>
      <AppMenuTrigger className={cn(HARVEST_GLASS_BUTTON, "hover:text-[#4a2e12]")} />
    </header>
  );
}

export function ProviderPublicProfile({
  providerId,
  backHref = "/users/search",
  selectHref = null,
}: ProviderPublicProfileProps) {
  const [profile, setProfile] = useState<AppPublicProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lightbox, setLightbox] = useState<AppPublicProviderGalleryImage | null>(null);
  const [loadedProviderId, setLoadedProviderId] = useState(providerId);

  // Reset per-provider state during render (not inside the effect) when the id changes.
  if (loadedProviderId !== providerId) {
    setLoadedProviderId(providerId);
    setLoading(true);
    setNotFound(false);
    setProfile(null);
  }

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

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
        toast.error(isApiClientError(cause) ? cause.message : "بارگذاری پروفایل خدمات‌دهنده ناموفق بود.");
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
      <PageContainer withDock className="px-0 pt-0">
        <ConsumerHeroShell>
          <Header backHref={backHref} />
          <div className="mt-6 flex flex-col items-center">
            <div className="size-24 animate-pulse rounded-[30px] bg-white/50" />
            <div className="mt-4 h-6 w-40 animate-pulse rounded-lg bg-white/50" />
          </div>
        </ConsumerHeroShell>
        <div className="relative z-10 -mt-4 space-y-3 px-4">
          <Skeleton className="h-20 rounded-[24px] bg-white/70" />
          <Skeleton className="h-40 rounded-[24px] bg-white/70" />
        </div>
      </PageContainer>
    );
  }

  if (notFound || !profile) {
    return (
      <PageContainer withDock className="px-0 pt-0">
        <ConsumerHeroShell>
          <Header backHref={backHref} />
        </ConsumerHeroShell>
        <div className="relative z-10 -mt-4 px-4">
          <div className="flex flex-col items-center rounded-[28px] bg-white px-6 py-9 text-center ring-1 ring-[#efe0c8]">
            <span className="flex size-16 items-center justify-center rounded-[22px] bg-[#fdebd3] text-[#b9531f]">
              <UserRound className="size-8" strokeWidth={1.75} />
            </span>
            <h2 className="mt-4 text-[16px] font-black text-[#3b2410]">خدمات‌دهنده یافت نشد</h2>
            <p className="mt-1.5 text-[12px] text-[#8a6a48]">ممکن است این پروفایل غیرفعال شده باشد.</p>
            <Link href={backHref} className="mt-5 rounded-2xl bg-[#b9531f] px-6 py-3 text-[13.5px] font-black text-white">
              بازگشت
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  const place = locationLabel(profile.location);
  const stats = [
    { icon: Wrench, value: toPersianDigits(profile.servicesCount), label: "خدمت" },
    { icon: Radar, value: `${toPersianDigits(profile.workRadiusKm)} کیلومتر`, label: "شعاع پوشش" },
    { icon: Images, value: toPersianDigits(profile.gallery.length), label: "نمونه‌کار" },
  ];

  return (
    <PageContainer withDock className="px-0 pt-0">
      <ConsumerHeroShell>
        <Header backHref={backHref} />

        <div className="mt-4 flex flex-col items-center text-center">
          <div className="relative">
            {profile.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.image}
                alt={profile.name}
                className="size-24 rounded-[30px] object-cover shadow-[0_18px_36px_-14px_rgba(138,69,18,0.6)] ring-4 ring-white/80"
              />
            ) : (
              <span className="flex size-24 items-center justify-center rounded-[30px] bg-gradient-to-br from-[#fff1d6] to-[#e8954a] text-[#5c3410] shadow-[0_18px_36px_-14px_rgba(138,69,18,0.6)] ring-4 ring-white/80">
                <UserRound className="size-11" strokeWidth={1.5} />
              </span>
            )}
            {profile.isAvailable ? (
              <span className="absolute -bottom-1 -left-1 size-5 rounded-full bg-[#4f9a55] ring-4 ring-[#fbd49a]" title="آماده همکاری" />
            ) : null}
          </div>

          <h1 className="mt-4 max-w-[18rem] text-[23px] font-black leading-tight">{profile.name}</h1>

          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5">
            {profile.approved ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-black text-[#2f6a35]">
                <BadgeCheck className="size-3.5" />
                تأییدشده
              </span>
            ) : null}
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-black",
                profile.isAvailable ? "bg-[#e1f0dc] text-[#2f6a35]" : "bg-white/60 text-[#8a6a48]",
              )}
            >
              {profile.isAvailable ? "آماده همکاری" : "فعلاً در دسترس نیست"}
            </span>
            {place ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/60 px-2.5 py-1 text-[11px] font-bold text-[#6b4a26]">
                <MapPin className="size-3.5" />
                {place}
              </span>
            ) : null}
          </div>
        </div>
      </ConsumerHeroShell>

      <div className="relative z-10 -mt-6 space-y-5 px-4">
        <dl className="grid grid-cols-3 gap-2 rounded-[24px] bg-white p-2 shadow-[0_18px_36px_-24px_rgba(160,86,26,0.55)] ring-1 ring-[#efe0c8]">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-2xl bg-[#fcf7ee] px-2 py-3 text-center">
                <Icon className="mx-auto size-4 text-[#b9531f]" />
                <dd className="mt-1.5 text-[14px] font-black tabular-nums text-[#3b2410]">{stat.value}</dd>
                <dt className="text-[10.5px] font-bold text-[#a08463]">{stat.label}</dt>
              </div>
            );
          })}
        </dl>

        {profile.bio ? (
          <section className="rounded-[24px] bg-white p-4 ring-1 ring-[#efe0c8]">
            <h2 className="mb-2 flex items-center gap-2 text-[14px] font-black text-[#3b2410]">
              <Sprout className="size-4 text-[#4f9a55]" />
              درباره خدمات‌دهنده
            </h2>
            <p className="whitespace-pre-wrap text-[12.5px] leading-7 text-[#6b4a26]">{profile.bio}</p>
          </section>
        ) : null}

        <section>
          <h2 className="mb-3 px-1 text-[15px] font-black text-[#3b2410]">خدمات و قیمت‌ها</h2>
          {profile.services.length === 0 ? (
            <p className="rounded-[22px] bg-white/70 px-4 py-8 text-center text-[12px] text-[#8a6a48] ring-1 ring-[#efe0c8]">
              این خدمات‌دهنده هنوز خدمت فعالی ثبت نکرده است.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {profile.services.map((service, index) => (
                <motion.li
                  key={service.serviceId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.05, 0.3) }}
                  className="rounded-[22px] bg-white p-4 ring-1 ring-[#efe0c8]"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e9f3e2] text-[#3f7d45]">
                      <Sprout className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-black text-[#3b2410]">{service.serviceName}</p>
                      <p className="text-[11px] font-bold text-[#a08463]">{service.categoryName}</p>
                    </div>
                    <div className="shrink-0 text-left">
                      <p className="text-[14px] font-black tabular-nums text-[#8a4512]">{FULL.format(service.priceToman)}</p>
                      <p className="text-[10px] font-bold text-[#a08463]">تومان · {pricingUnitLabel(service.pricingUnit)}</p>
                    </div>
                  </div>
                  {service.description ? (
                    <p className="mt-2.5 text-[12px] leading-6 text-[#6b4a26]">{service.description}</p>
                  ) : null}
                </motion.li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-[15px] font-black text-[#3b2410]">نمونه‌کارها</h2>
            {profile.gallery.length > 0 ? (
              <span className="text-[11.5px] font-bold text-[#a08463]">{toPersianDigits(profile.gallery.length)} تصویر</span>
            ) : null}
          </div>
          {profile.gallery.length === 0 ? (
            <p className="rounded-[22px] bg-white/70 px-4 py-8 text-center text-[12px] text-[#8a6a48] ring-1 ring-[#efe0c8]">
              هنوز تصویری ثبت نشده است.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {profile.gallery.map((item, index) => (
                <button
                  key={item.imageId}
                  type="button"
                  onClick={() => setLightbox(item)}
                  aria-label={item.caption || `تصویر ${toPersianDigits(index + 1)}`}
                  className={cn(
                    "group relative aspect-square overflow-hidden rounded-2xl bg-[#f1e6d6] ring-1 ring-[#efe0c8]",
                    index === 0 && profile.gallery.length > 2 && "col-span-2 row-span-2",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.caption || ""}
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </button>
              ))}
            </div>
          )}
        </section>

        {selectHref ? (
          <div className="sticky bottom-[calc(env(safe-area-inset-bottom,0px)-2.5rem)] z-20 pt-1">
            <Link
              href={selectHref}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-[22px] bg-[#b9531f] text-[14.5px] font-black text-white shadow-[0_18px_36px_-14px_rgba(185,83,31,0.95)] transition active:scale-[0.98]"
            >
              <Check className="size-5" strokeWidth={2.75} />
              انتخاب این خدمات‌دهنده
            </Link>
          </div>
        ) : null}
      </div>

      <Dialog open={Boolean(lightbox)} onOpenChange={(open) => !open && setLightbox(null)}>
        <DialogContent showCloseButton className="max-w-[min(100%,28rem)] overflow-hidden rounded-[24px] p-0">
          <DialogTitle className="sr-only">{lightbox?.caption || "تصویر نمونه‌کار"}</DialogTitle>
          <DialogDescription className="sr-only">بزرگ‌نمایی تصویر نمونه‌کار</DialogDescription>
          {lightbox ? (
            <div className="flex flex-col">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={lightbox.url} alt={lightbox.caption || ""} className="max-h-[70dvh] w-full bg-black/90 object-contain" />
              {lightbox.caption ? <p className="px-4 py-3 text-[13px] text-[#6b4a26]">{lightbox.caption}</p> : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
