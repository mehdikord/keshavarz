"use client";

import Link from "next/link";
import { CalendarDays, ChevronLeft, MapPin } from "lucide-react";

import { PriceDisplay } from "@/components/shared/price-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLandsForUser } from "@/lib/mock/users";
import {
  getServiceLabel,
  getUserDisplayName,
} from "@/lib/utils/provider-requests";
import { toPersianDigits } from "@/lib/utils/format";
import type { Request } from "@/types";

interface ProviderRequestCardProps {
  request: Request;
  showQuickActions?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
}

function formatScheduledDates(dates: string[]): string {
  if (dates.length === 0) return "تاریخ نامشخص";

  const formatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    month: "short",
    day: "numeric",
  });

  return dates.map((date) => formatter.format(new Date(date))).join(" · ");
}

export function ProviderRequestCard({
  request,
  showQuickActions = false,
  onAccept,
  onReject,
}: ProviderRequestCardProps) {
  const land = getLandsForUser(request.consumerId).find(
    (item) => item.id === request.landId,
  );

  return (
    <Card className="card-elevated overflow-hidden border-border/70">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-foreground">
              {getServiceLabel(request.serviceId)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {getUserDisplayName(request.consumerId)}
            </p>
          </div>
          <StatusBadge status={request.status} />
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0 text-primary" />
            <span className="truncate">
              {land?.title ?? "زمین نامشخص"}
              {land ? ` · ${toPersianDigits(land.areaSqm)} m²` : ""}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 shrink-0 text-primary" />
            <span>{formatScheduledDates(request.scheduledDates)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-3">
          <PriceDisplay
            amount={request.price > 0 ? request.price : 0}
            size="sm"
          />
          {request.price <= 0 ? (
            <span className="text-xs text-muted-foreground">قیمت پس از قبول</span>
          ) : null}
        </div>

        {showQuickActions ? (
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              className="h-10 rounded-xl"
              onClick={onAccept}
            >
              قبول درخواست
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/5"
              onClick={onReject}
            >
              رد درخواست
            </Button>
          </div>
        ) : (
          <Button asChild variant="secondary" className="h-10 w-full rounded-xl">
            <Link href={`/providers/requests/${request.id}`}>
              مشاهده جزئیات
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
