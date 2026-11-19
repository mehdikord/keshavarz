"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Check, Copy, Download, Ellipsis, Feather, LoaderCircle, Share, Smartphone, SquarePlus, X, Zap } from "lucide-react";

import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { selectCanOfferInstall, usePwaStore } from "@/stores/pwa-store";

const DISMISSED_AT_KEY = "keshavarz:pwa-install-dismissed-at";
const SESSION_SHOWN_KEY = "keshavarz:pwa-install-shown";
/** Don't nag: after "later", stay quiet for a week. */
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
/** Let the user get something done before suggesting an install. */
const AUTO_OPEN_DELAY_MS = 25_000;
const NO_AUTO_OPEN_PREFIXES = ["/auth", "/admins"];

const BENEFITS = [
  { icon: Zap, title: "باز شدن فوری", text: "یک لمس از صفحه اصلی گوشی، بدون جستجو و تایپ آدرس" },
  { icon: Smartphone, title: "تمام‌صفحه مثل اپلیکیشن", text: "بدون نوار مرورگر، با تجربه‌ای روان و بومی" },
  { icon: Feather, title: "سبک و همیشه به‌روز", text: "بدون نیاز به استور؛ تازه‌ترین نسخه خودکار می‌رسد" },
];

function readDismissedAt() {
  try {
    return Number(localStorage.getItem(DISMISSED_AT_KEY) ?? 0);
  } catch {
    return 0;
  }
}

function rememberDismissal() {
  try {
    localStorage.setItem(DISMISSED_AT_KEY, String(Date.now()));
  } catch {
    // Storage blocked (private mode): the session flag still prevents repeats.
  }
}

/** Opens the sheet once per session for signed-in users, respecting the cooldown. */
function useAutoOpen() {
  const pathname = usePathname();
  const canOffer = usePwaStore(selectCanOfferInstall);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const blockedRoute = NO_AUTO_OPEN_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  useEffect(() => {
    if (!canOffer || !isAuthenticated || blockedRoute) return;
    if (navigator.webdriver) return; // keep automated tests deterministic
    if (sessionStorage.getItem(SESSION_SHOWN_KEY)) return;
    if (Date.now() - readDismissedAt() < DISMISS_COOLDOWN_MS) return;

    const timer = window.setTimeout(() => {
      sessionStorage.setItem(SESSION_SHOWN_KEY, "1");
      usePwaStore.getState().openInstallSheet();
    }, AUTO_OPEN_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [blockedRoute, canOffer, isAuthenticated]);
}

export function InstallSheet() {
  useAutoOpen();
  const open = usePwaStore((state) => state.installSheetOpen);
  const close = usePwaStore((state) => state.closeInstallSheet);
  const platform = usePwaStore((state) => state.platform);
  const hasNativePrompt = usePwaStore((state) => Boolean(state.installPrompt));

  const handleOpenChange = (next: boolean) => {
    if (next) return;
    rememberDismissal();
    close();
  };

  const mode = !platform
    ? null
    : platform.inAppBrowser
      ? "in-app"
      : hasNativePrompt
        ? "native"
        : platform.platform === "ios"
          ? "ios"
          : null;

  return (
    <Sheet open={open && mode !== null} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="inset-x-0 mx-auto flex max-h-[92dvh] max-w-[430px] flex-col gap-0 overflow-hidden rounded-t-[30px] border-0 bg-[#f8faf5] p-0"
      >
        <header className="relative isolate shrink-0 overflow-hidden bg-[linear-gradient(165deg,#071d14_0%,#0f3324_50%,#1f5a40_100%)] px-5 pb-6 pt-3 text-white">
          <div aria-hidden className="pointer-events-none absolute -left-16 -top-20 -z-10 size-60 rounded-full bg-[radial-gradient(circle,rgba(255,209,128,0.28)_0%,transparent_65%)]" />
          <span aria-hidden className="mx-auto mb-4 block h-1.5 w-11 rounded-full bg-white/25" />
          <div className="flex items-center gap-3.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/icon-192.png"
              alt=""
              width={64}
              height={64}
              className="size-16 shrink-0 rounded-[20px] shadow-[0_14px_28px_-12px_rgba(0,0,0,0.6)] ring-1 ring-white/15"
            />
            <div className="min-w-0 flex-1 text-right">
              <SheetTitle className="text-[17px] font-black text-white">نصب اپلیکیشن کشاورز</SheetTitle>
              <SheetDescription className="mt-1 text-[12px] leading-5 text-[#b7e4c7]">
                روی صفحه اصلی گوشی، درست مثل یک اپلیکیشن واقعی
              </SheetDescription>
            </div>
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              aria-label="بستن"
              className="flex size-9 shrink-0 items-center justify-center self-start rounded-full bg-white/10 text-white/80 transition active:scale-90"
            >
              <X className="size-4" />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-2 pt-5">
          {mode === "in-app" ? <InAppBrowserGuide /> : null}
          {mode === "ios" ? <IosGuide nonSafari={platform?.iosNonSafari ?? false} /> : null}
          {mode === "native" ? <Benefits /> : null}
        </div>

        <footer className="shrink-0 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          {mode === "native" ? <NativeInstallButton /> : null}
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className={cn(
              "w-full rounded-2xl py-3 text-[13.5px] font-bold transition active:scale-[0.98]",
              mode === "native" ? "mt-2 text-[#5c6b5c]" : "bg-[#0f3324] text-white",
            )}
          >
            {mode === "native" ? "بعداً" : "متوجه شدم"}
          </button>
        </footer>
      </SheetContent>
    </Sheet>
  );
}

function Benefits() {
  return (
    <ul className="space-y-3">
      {BENEFITS.map(({ icon: Icon, title, text }) => (
        <li key={title} className="flex items-start gap-3 rounded-[20px] bg-white p-3.5 ring-1 ring-[#e3ebe3]">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#e8f3ec] text-[#2d6a4f]">
            <Icon className="size-5" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="text-[13.5px] font-black text-[#1a2e1a]">{title}</p>
            <p className="mt-0.5 text-[12px] leading-5 text-[#5c6b5c]">{text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function NativeInstallButton() {
  const promptInstall = usePwaStore((state) => state.promptInstall);
  const close = usePwaStore((state) => state.closeInstallSheet);
  const [pending, setPending] = useState(false);

  const install = async () => {
    setPending(true);
    try {
      const outcome = await promptInstall();
      if (outcome === "accepted") {
        close();
        toast.success("کشاورز نصب شد", "از صفحه اصلی گوشی بازش کنید.");
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void install()}
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#2d6a4f_0%,#1b4332_100%)] py-3.5 text-[14.5px] font-black text-white shadow-[0_16px_32px_-14px_rgba(27,67,50,0.9)] transition active:scale-[0.98] disabled:opacity-70"
    >
      {pending ? <LoaderCircle className="size-5 animate-spin" /> : <Download className="size-5" strokeWidth={2.2} />}
      نصب اپلیکیشن
    </button>
  );
}

function Step({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 rounded-[20px] bg-white p-3.5 ring-1 ring-[#e3ebe3]">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#0f3324] text-[12.5px] font-black text-[#d8f3dc]">
        {index.toLocaleString("fa-IR")}
      </span>
      <div className="min-w-0 flex-1 pt-0.5 text-[13px] leading-6 text-[#1a2e1a]">{children}</div>
    </li>
  );
}

function Glyph({ icon: Icon }: { icon: typeof Share }) {
  return (
    <span className="mx-1 inline-flex size-7 translate-y-[3px] items-center justify-center rounded-lg bg-[#e8f3ec] align-baseline text-[#1f6fd6]">
      <Icon className="size-4" strokeWidth={2.2} />
    </span>
  );
}

function IosGuide({ nonSafari }: { nonSafari: boolean }) {
  return (
    <>
      <p className="mb-3 text-[12.5px] leading-6 text-[#5c6b5c]">
        نصب در آیفون و آیپد فقط چند ثانیه طول می‌کشد. این سه مرحله را انجام دهید:
      </p>
      <ol className="space-y-3">
        <Step index={1}>
          {nonSafari ? (
            <>
              دکمه اشتراک‌گذاری <Glyph icon={Share} /> را در نوار آدرس بزنید.
            </>
          ) : (
            <>
              در Safari دکمه اشتراک‌گذاری <Glyph icon={Share} /> را بزنید.
              <span className="mt-1 block text-[11.5px] leading-5 text-[#5c6b5c]">
                در iOS 26 ابتدا دکمه <Glyph icon={Ellipsis} /> کنار نوار آدرس را بزنید.
              </span>
            </>
          )}
        </Step>
        <Step index={2}>
          گزینه <Glyph icon={SquarePlus} />
          <b className="font-black">«Add to Home Screen»</b> یا «افزودن به صفحه اصلی» را انتخاب کنید.
          <span className="mt-1 block text-[11.5px] leading-5 text-[#5c6b5c]">اگر دیده نمی‌شود، فهرست را کمی به بالا بکشید.</span>
        </Step>
        <Step index={3}>
          در گوشه بالا <b className="font-black">«Add»</b> را بزنید؛ آیکون کشاورز روی صفحه اصلی ظاهر می‌شود.
        </Step>
      </ol>
    </>
  );
}

function InAppBrowserGuide() {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2_000);
    } catch {
      toast.error("کپی نشد", window.location.origin);
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-[20px] bg-[#fff5e6] p-4 text-[13px] leading-6 text-[#5c3a10] ring-1 ring-[#f3dcb8]">
        این صفحه داخل یک برنامه دیگر (مثل تلگرام یا اینستاگرام) باز شده و از آن‌جا نمی‌توان اپلیکیشن را نصب کرد.
        از منوی <Glyph icon={Ellipsis} /> گزینه «باز کردن در مرورگر» را بزنید، یا لینک را کپی کرده و در{" "}
        <b className="font-black">Safari</b> یا <b className="font-black">Chrome</b> باز کنید.
      </div>
      <button
        type="button"
        onClick={() => void copyLink()}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 text-[13.5px] font-bold text-[#1a2e1a] ring-1 ring-[#e3ebe3] transition active:scale-[0.98]"
      >
        {copied ? <Check className="size-4 text-[#2d6a4f]" /> : <Copy className="size-4" />}
        {copied ? "لینک کپی شد" : "کپی لینک کشاورز"}
      </button>
    </div>
  );
}
