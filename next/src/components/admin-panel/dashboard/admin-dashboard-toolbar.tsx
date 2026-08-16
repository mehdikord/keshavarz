"use client";

import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  formatDashboardDateTime,
  type DashboardRangePreset,
} from "@/lib/api/admin-dashboard";
import { cn } from "@/lib/utils";

const PRESETS: Array<{ id: DashboardRangePreset; label: string }> = [
  { id: "7d", label: "۷ روز" },
  { id: "30d", label: "۳۰ روز" },
  { id: "90d", label: "۹۰ روز" },
];

interface AdminDashboardToolbarProps {
  preset: DashboardRangePreset | "custom";
  from: string;
  to: string;
  timezone: string;
  loading?: boolean;
  onPresetChange: (preset: DashboardRangePreset) => void;
  onRefresh: () => void;
}

export function AdminDashboardToolbar({
  preset,
  from,
  to,
  timezone,
  loading,
  onPresetChange,
  onRefresh,
}: AdminDashboardToolbarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-panel)] p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((item) => (
          <Button
            key={item.id}
            type="button"
            size="sm"
            variant={preset === item.id ? "default" : "outline"}
            className={cn("h-9 rounded-lg", preset === item.id && "shadow-sm")}
            onClick={() => onPresetChange(item.id)}
            disabled={loading}
          >
            {item.label}
          </Button>
        ))}
        {preset === "custom" ? (
          <span className="rounded-lg bg-muted px-2.5 py-1.5 text-xs text-muted-foreground">
            بازه سفارشی
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="text-xs text-muted-foreground">
          <span className="block sm:inline">
            {formatDashboardDateTime(from)}
          </span>
          <span className="mx-1 hidden sm:inline">→</span>
          <span className="block sm:inline">
            {formatDashboardDateTime(to)}
          </span>
          <span className="mt-1 block text-[11px] sm:mt-0 sm:mr-2 sm:inline">
            · {timezone}
          </span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 rounded-lg"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          بروزرسانی
        </Button>
      </div>
    </div>
  );
}
