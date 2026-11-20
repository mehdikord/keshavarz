import { Download } from "lucide-react";

import { Panel, PanelHeader } from "@/components/admin/ui/panel";
import { toneDot } from "@/components/admin/ui/badge";
import { faNumber, formatPercent } from "@/lib/admin/format";
import type { Tone } from "@/lib/admin/labels";
import { cn } from "@/lib/utils";
import type { ReportPeriod } from "@/server/modules/admin/reports/report-period";
import { formatJalaliInput } from "@/server/modules/admin/reports/report-period";
import type { ReportDataset } from "@/server/modules/admin/reports/reports-admin.schemas";

import { formatValue, type ValueKind } from "./report-format";

/** Query string that reproduces the period (presets by name, custom ranges by Jalali dates). */
export function periodQuery(period: ReportPeriod): URLSearchParams {
  const params = new URLSearchParams({ period: period.preset });
  if (period.preset === "custom") {
    params.set("from", formatJalaliInput(period.from));
    params.set("to", formatJalaliInput(period.to));
  }
  return params;
}

export function ExportLink({
  canExport,
  dataset,
  period,
}: {
  canExport: boolean;
  dataset: ReportDataset;
  period: ReportPeriod;
}) {
  if (!canExport) return null;
  const params = periodQuery(period);
  params.set("dataset", dataset);
  return (
    <a
      className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-foreground/80 transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      download
      href={`/api/admins/v1/reports/export?${params.toString()}`}
    >
      <Download className="size-3.5" />
      خروجی CSV
    </a>
  );
}

export function ReportSection({
  action,
  children,
  className,
  description,
  title,
}: {
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  description?: React.ReactNode;
  title: string;
}) {
  return (
    <Panel className={cn("min-w-0", className)}>
      <PanelHeader action={action} description={description} title={title} />
      <div className="px-5 pb-5">{children}</div>
    </Panel>
  );
}

/** Horizontal bars for a ranked list; values in text tokens, bars in the series colour. */
export function BarList({
  emptyText = "داده‌ای برای این بازه نیست.",
  items,
  kind = "count",
  slot = 1,
}: {
  emptyText?: string;
  items: Array<{ detail?: React.ReactNode; label: React.ReactNode; value: number }>;
  kind?: ValueKind;
  slot?: 1 | 2 | 3;
}) {
  const max = Math.max(0, ...items.map((item) => item.value));
  if (items.length === 0 || max === 0) {
    return <p className="py-6 text-center text-[12.5px] text-muted-foreground">{emptyText}</p>;
  }
  return (
    <ul className="reports-viz grid gap-3">
      {items.map((item, index) => (
        <li className="grid gap-1.5" key={index}>
          <div className="flex items-baseline justify-between gap-3 text-[12.5px]">
            <span className="min-w-0 truncate font-semibold text-foreground">{item.label}</span>
            <span className="flex shrink-0 items-baseline gap-2 tabular-nums">
              {item.detail ? <span className="text-[11.5px] text-muted-foreground">{item.detail}</span> : null}
              <span className="font-semibold text-foreground">{formatValue(kind, item.value)}</span>
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{
                background: `var(--viz-${slot})`,
                width: item.value > 0 ? `${Math.max(2, (item.value / max) * 100)}%` : "0%",
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** One whole split into parts, with a legend that carries the numbers. */
export function SegmentedBar({
  items,
  label,
}: {
  items: Array<{ color: string; label: string; value: number }>;
  label: string;
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const visible = items.filter((item) => item.value > 0);
  return (
    <div className="reports-viz">
      <div aria-label={label} className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-muted" role="img">
        {visible.map((item) => (
          <div
            className="h-full first:rounded-r-full last:rounded-l-full"
            key={item.label}
            style={{ background: item.color, width: `${(item.value / total) * 100}%` }}
            title={`${item.label}: ${faNumber(item.value)}`}
          />
        ))}
      </div>
      <ul className="mt-3 grid gap-x-5 gap-y-2 text-[12.5px] sm:grid-cols-2">
        {items.map((item) => (
          <li className="flex items-center justify-between gap-3" key={item.label}>
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <span aria-hidden className="size-2.5 shrink-0 rounded-[3px]" style={{ background: item.color }} />
              {item.label}
            </span>
            <span className="flex items-baseline gap-2 tabular-nums">
              <span className="text-[11.5px] text-muted-foreground">
                {total ? formatPercent((item.value / total) * 100) : "۰٪"}
              </span>
              <span className="font-semibold text-foreground">{faNumber(item.value)}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** CSS colour for a status tone's dot, for SegmentedBar entries that are statuses. */
export function toneColor(tone: Tone): string {
  const dot = toneDot(tone);
  return {
    "bg-danger": "var(--a-danger)",
    "bg-info": "var(--a-info)",
    "bg-muted-foreground/60": "color-mix(in oklab, var(--muted-foreground) 60%, transparent)",
    "bg-ok": "var(--a-ok)",
    "bg-warn": "var(--a-warn)",
    "bg-wheat": "var(--a-wheat)",
  }[dot] ?? "var(--muted-foreground)";
}

export const TABLE = {
  td: "px-3 py-2.5 align-middle",
  th: "px-3 py-2.5 text-right text-[11.5px] font-semibold text-muted-foreground",
  tr: "border-t border-line",
} as const;
