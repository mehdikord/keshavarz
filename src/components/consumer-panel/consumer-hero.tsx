"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { AppMenuTrigger } from "@/components/layout/app-menu-trigger";
import { cn } from "@/lib/utils";

/** Glass button styling for controls placed on the golden hero. */
export const HARVEST_GLASS_BUTTON =
  "flex size-11 items-center justify-center rounded-2xl bg-white/45 text-[#4a2e12] ring-1 ring-white/70 backdrop-blur-md transition-colors hover:bg-white/65";

function WheatHills() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 430 110"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[110px] w-full"
    >
      <path d="M0 50 C 80 24 160 30 230 46 C 300 62 370 28 430 38 V110 H0Z" className="fill-[#f2b45c]" fillOpacity="0.55" />
      <path d="M0 72 C 100 48 200 86 290 66 C 350 54 395 58 430 66 V110 H0Z" className="fill-[#e6953f]" fillOpacity="0.5" />
      <g fill="none" className="stroke-[#8a4f17]" strokeOpacity="0.14" strokeWidth="1.2">
        <path d="M0 82 C 100 58 200 94 290 76 C 350 64 395 68 430 76" />
        <path d="M0 90 C 100 68 200 102 290 86 C 350 75 395 78 430 85" />
        <path d="M0 98 C 100 78 200 108 290 94 C 350 85 395 87 430 93" />
      </g>
      <path d="M0 96 C 110 80 230 112 330 94 C 375 86 405 88 430 92 V110 H0Z" className="fill-harvest-bg" />
    </svg>
  );
}

/** Sunrise-over-wheat backdrop shared by consumer panel headers. */
export function ConsumerHeroShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "relative isolate overflow-hidden bg-[linear-gradient(170deg,#fff6e0_0%,#ffe3ad_42%,#f8c372_78%,#f0a94f_100%)] text-[#3b2410]",
        className,
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="bg-grain absolute inset-0 opacity-[0.07] mix-blend-multiply" />
        <div className="absolute -left-24 -top-24 size-80 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.85)_0%,rgba(255,236,190,0.4)_40%,transparent_70%)]" />
        <div className="animate-sun-glow absolute left-10 top-20 size-12 rounded-full bg-gradient-to-br from-[#fffbe8] via-[#ffe08a] to-[#ffb84d]" />
        <div className="absolute -right-20 top-24 size-64 rounded-full bg-[#e8892c]/20 blur-3xl" />
      </div>
      <div className="relative px-5 pb-[4.5rem] pt-[calc(env(safe-area-inset-top,0px)+1rem)]">{children}</div>
      <WheatHills />
    </section>
  );
}

interface ConsumerPageHeroProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  backHref?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export function ConsumerPageHero({
  eyebrow = "پنل خدمات‌گیرنده",
  title,
  subtitle,
  backHref,
  actions,
  children,
}: ConsumerPageHeroProps) {
  return (
    <ConsumerHeroShell>
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          {backHref ? (
            <Link href={backHref} aria-label="بازگشت" className={cn(HARVEST_GLASS_BUTTON, "mt-1 size-10")}>
              <ChevronRight className="size-5" />
            </Link>
          ) : null}
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-[#a0561a]">{eyebrow}</p>
            <h1 className="mt-0.5 text-[26px] font-black leading-tight tracking-tight">{title}</h1>
            {subtitle ? <p className="mt-1 text-[12px] leading-5 text-[#6b4a26]">{subtitle}</p> : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          <AppMenuTrigger className={cn(HARVEST_GLASS_BUTTON, "hover:text-[#4a2e12]")} />
        </div>
      </header>
      {children}
    </ConsumerHeroShell>
  );
}
