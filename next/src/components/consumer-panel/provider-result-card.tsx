"use client";

import { Clock3, Send, UserRound, XCircle } from "lucide-react";

import { DistanceDisplay } from "@/components/shared/distance-display";
import { PriceDisplay } from "@/components/shared/price-display";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Request, RequestProvider } from "@/types";

export type ProviderResultState =
  | "idle"
  | "sent"
  | "rejected"
  | "accepted"
  | "removed";

interface ProviderResultCardProps {
  providerId: string;
  displayName: string;
  distanceKm: number;
  price: number;
  state: ProviderResultState;
  onSend?: () => void;
}

export function ProviderResultCard({
  displayName,
  distanceKm,
  price,
  state,
  onSend,
}: ProviderResultCardProps) {
  if (state === "removed") {
    return null;
  }

  return (
    <Card className="overflow-hidden border-border/70 transition-all hover:shadow-md">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <UserRound className="size-5" />
            </div>
            <div>
              <p className="font-semibold">{displayName}</p>
              <DistanceDisplay km={distanceKm} />
            </div>
          </div>
          <PriceDisplay amount={price} size="sm" />
        </div>

        {state === "idle" ? (
          <Button
            type="button"
            className="h-10 w-full rounded-xl bg-gradient-to-l from-accent to-[#e76f51] text-white hover:opacity-95"
            onClick={onSend}
          >
            <Send className="size-4" />
            ارسال درخواست
          </Button>
        ) : null}

        {state === "sent" ? (
          <Button
            type="button"
            disabled
            className="h-10 w-full rounded-xl border-amber-200 bg-amber-50 text-amber-800"
          >
            <Clock3 className="size-4" />
            در انتظار تأیید
          </Button>
        ) : null}

        {state === "rejected" ? (
          <div
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive",
            )}
          >
            <XCircle className="size-4 shrink-0" />
            درخواست توسط خدمات‌دهنده پذیرفته نشد
          </div>
        ) : null}

        {state === "accepted" ? (
          <div className="rounded-xl bg-emerald-50 px-3 py-2.5 text-center text-sm font-medium text-emerald-800">
            این درخواست به این خدمات‌دهنده تخصیص یافت
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function getProviderResultState(
  request: Request,
  requestProviders: RequestProvider[],
  providerId: string,
): ProviderResultState {
  if (request.status === "in_progress" || request.status === "completed") {
    return request.assignedProviderId === providerId ? "accepted" : "removed";
  }

  if (request.status === "cancelled") {
    return "removed";
  }

  const link = requestProviders.find(
    (item) => item.requestId === request.id && item.providerId === providerId,
  );

  if (!link) return "idle";
  if (link.status === "sent") return "sent";
  if (link.status === "rejected") return "rejected";
  if (link.status === "removed") return "removed";
  if (link.status === "accepted") return "accepted";

  return "idle";
}
