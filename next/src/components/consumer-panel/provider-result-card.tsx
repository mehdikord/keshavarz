"use client";

import { BadgeCheck, Clock3, Send, UserRound, XCircle, MapPin } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDistance } from "@/lib/utils/format";
import { formatPrice } from "@/lib/utils/format";

export type ProviderResultState =
  | "idle"
  | "sent"
  | "rejected"
  | "accepted"
  | "removed";

interface ProviderResultCardProps {
  providerId: string;
  displayName: string;
  image?: string | null;
  distanceKm: number;
  price: number;
  state: ProviderResultState;
  onSend?: () => void;
}

function StatusBadge({ state }: { state: Exclude<ProviderResultState, "idle" | "removed"> }) {
  const configs = {
    sent: {
      className: "bg-amber-50 text-amber-700 border border-amber-100",
      icon: Clock3,
      label: "در انتظار تأیید",
    },
    rejected: {
      className: "bg-red-50 text-red-700 border border-red-100",
      icon: XCircle,
      label: "پذیرفته نشد",
    },
    accepted: {
      className: "bg-emerald-50 text-emerald-700 border border-emerald-100",
      icon: BadgeCheck,
      label: "تخصیص یافت",
    },
  } as const;

  const config = configs[state];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
        config.className,
      )}
    >
      <Icon className="size-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
}

export function ProviderResultCard({
  displayName,
  image,
  distanceKm,
  price,
  state,
  onSend,
}: ProviderResultCardProps) {
  if (state === "removed") {
    return null;
  }

  const isIdle = state === "idle";

  return (
    <Card
      className={cn(
        "group overflow-hidden border-border/60 transition-all duration-200 hover:border-primary/30 hover:shadow-sm",
        "animate-slide-up",
      )}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative flex-shrink-0">
            <Avatar size="lg" className="border-2 border-primary/10 bg-surface">
              {image ? (
                <AvatarImage src={image} alt={displayName} />
              ) : null}
              <AvatarFallback className="bg-gradient-to-br from-primary/10 to-accent/10 text-primary">
                <UserRound className="size-5" aria-hidden="true" />
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate font-semibold text-foreground text-sm sm:text-base">
                {displayName}
              </p>
              {isIdle ? (
                <Button
                  type="button"
                  size="icon"
                  className="bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary p-1.5 rounded-full transition-colors"
                  onClick={onSend}
                  aria-label="ارسال درخواست به این خدمات‌دهنده"
                >
                  <Send className="size-4" strokeWidth={2} aria-hidden="true" />
                </Button>
              ) : (
                <StatusBadge state={state} />
              )}
            </div>

            <div className="mt-1.5 flex items-center gap-2.5 text-xs text-muted-foreground flex-wrap">
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5 text-primary/60" aria-hidden="true" />
                {formatDistance(distanceKm)}
              </span>
              <span className="flex items-center gap-1 text-primary font-medium tabular-nums">
                {formatPrice(price)}
              </span>
              <span className="text-[10px] text-muted-foreground/70">قیمت پایه</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function getProviderResultState(
  request: { status: string; assignedProviderId?: string; id: string },
  requestProviders: { requestId: string; providerId: string; status: string }[],
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