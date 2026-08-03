"use client";

import Link from "next/link";
import { CalendarDays, ChevronLeft, MapPin } from "lucide-react";

import { PriceDisplay } from "@/components/shared/price-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  countPendingProvidersForRequest,
  getProviderDisplayName,
  getServiceLabel,
} from "@/lib/utils/consumer-requests";
import { toPersianDigits } from "@/lib/utils/format";
import type { Land, Request, RequestProvider } from "@/types";

interface ConsumerRequestCardProps {
  request: Request;
  lands: Land[];
  requestProviders: RequestProvider[];
  showPendingActions?: boolean;
  onCancel?: () => void;
}

function formatScheduledDates(dates: string[]): string {
  const formatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    month: "short",
    day: "numeric",
  });
  return dates.map((date) => formatter.format(new Date(date))).join(" · ");
}

export function ConsumerRequestCard({
  request,
  lands,
  requestProviders,
  showPendingActions = false,
  onCancel,
}: ConsumerRequestCardProps) {
  const land = lands.find((item) => item.id === request.landId);
  const pendingCount = countPendingProvidersForRequest(
    request.id,
    requestProviders,
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
              {land?.title ?? "زمین نامشخص"}
            </p>
          </div>
          <StatusBadge status={request.status} />
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0 text-accent" />
            <span>
              {land ? `${toPersianDigits(land.areaSqm)} m²` : "—"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 shrink-0 text-accent" />
            <span>{formatScheduledDates(request.scheduledDates)}</span>
          </div>
        </div>

        {request.status === "pending_provider" && pendingCount > 0 ? (
          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">
            {toPersianDigits(pendingCount)} خدمات‌دهنده در انتظار
          </Badge>
        ) : null}

        {request.status === "in_progress" && request.assignedProviderId ? (
          <p className="text-sm text-muted-foreground">
            خدمات‌دهنده:{" "}
            <span className="font-medium text-foreground">
              {getProviderDisplayName(request.assignedProviderId)}
            </span>
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-3">
          <PriceDisplay
            amount={request.price > 0 ? request.price : 0}
            size="sm"
          />
          {request.price <= 0 ? (
            <span className="text-xs text-muted-foreground">قیمت پس از قبول</span>
          ) : null}
        </div>

        {showPendingActions ? (
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl border-destructive/30 text-destructive"
              onClick={onCancel}
            >
              لغو درخواست
            </Button>
            <Button asChild variant="secondary" className="h-10 rounded-xl">
              <Link href="/users/search">ارسال به بیشتر</Link>
            </Button>
          </div>
        ) : (
          <Button asChild variant="secondary" className="h-10 w-full rounded-xl">
            <Link href={`/users/requests/${request.id}`}>
              مشاهده جزئیات
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
