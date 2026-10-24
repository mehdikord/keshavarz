"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { AppMenuTrigger } from "@/components/layout/app-menu-trigger";
import { FieldHills } from "@/components/shared/field-hills";
import { cn } from "@/lib/utils";

export interface ProviderHeroStat {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  warn?: boolean;
}

interface ProviderPageHeroProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  backHref?: string;
  /** Extra controls rendered before the menu button. */
  actions?: React.ReactNode;
  stats?: ProviderHeroStat[];
  children?: React.ReactNode;
}

/** Forest-sky page header shared by the provider panel pages. */
export function ProviderPageHero({
  eyebrow = "پنل خدمات‌دهنده",
  title,
  subtitle,
  backHref,
  actions,
  stats,
  children,
}: ProviderPageHeroProps) {
  return (
    <section className="relative isolate overflow-hidden bg-[linear-gradient(165deg,#071d14_0%,#0f3324_45%,#1b5038_80%,#24603f_100%)] text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="bg-grain absolute inset-0 opacity-[0.08] mix-blend-overlay" />
        <div className="absolute -left-20 -top-24 size-72 rounded-full bg-[radial-gradient(circle,rgba(255,209,128,0.3)_0%,transparent_65%)]" />
        <div className="absolute -right-24 top-10 size-64 rounded-full bg-[#40916c]/25 blur-3xl" />
      </div>

      <div className="relative px-5 pb-[4.5rem] pt-[calc(env(safe-area-inset-top,0px)+1rem)]">
        <header className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2.5">
            {backHref ? (
              <Link
                href={backHref}
                aria-label="بازگشت"
                className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur-md transition-colors hover:bg-white/20"
              >
                <ChevronRight className="size-5" />
              </Link>
            ) : null}
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-[#95d5b2]">{eyebrow}</p>
              <h1 className="mt-0.5 text-[26px] font-black leading-tight tracking-tight">{title}</h1>
              {subtitle ? (
                <p className="mt-1 text-[12px] leading-5 text-white/65">{subtitle}</p>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {actions}
            <AppMenuTrigger className="size-11 rounded-2xl bg-white/10 text-white ring-1 ring-white/15 backdrop-blur-md hover:bg-white/20 hover:text-white" />
          </div>
        </header>

        {stats?.length ? (
          <dl className={cn("mt-5 grid gap-2", stats.length === 4 ? "grid-cols-4" : "grid-cols-3")}>
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="rounded-2xl bg-white/[0.08] px-3 py-2.5 ring-1 ring-white/12 backdrop-blur-xl"
                >
                  <dt className="flex items-center gap-1 truncate text-[10.5px] font-medium text-white/60">
                    <Icon className="size-3.5 shrink-0" />
                    {stat.label}
                  </dt>
                  <dd
                    className={cn(
                      "mt-1 truncate text-[13px] font-black",
                      stat.warn && "text-[#ffd27f]",
                    )}
                  >
                    {stat.value}
                  </dd>
                </div>
              );
            })}
          </dl>
        ) : null}

        {children}
      </div>

      <FieldHills />
    </section>
  );
}
