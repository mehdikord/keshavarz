import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { Tooltip } from "@/components/admin/ui/tooltip";
import { percentChange } from "@/lib/admin/format";
import { cn } from "@/lib/utils";

import { faDecimal, formatValue, type ValueKind } from "./report-format";

export interface KpiItem {
  current: number | null;
  /** Shown under the value: what exactly is counted. */
  hint: string;
  kind: ValueKind;
  label: string;
  /** Lower is better (cancellations, waiting time). */
  lowerIsBetter?: boolean;
  previous: number | null;
}

function Delta({ item }: { item: KpiItem }) {
  if (item.current === null || item.previous === null) {
    return <span className="text-muted-foreground">بدون داده برای مقایسه</span>;
  }
  // Rates compare in percentage points; everything else as a relative change.
  const isRate = item.kind === "percent";
  const change = isRate ? item.current - item.previous : percentChange(item.current, item.previous);
  if (change === null) return <span className="text-muted-foreground">بازه قبل صفر بود</span>;
  if (Math.abs(change) < 0.05) {
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <Minus aria-hidden className="size-3.5" />
        بدون تغییر
      </span>
    );
  }
  const up = change > 0;
  const good = item.lowerIsBetter ? !up : up;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn("inline-flex items-center gap-0.5 font-bold", good ? "text-ok" : "text-danger")}>
        <Icon aria-hidden className="size-3.5" />
        {up ? "+" : "−"}
        {faDecimal(Math.abs(change))}
        {isRate ? " واحد درصد" : "٪"}
      </span>
      <span className="text-muted-foreground">{up ? "افزایش" : "کاهش"}</span>
    </span>
  );
}

export function KpiTiles({ items }: { items: KpiItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-line shadow-[var(--a-shadow-raise)] lg:grid-cols-4">
      {items.map((item) => (
        <div className="min-w-0 bg-card px-4 py-4 sm:px-5" key={item.label}>
          <Tooltip content={item.hint}>
            <p className="w-fit cursor-help text-[12px] font-medium text-muted-foreground decoration-dotted underline-offset-4 hover:underline" tabIndex={0}>
              {item.label}
            </p>
          </Tooltip>
          <p className="mt-2 truncate text-[20px] leading-tight font-extrabold tracking-tight text-foreground sm:text-[22px]">
            {formatValue(item.kind, item.current)}
          </p>
          <p className="mt-1.5 text-[11.5px]">
            <Delta item={item} />
          </p>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            قبل: {formatValue(item.kind, item.previous)}
          </p>
        </div>
      ))}
    </div>
  );
}
