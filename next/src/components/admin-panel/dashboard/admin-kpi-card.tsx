"use client";

import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface AdminKpiCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: "default" | "success" | "warning" | "danger";
  className?: string;
}

const TONE_STYLES = {
  default: {
    accent: "bg-primary",
    icon: "bg-primary/10 text-primary",
  },
  success: {
    accent: "bg-success",
    icon: "bg-success/10 text-success",
  },
  warning: {
    accent: "bg-accent",
    icon: "bg-accent/20 text-accent-foreground",
  },
  danger: {
    accent: "bg-destructive",
    icon: "bg-destructive/10 text-destructive",
  },
} as const;

export function AdminKpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  className,
}: AdminKpiCardProps) {
  const styles = TONE_STYLES[tone];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4 shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <span
        className={cn("absolute inset-y-0 right-0 w-1", styles.accent)}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-3 pr-2">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="truncate text-2xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          {hint ? (
            <p className="text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            styles.icon,
          )}
        >
          <Icon className="size-5" strokeWidth={1.75} />
        </div>
      </div>
    </div>
  );
}
