"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ClipboardList,
  History,
  LandPlot,
  MapPin,
  Search,
  Tractor,
  Wallet,
  Wheat,
  Wrench,
} from "lucide-react";

import { cn } from "@/lib/utils";

type PanelKey = "provider" | "consumer";

const LAST_PANEL_KEY = "keshavarz:last-panel";

interface PanelConfig {
  key: PanelKey;
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  icon: typeof Tractor;
  orbitIcon: typeof Tractor;
  features: { icon: typeof Tractor; label: string }[];
}

const PANELS: [PanelConfig, PanelConfig] = [
  {
    key: "provider",
    href: "/providers/home",
    eyebrow: "پنل خدمات‌دهنده",
    title: "ارائه خدمات کشاورزی",
    description: "ادوات و خدمات خود را ثبت کنید، از کشاورزان منطقه درخواست بگیرید و درآمدتان را مدیریت کنید.",
    cta: "ورود به پنل خدمات‌دهنده",
    icon: Tractor,
    orbitIcon: Wrench,
    features: [
      { icon: Wrench, label: "ثبت خدمات" },
      { icon: ClipboardList, label: "مدیریت درخواست" },
      { icon: Wallet, label: "گزارش درآمد" },
    ],
  },
  {
    key: "consumer",
    href: "/users/home",
    eyebrow: "پنل خدمات‌گیرنده",
    title: "دریافت خدمات کشاورزی",
    description: "خدمات‌دهندگان نزدیک زمین خود را پیدا کنید، درخواست ثبت کنید و کار را تا پایان پیگیری کنید.",
    cta: "ورود به پنل خدمات‌گیرنده",
    icon: Wheat,
    orbitIcon: MapPin,
    features: [
      { icon: Search, label: "جستجوی خدمات" },
      { icon: LandPlot, label: "زمین‌های من" },
      { icon: ClipboardList, label: "پیگیری کار" },
    ],
  },
];

const THEMES: Record<
  PanelKey,
  {
    card: string;
    rows: string;
    glow: string;
    eyebrow: string;
    eyebrowDot: string;
    description: string;
    chip: string;
    ring: string;
    emblem: string;
    orbit: string;
    cta: string;
    ctaArrow: string;
    badge: string;
  }
> = {
  provider: {
    card: "bg-[linear-gradient(150deg,#123d2b_0%,#1f5c41_48%,#2d7a55_100%)] text-white shadow-[0_22px_44px_-18px_rgba(18,61,43,0.65)]",
    rows: "stroke-white/[0.07]",
    glow: "bg-[#95d5b2]/25",
    eyebrow: "bg-white/12 text-[#d8f3dc] ring-1 ring-white/10",
    eyebrowDot: "bg-[#95d5b2] shadow-[0_0_0_3px_rgba(149,213,178,0.25)]",
    description: "text-white/72",
    chip: "bg-white/10 text-white/90 ring-1 ring-white/10",
    ring: "border-white/12",
    emblem: "bg-gradient-to-br from-white/25 to-white/5 text-white ring-1 ring-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_12px_28px_-8px_rgba(0,0,0,0.45)]",
    orbit: "bg-[#f4a261] text-[#3d2914] shadow-lg shadow-black/20",
    cta: "bg-black/15 text-white ring-1 ring-white/10",
    ctaArrow: "bg-white text-[#1f5c41]",
    badge: "bg-[#f4a261] text-[#3d2914]",
  },
  consumer: {
    card: "bg-[linear-gradient(150deg,#fffaf0_0%,#fdefd6_50%,#f8dcae_100%)] text-[#3a2a12] ring-1 ring-[#e9c46a]/40 shadow-[0_22px_44px_-20px_rgba(201,122,30,0.45)]",
    rows: "stroke-[#c97a1e]/[0.09]",
    glow: "bg-[#ffd27f]/45",
    eyebrow: "bg-[#c97a1e]/12 text-[#8a4f0f] ring-1 ring-[#c97a1e]/15",
    eyebrowDot: "bg-[#e08a2b] shadow-[0_0_0_3px_rgba(224,138,43,0.2)]",
    description: "text-[#6b5434]",
    chip: "bg-white/70 text-[#5c4320] ring-1 ring-[#e9c46a]/40",
    ring: "border-[#c97a1e]/15",
    emblem: "bg-gradient-to-br from-[#ffb85c] to-[#e07b1f] text-white ring-1 ring-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_12px_28px_-8px_rgba(201,122,30,0.6)]",
    orbit: "bg-[#2d6a4f] text-white shadow-lg shadow-[#2d6a4f]/30",
    cta: "bg-[#3a2a12]/[0.06] text-[#3a2a12] ring-1 ring-[#c97a1e]/10",
    ctaArrow: "bg-[#2d6a4f] text-white",
    badge: "bg-[#2d6a4f] text-white",
  },
};

function readLastPanel(): PanelKey | null {
  try {
    const value = localStorage.getItem(LAST_PANEL_KEY);
    return value === "provider" || value === "consumer" ? value : null;
  } catch {
    return null;
  }
}

function rememberPanel(key: PanelKey) {
  try {
    localStorage.setItem(LAST_PANEL_KEY, key);
  } catch {
    // ignore quota / private mode
  }
}

export function PanelChoice() {
  // Rendered client-only behind AuthGuard, so reading storage on init is safe.
  const [lastPanel] = useState(readLastPanel);
  const [first, second] = PANELS;

  return (
    <section aria-labelledby="panel-choice-title" className="px-4">
      <div className="mb-4 px-1">
        <p className="text-[11px] font-bold text-primary">از کجا شروع کنیم؟</p>
        <h2
          id="panel-choice-title"
          className="mt-0.5 text-[21px] font-black leading-tight tracking-tight text-foreground"
        >
          امروز چه کاری انجام می‌دهید؟
        </h2>
        <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
          یکی از پنل‌ها را انتخاب کنید؛ هر زمان از منو قابل تغییر است.
        </p>
      </div>

      <div className="flex flex-col">
        <PanelCard panel={first} isLast={lastPanel === first.key} index={0} />
        <div
          aria-hidden
          className="relative z-10 mx-auto -my-3 flex size-9 items-center justify-center rounded-full border-4 border-background bg-surface text-[11px] font-black text-muted-foreground shadow-[0_4px_14px_rgba(45,106,79,0.18)]"
        >
          یا
        </div>
        <PanelCard panel={second} isLast={lastPanel === second.key} index={1} />
      </div>
    </section>
  );
}

function PanelCard({
  panel,
  isLast,
  index,
}: {
  panel: PanelConfig;
  isLast: boolean;
  index: number;
}) {
  const theme = THEMES[panel.key];
  const Icon = panel.icon;
  const OrbitIcon = panel.orbitIcon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.12 + index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      whileTap={{ scale: 0.975 }}
    >
      <Link
        href={panel.href}
        onClick={() => rememberPanel(panel.key)}
        className={cn(
          "group relative block overflow-hidden rounded-[30px] p-5 outline-none transition-transform duration-300 focus-visible:ring-4 focus-visible:ring-primary/40",
          theme.card,
        )}
      >
        {/* Furrowed-field texture + soft glow */}
        <svg
          aria-hidden
          viewBox="0 0 200 200"
          className="pointer-events-none absolute -left-10 -top-6 h-[125%] w-[70%]"
          fill="none"
        >
          {Array.from({ length: 9 }, (_, i) => (
            <path
              key={i}
              d={`M-20 ${30 + i * 20} C 50 ${10 + i * 20}, 120 ${50 + i * 20}, 220 ${20 + i * 20}`}
              className={theme.rows}
              strokeWidth="2"
            />
          ))}
        </svg>
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute -bottom-16 -left-10 size-48 rounded-full blur-3xl",
            theme.glow,
          )}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(100deg,transparent_30%,rgba(255,255,255,0.18)_50%,transparent_70%)] transition-transform duration-1000 ease-out group-hover:translate-x-full"
        />

        <div className="relative flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold",
                  theme.eyebrow,
                )}
              >
                <span className={cn("size-1.5 rounded-full", theme.eyebrowDot)} />
                {panel.eyebrow}
              </span>
              {isLast ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold",
                    theme.badge,
                  )}
                >
                  <History className="size-3" strokeWidth={2.5} />
                  آخرین بازدید
                </span>
              ) : null}
            </div>
            <h3 className="mt-3 text-[21px] font-black leading-tight tracking-tight">
              {panel.title}
            </h3>
            <p className={cn("mt-2 text-[12.5px] leading-6", theme.description)}>
              {panel.description}
            </p>
          </div>

          <div aria-hidden className="relative mt-1 size-[96px] shrink-0">
            <span className={cn("absolute inset-0 rounded-full border", theme.ring)} />
            <span className={cn("absolute inset-[13px] rounded-full border border-dashed", theme.ring)} />
            <span
              className={cn(
                "absolute inset-[22px] flex items-center justify-center rounded-[20px] transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105",
                theme.emblem,
              )}
            >
              <Icon className="size-8" strokeWidth={1.75} />
            </span>
            <span
              className={cn(
                "animate-float absolute -left-0.5 top-2 flex size-7 items-center justify-center rounded-full",
                theme.orbit,
              )}
            >
              <OrbitIcon className="size-3.5" strokeWidth={2.25} />
            </span>
          </div>
        </div>

        <ul className="relative mt-4 flex flex-wrap gap-1.5">
          {panel.features.map((feature) => {
            const FeatureIcon = feature.icon;
            return (
              <li
                key={feature.label}
                className={cn(
                  "inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold backdrop-blur-sm",
                  theme.chip,
                )}
              >
                <FeatureIcon className="size-3.5 opacity-80" strokeWidth={2} />
                {feature.label}
              </li>
            );
          })}
        </ul>

        <div
          className={cn(
            "relative mt-4 flex items-center justify-between gap-3 rounded-2xl py-2 pe-2 ps-4",
            theme.cta,
          )}
        >
          <span className="text-[13px] font-bold">{panel.cta}</span>
          <span
            className={cn(
              "flex size-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:-translate-x-1",
              theme.ctaArrow,
            )}
          >
            <ArrowLeft className="size-[18px]" strokeWidth={2.25} />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
