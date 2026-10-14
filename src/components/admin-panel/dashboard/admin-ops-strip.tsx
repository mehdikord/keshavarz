"use client";

import Link from "next/link";
import { Activity, HeartPulse, Wrench } from "lucide-react";

import { AdminSectionCard } from "@/components/admin-panel/shell/admin-section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatDashboardDateTime,
  type AdminHealth,
  type AdminMetrics,
} from "@/lib/api/admin-dashboard";
import { toPersianDigits } from "@/lib/utils/format";

interface AdminOpsStripProps {
  health: AdminHealth | null;
  metrics: AdminMetrics | null;
  healthError?: string | null;
  metricsError?: string | null;
}

export function AdminOpsStrip({
  health,
  metrics,
  healthError,
  metricsError,
}: AdminOpsStripProps) {
  const metricEntries = Object.entries(metrics?.metrics ?? {})
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4);

  return (
    <AdminSectionCard>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">وضعیت Ops</h2>
            {health ? (
              <Badge variant="success" className="rounded-md">
                <HeartPulse className="size-3.5" />
                نشست سالم
              </Badge>
            ) : (
              <Badge variant="destructive" className="rounded-md">
                مشکل سلامت
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Activity className="size-3.5" />
              Realm: {health?.realm ?? "—"}
            </span>
            {health ? (
              <span className="font-mono" dir="ltr">
                actor: {health.actorId}
              </span>
            ) : null}
            {metrics?.scrapedAt ? (
              <span>
                به‌روزرسانی متریک: {formatDashboardDateTime(metrics.scrapedAt)}
              </span>
            ) : null}
          </div>

          {healthError ? (
            <p className="text-xs text-destructive">{healthError}</p>
          ) : null}
          {metricsError ? (
            <p className="text-xs text-destructive">{metricsError}</p>
          ) : null}
        </div>

        <div className="flex flex-col items-stretch gap-3 sm:items-end">
          <div className="flex flex-wrap gap-2">
            {metricEntries.length === 0 ? (
              <span className="rounded-lg border border-dashed border-[var(--admin-border)] px-3 py-2 text-xs text-muted-foreground">
                هنوز متریک runtime ثبت نشده است.
              </span>
            ) : (
              metricEntries.map(([name, value]) => (
                <span
                  key={name}
                  className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-canvas)] px-3 py-2"
                >
                  <span className="block max-w-[10rem] truncate font-mono text-[10px] text-muted-foreground" dir="ltr">
                    {name}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {toPersianDigits(value)}
                  </span>
                </span>
              ))
            )}
          </div>

          <Button asChild variant="outline" size="sm" className="rounded-lg">
            <Link href="/admins/jobs">
              <Wrench className="size-4" />
              Jobs / Dead letters
            </Link>
          </Button>
        </div>
      </div>
    </AdminSectionCard>
  );
}
