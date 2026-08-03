import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/utils/format";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label?: string;
  };
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  className,
}: StatCardProps) {
  const displayValue =
    typeof value === "number" ? toPersianDigits(value) : value;
  const isPositive = trend ? trend.value >= 0 : true;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-surface to-background p-4 shadow-sm",
        "before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-gradient-to-l before:from-primary before:to-success",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-primary">
            {displayValue}
          </p>
          {trend ? (
            <div
              className={cn(
                "mt-2 inline-flex items-center gap-1 text-xs font-medium",
                isPositive ? "text-success" : "text-destructive",
              )}
            >
              {isPositive ? (
                <TrendingUp className="size-3.5" />
              ) : (
                <TrendingDown className="size-3.5" />
              )}
              <span>{toPersianDigits(Math.abs(trend.value))}٪</span>
              {trend.label ? (
                <span className="text-muted-foreground">{trend.label}</span>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" strokeWidth={1.75} />
        </div>
      </div>
    </div>
  );
}
