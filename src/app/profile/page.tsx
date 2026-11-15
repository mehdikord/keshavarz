"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MotionConfig, motion } from "framer-motion";
import {
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Globe,
  ImagePlus,
  LoaderCircle,
  LogOut,
  MapPin,
  MonitorSmartphone,
  Pencil,
  ShieldCheck,
  Smartphone,
  Trash2,
  Tractor,
  UserRound,
  Wheat,
  X,
} from "lucide-react";

import { AppMenuTrigger } from "@/components/layout/app-menu-trigger";
import { PageContainer } from "@/components/layout/page-container";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { FieldHills } from "@/components/shared/field-hills";
import { ImageCropperSheet } from "@/components/shared/image-cropper-sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import {
  deleteAppMeImage,
  listAppSessions,
  revokeAppSession,
  uploadAppMeImage,
  type AppSession,
} from "@/lib/api/app-auth";
import { fetchAppCities, fetchAppProvinces, type AppCity, type AppProvince } from "@/lib/api/app-location";
import { isApiClientError } from "@/lib/api/envelope";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils/date";
import { toPersianDigits } from "@/lib/utils/format";
import { formatPhoneDisplay } from "@/lib/utils/phone";
import { useAuthStore } from "@/stores/auth-store";

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 60;

const PLATFORM_LABEL: Record<string, string> = {
  web: "مرورگر وب",
  pwa: "اپلیکیشن نصب‌شده",
  android: "اندروید",
  ios: "آیفون",
};

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

function Section({
  icon: Icon,
  title,
  hint,
  action,
  children,
}: {
  icon: typeof MapPin;
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[26px] bg-white p-4 shadow-[0_14px_30px_-22px_rgba(45,106,79,0.5)] ring-1 ring-[#e3ebe3]">
      <div className="mb-3.5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#eef5ef] text-[#2d6a4f]">
            <Icon className="size-[18px]" />
          </span>
          <div>
            <h2 className="text-[14px] font-black text-[#1a2e1a]">{title}</h2>
            {hint ? <p className="text-[11px] text-[#6b7a6b]">{hint}</p> : null}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const image = useAuthStore((state) => state.image);
  const logout = useAuthStore((state) => state.logout);
  const logoutAll = useAuthStore((state) => state.logoutAll);
  const updateDisplayName = useAuthStore((state) => state.updateDisplayName);
  const updateResidence = useAuthStore((state) => state.updateResidence);
  const refreshMe = useAuthStore((state) => state.refreshMe);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);

  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [imageBusy, setImageBusy] = useState(false);

  const [sessions, setSessions] = useState<AppSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [busySessionId, setBusySessionId] = useState<string | null>(null);
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);

  const [provinces, setProvinces] = useState<AppProvince[]>([]);
  const [provincesLoading, setProvincesLoading] = useState(true);
  const [cities, setCities] = useState<AppCity[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(Boolean(user?.province?.provinceId));
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>(user?.province?.provinceId ?? "");
  const [selectedCityId, setSelectedCityId] = useState<string>(user?.city?.cityId ?? "");
  const [locationBusy, setLocationBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void listAppSessions(controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) setSessions(items);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        toast.error(isApiClientError(cause) ? cause.message : "بارگذاری دستگاه‌ها ناموفق بود.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setSessionsLoading(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetchAppProvinces(controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) setProvinces(items);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        toast.error(isApiClientError(cause) ? cause.message : "بارگذاری استان‌ها ناموفق بود.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setProvincesLoading(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!selectedProvinceId) return;
    const controller = new AbortController();
    void fetchAppCities(selectedProvinceId, controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) setCities(items);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        toast.error(isApiClientError(cause) ? cause.message : "بارگذاری شهرها ناموفق بود.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setCitiesLoading(false);
      });
    return () => controller.abort();
  }, [selectedProvinceId]);

  // Release the picked file's object URL once the cropper is done with it.
  useEffect(() => {
    if (!cropSrc) return;
    return () => URL.revokeObjectURL(cropSrc);
  }, [cropSrc]);

  if (!user) return null;

  const startEditName = () => {
    setNameDraft(user.displayName);
    setNameError(null);
    setEditingName(true);
  };

  const handleSaveName = async () => {
    const value = nameDraft.trim();
    if (value.length < MIN_NAME_LENGTH) {
      setNameError(`نام باید حداقل ${toPersianDigits(MIN_NAME_LENGTH)} حرف باشد`);
      return;
    }
    if (value === user.displayName) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      await updateDisplayName(value);
      setEditingName(false);
      toast.success("نام شما به‌روزرسانی شد");
    } catch (cause: unknown) {
      setNameError(isApiClientError(cause) ? cause.message : "ذخیره نام ناموفق بود.");
    } finally {
      setSavingName(false);
    }
  };

  const handleProvinceChange = (provinceId: string) => {
    setSelectedCityId("");
    setCities([]);
    setCitiesLoading(true);
    setSelectedProvinceId(provinceId);
  };

  const locationChanged =
    selectedProvinceId !== (user.province?.provinceId ?? "") || selectedCityId !== (user.city?.cityId ?? "");

  const handleSaveLocation = async () => {
    setLocationBusy(true);
    try {
      await updateResidence(selectedProvinceId, selectedCityId);
      toast.success("محل سکونت ذخیره شد");
    } catch (cause: unknown) {
      toast.error(isApiClientError(cause) ? cause.message : "ذخیره استان و شهر ناموفق بود.");
    } finally {
      setLocationBusy(false);
    }
  };

  const pickPhoto = (source: "gallery" | "camera") => {
    (source === "camera" ? cameraInputRef : galleryInputRef).current?.click();
  };

  const handleFilePicked = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setPhotoSheetOpen(false);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("فقط فایل تصویری قابل انتخاب است");
      return;
    }
    setCropSrc(URL.createObjectURL(file));
  };

  const handleCropped = async (file: File) => {
    setImageBusy(true);
    try {
      await uploadAppMeImage(file);
      await refreshMe();
      setCropSrc(null);
      toast.success("تصویر پروفایل به‌روزرسانی شد");
    } catch (cause: unknown) {
      toast.error(isApiClientError(cause) ? cause.message : "بارگذاری تصویر ناموفق بود.");
    } finally {
      setImageBusy(false);
    }
  };

  const handleDeleteImage = async () => {
    setPhotoSheetOpen(false);
    setImageBusy(true);
    try {
      await deleteAppMeImage();
      await refreshMe();
      toast.success("تصویر پروفایل حذف شد");
    } catch (cause: unknown) {
      toast.error(isApiClientError(cause) ? cause.message : "حذف تصویر ناموفق بود.");
    } finally {
      setImageBusy(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      toast.info("از حساب خارج شدید");
      router.replace("/auth");
    }
  };

  const handleLogoutAll = async () => {
    try {
      await logoutAll();
    } finally {
      toast.info("از همه دستگاه‌ها خارج شدید");
      router.replace("/auth");
    }
  };

  const handleRevoke = async (sessionId: string) => {
    setBusySessionId(sessionId);
    try {
      await revokeAppSession(sessionId);
      setSessions((prev) => prev.filter((item) => item.sessionId !== sessionId));
      toast.success("دستگاه از حساب خارج شد");
    } catch (cause: unknown) {
      toast.error(isApiClientError(cause) ? cause.message : "خروج دستگاه ناموفق بود.");
    } finally {
      setBusySessionId(null);
    }
  };

  const activeSessions = sessions.filter((item) => !item.revoked);
  const place = user.city && user.province ? `${user.city.name}، ${user.province.name}` : null;

  return (
    <MotionConfig reducedMotion="user">
      <PageContainer className="px-0 pb-10 pt-0">
        <section className="relative isolate shrink-0 overflow-hidden bg-[linear-gradient(165deg,#071d14_0%,#0f3324_45%,#1b5038_80%,#24603f_100%)] px-5 pb-20 pt-[calc(env(safe-area-inset-top,0px)+1rem)] text-white">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="bg-grain absolute inset-0 opacity-[0.08] mix-blend-overlay" />
            <div className="absolute -left-20 -top-24 size-72 rounded-full bg-[radial-gradient(circle,rgba(255,209,128,0.3)_0%,transparent_65%)]" />
            <div className="absolute -right-24 top-24 size-64 rounded-full bg-[#40916c]/25 blur-3xl" />
          </div>

          <header className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="بازگشت"
              className="flex size-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur-md transition hover:bg-white/20"
            >
              <ChevronRight className="size-5" />
            </button>
            <p className="text-[13px] font-black text-white/85">پروفایل من</p>
            <AppMenuTrigger className="size-11 rounded-2xl bg-white/10 text-white ring-1 ring-white/15 backdrop-blur-md hover:bg-white/20 hover:text-white" />
          </header>

          <div className="mt-6 flex flex-col items-center text-center">
            <motion.button
              type="button"
              onClick={() => setPhotoSheetOpen(true)}
              disabled={imageBusy}
              aria-label="تغییر تصویر پروفایل"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="group relative rounded-full bg-gradient-to-br from-[#b7e4c7] via-[#95d5b2] to-[#f4a261] p-[3px] shadow-[0_18px_40px_-14px_rgba(0,0,0,0.6)]"
            >
              <span className="relative block size-28 overflow-hidden rounded-full border-4 border-[#0f3324] bg-[#1b5038]">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt={user.displayName} className="size-full object-cover" />
                ) : (
                  <span className="flex size-full items-center justify-center text-[#b7e4c7]">
                    <UserRound className="size-12" strokeWidth={1.5} />
                  </span>
                )}
                {imageBusy ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <LoaderCircle className="size-7 animate-spin" />
                  </span>
                ) : null}
              </span>
              <span className="absolute bottom-1 left-1 flex size-9 items-center justify-center rounded-full bg-[#f4a261] text-[#3d2914] ring-4 ring-[#0f3324] transition-transform group-hover:scale-110">
                <Camera className="size-4" strokeWidth={2.25} />
              </span>
            </motion.button>

            <h1 className="mt-4 text-[24px] font-black leading-tight">{user.displayName}</h1>
            <p dir="ltr" className="mt-1 text-[13px] font-bold tracking-wide text-white/70">
              {toPersianDigits(formatPhoneDisplay(user.phone))}
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-[#d8f3dc] ring-1 ring-white/10">
                <ShieldCheck className="size-3.5" />
                شماره تأییدشده
              </span>
              {place ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white/85 ring-1 ring-white/10">
                  <MapPin className="size-3.5" />
                  {place}
                </span>
              ) : null}
            </div>
          </div>
          <FieldHills />
        </section>

        <div className="relative z-10 -mt-6 space-y-4 px-4">
          <Reveal>
            <div className="grid grid-cols-2 gap-2">
              {[
                { href: "/providers/home", label: "پنل خدمات‌دهنده", icon: Tractor, className: "bg-[linear-gradient(150deg,#123d2b_0%,#2d7a55_100%)] text-white", box: "bg-white/15" },
                { href: "/users/home", label: "پنل خدمات‌گیرنده", icon: Wheat, className: "bg-[linear-gradient(150deg,#f9b46b_0%,#c9611f_100%)] text-white", box: "bg-white/20" },
              ].map((panel) => {
                const Icon = panel.icon;
                return (
                  <Link
                    key={panel.href}
                    href={panel.href}
                    className={cn("flex items-center gap-2.5 rounded-[22px] p-3 shadow-[0_14px_28px_-18px_rgba(0,0,0,0.5)] transition active:scale-[0.97]", panel.className)}
                  >
                    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", panel.box)}>
                      <Icon className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1 text-[12.5px] font-black leading-5">{panel.label}</span>
                    <ChevronLeft className="size-4 shrink-0 opacity-70" />
                  </Link>
                );
              })}
            </div>
          </Reveal>

          <Reveal delay={0.06}>
            <Section
              icon={UserRound}
              title="اطلاعات شخصی"
              hint="این اطلاعات به طرف مقابل در درخواست‌ها نمایش داده می‌شود"
              action={
                !editingName ? (
                  <button
                    type="button"
                    onClick={startEditName}
                    className="inline-flex items-center gap-1 rounded-full bg-[#eef5ef] px-3 py-1.5 text-[11.5px] font-black text-[#2d6a4f]"
                  >
                    <Pencil className="size-3.5" />
                    ویرایش
                  </button>
                ) : null
              }
            >
              <dl className="divide-y divide-[#eef2ee] rounded-2xl bg-[#f8faf5] px-3.5">
                <div className="py-3">
                  <dt className="text-[11px] font-bold text-[#6b7a6b]">نام نمایشی</dt>
                  {editingName ? (
                    <dd className="mt-2">
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          value={nameDraft}
                          maxLength={MAX_NAME_LENGTH}
                          onChange={(event) => {
                            setNameDraft(event.target.value);
                            if (nameError) setNameError(null);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") void handleSaveName();
                            if (event.key === "Escape") setEditingName(false);
                          }}
                          placeholder="نام شما در اپلیکیشن"
                          className={cn(
                            "h-11 min-w-0 flex-1 rounded-xl bg-white px-3 text-[14px] font-bold text-[#1a2e1a] outline-none ring-2 transition",
                            nameError ? "ring-[#e8a08f]" : "ring-[#95d5b2] focus:ring-[#52b788]",
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => void handleSaveName()}
                          disabled={savingName}
                          aria-label="ذخیره نام"
                          className="flex size-11 items-center justify-center rounded-xl bg-[#2d6a4f] text-white disabled:opacity-60"
                        >
                          {savingName ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-5" strokeWidth={2.75} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingName(false)}
                          disabled={savingName}
                          aria-label="انصراف"
                          className="flex size-11 items-center justify-center rounded-xl bg-white text-[#6b7a6b] ring-1 ring-[#e3ebe3]"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                      {nameError ? <p className="mt-1.5 text-[11.5px] font-bold text-[#b23a1f]">{nameError}</p> : null}
                    </dd>
                  ) : (
                    <dd className="mt-0.5 text-[14.5px] font-black text-[#1a2e1a]">{user.displayName}</dd>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <dt className="text-[11px] font-bold text-[#6b7a6b]">شماره موبایل</dt>
                    <dd dir="ltr" className="mt-0.5 text-right text-[14.5px] font-black tracking-wide text-[#1a2e1a]">
                      {toPersianDigits(formatPhoneDisplay(user.phone))}
                    </dd>
                  </div>
                  <span className="text-[10.5px] text-[#8a978a]">قابل تغییر نیست</span>
                </div>
              </dl>
            </Section>
          </Reveal>

          <Reveal delay={0.12}>
            <Section icon={MapPin} title="محل سکونت" hint="در پروفایل عمومی شما نمایش داده می‌شود">
              <div className="grid grid-cols-2 gap-2">
                <Select value={selectedProvinceId} onValueChange={handleProvinceChange} disabled={provincesLoading || locationBusy}>
                  <SelectTrigger aria-label="استان" className="h-12 w-full rounded-2xl border-0 bg-[#f8faf5] font-bold ring-1 ring-[#e3ebe3]">
                    <SelectValue placeholder={provincesLoading ? "در حال بارگذاری…" : "استان"} />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    {provinces.map((province) => (
                      <SelectItem key={province.provinceId} value={province.provinceId}>
                        {province.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={selectedCityId}
                  onValueChange={setSelectedCityId}
                  disabled={!selectedProvinceId || citiesLoading || locationBusy}
                >
                  <SelectTrigger aria-label="شهر" className="h-12 w-full rounded-2xl border-0 bg-[#f8faf5] font-bold ring-1 ring-[#e3ebe3]">
                    <SelectValue placeholder={citiesLoading ? "در حال بارگذاری…" : "شهر"} />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    {cities.map((city) => (
                      <SelectItem key={city.cityId} value={city.cityId}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {locationChanged ? (
                <button
                  type="button"
                  onClick={() => void handleSaveLocation()}
                  disabled={locationBusy || !selectedProvinceId || !selectedCityId || citiesLoading}
                  className="mt-3 flex h-11 w-full items-center justify-center gap-1.5 rounded-2xl bg-[#2d6a4f] text-[13px] font-black text-white transition active:scale-[0.98] disabled:opacity-50"
                >
                  {locationBusy ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" strokeWidth={2.75} />}
                  ذخیره محل سکونت
                </button>
              ) : null}
            </Section>
          </Reveal>

          <Reveal delay={0.18}>
            <Section
              icon={MonitorSmartphone}
              title="دستگاه‌های وارد شده"
              hint="دستگاه‌هایی که با حساب شما وارد شده‌اند"
              action={
                activeSessions.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => setConfirmLogoutAll(true)}
                    className="shrink-0 rounded-full bg-[#fde2dc]/70 px-3 py-1.5 text-[11.5px] font-black text-[#b23a1f]"
                  >
                    خروج از همه
                  </button>
                ) : null
              }
            >
              {sessionsLoading ? (
                <div className="space-y-2">
                  <div className="h-14 animate-pulse rounded-2xl bg-[#f1f5f0]" />
                  <div className="h-14 animate-pulse rounded-2xl bg-[#f1f5f0]" />
                </div>
              ) : activeSessions.length === 0 ? (
                <p className="rounded-2xl bg-[#f8faf5] px-3 py-4 text-center text-[12px] text-[#6b7a6b]">دستگاهی یافت نشد.</p>
              ) : (
                <ul className="space-y-2">
                  {activeSessions.map((session) => {
                    const DeviceIcon = session.platform === "web" ? Globe : Smartphone;
                    return (
                      <li
                        key={session.sessionId}
                        className={cn(
                          "flex items-center gap-3 rounded-2xl px-3 py-2.5",
                          session.current ? "bg-[#eef5ef] ring-1 ring-[#cfe5d6]" : "bg-[#f8faf5]",
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-10 shrink-0 items-center justify-center rounded-xl",
                            session.current ? "bg-[#2d6a4f] text-white" : "bg-white text-[#4a5d4a] ring-1 ring-[#e3ebe3]",
                          )}
                        >
                          <DeviceIcon className="size-[18px]" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-1.5 truncate text-[13px] font-black text-[#1a2e1a]">
                            <span className="truncate">
                              {session.deviceName || PLATFORM_LABEL[session.platform ?? ""] || "دستگاه ناشناس"}
                            </span>
                            {session.current ? (
                              <span className="shrink-0 rounded-full bg-[#52b788] px-2 py-0.5 text-[9.5px] font-black text-white">
                                همین دستگاه
                              </span>
                            ) : null}
                          </p>
                          <p className="text-[11px] text-[#6b7a6b]">
                            آخرین فعالیت {formatRelativeTime(session.lastActivityAt)}
                          </p>
                        </div>
                        {!session.current ? (
                          <button
                            type="button"
                            onClick={() => void handleRevoke(session.sessionId)}
                            disabled={busySessionId === session.sessionId}
                            aria-label="خروج این دستگاه"
                            className="flex size-9 shrink-0 items-center justify-center rounded-xl text-[#b23a1f] transition hover:bg-[#fde2dc]/60 disabled:opacity-50"
                          >
                            {busySessionId === session.sessionId ? (
                              <LoaderCircle className="size-4 animate-spin" />
                            ) : (
                              <LogOut className="size-4" />
                            )}
                          </button>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Section>
          </Reveal>

          <Reveal delay={0.24}>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="flex h-13 w-full items-center justify-center gap-2 rounded-[22px] bg-white py-3.5 text-[14px] font-black text-[#b23a1f] ring-1 ring-[#f3c4b8] transition hover:bg-[#fde2dc]/40"
            >
              <LogOut className="size-5" />
              خروج از حساب
            </button>
            <p className="mt-3 text-center text-[10.5px] text-[#8a978a]">کشاورز · همراه کشاورزان، از کاشت تا برداشت</p>
          </Reveal>
        </div>

        <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleFilePicked} />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleFilePicked} />

        <Sheet open={photoSheetOpen} onOpenChange={setPhotoSheetOpen}>
          <SheetContent
            side="bottom"
            showCloseButton={false}
            className="inset-x-0 mx-auto max-w-[430px] gap-0 rounded-t-[30px] border-0 bg-white p-0 pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            <span aria-hidden className="mx-auto mt-3 block h-1.5 w-11 rounded-full bg-[#e3ebe3]" />
            <div className="px-5 pb-2 pt-4 text-right">
              <SheetTitle className="text-[15px] font-black text-[#1a2e1a]">تصویر پروفایل</SheetTitle>
              <SheetDescription className="text-[11.5px] text-[#6b7a6b]">
                پس از انتخاب، می‌توانید بخش دلخواه را به‌صورت مربع برش بزنید.
              </SheetDescription>
            </div>
            <div className="space-y-1.5 px-4 py-2">
              {[
                { icon: ImagePlus, label: "انتخاب از گالری", source: "gallery" as const, tone: "bg-[#eef5ef] text-[#2d6a4f]" },
                { icon: Camera, label: "گرفتن عکس با دوربین", source: "camera" as const, tone: "bg-[#fff5e6] text-[#b4661a]" },
              ].map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => pickPhoto(option.source)}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-right transition-colors hover:bg-[#f6f8f4]"
                  >
                    <span className={cn("flex size-10 items-center justify-center rounded-xl", option.tone)}>
                      <Icon className="size-5" />
                    </span>
                    <span className="text-[14px] font-bold text-[#1a2e1a]">{option.label}</span>
                  </button>
                );
              })}
              {image ? (
                <button
                  type="button"
                  onClick={() => void handleDeleteImage()}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-right transition-colors hover:bg-[#fde2dc]/40"
                >
                  <span className="flex size-10 items-center justify-center rounded-xl bg-[#fde2dc]/70 text-[#b23a1f]">
                    <Trash2 className="size-5" />
                  </span>
                  <span className="text-[14px] font-bold text-[#b23a1f]">حذف تصویر فعلی</span>
                </button>
              ) : null}
            </div>
          </SheetContent>
        </Sheet>

        <ImageCropperSheet
          src={cropSrc}
          saving={imageBusy}
          onCancel={() => setCropSrc(null)}
          onConfirm={(file) => void handleCropped(file)}
        />

        <ConfirmDialog
          open={confirmLogoutAll}
          onOpenChange={setConfirmLogoutAll}
          title="خروج از همه دستگاه‌ها"
          description="از همه دستگاه‌ها، از جمله همین دستگاه، خارج می‌شوید و باید دوباره وارد شوید."
          confirmLabel="خروج از همه"
          variant="destructive"
          onConfirm={() => void handleLogoutAll()}
        />
      </PageContainer>
    </MotionConfig>
  );
}
