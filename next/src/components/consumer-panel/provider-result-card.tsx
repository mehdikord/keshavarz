"use client";

import {
  BadgeCheck,
  Clock3,
  MapPin,
  Send,
  UserRound,
  XCircle,
} from "lucide-react";
import { motion } from "framer-motion";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDistance, formatPrice } from "@/lib/utils/format";

export type ProviderResultState =
  | "idle"
  | "sent"
  | "rejected"
  | "accepted"
  | "removed";

const PRICING_UNIT_LABELS: Record<string, string> = {
  fixed: "قیمت پایه",
  per_hectare: "هر هکتار",
  per_square_meter: "هر متر مربع",
  per_hour: "هر ساعت",
  per_day: "هر روز",
};

const CARD_STATE_CLASS: Record<
  Exclude<ProviderResultState, "removed">,
  string
> = {
  idle: "border-border/70",
  sent: "border-amber-200/80",
  rejected: "border-red-200/60",
  accepted: "border-emerald-200/80",
};

interface ProviderResultCardProps {
  providerId: string;
  displayName: string;
  image?: string | null;
  distanceKm: number;
  price: number;
  pricingUnit?: string;
  state: ProviderResultState;
  onSend?: () => void;
}

function ProviderActionBar({
  state,
  displayName,
  onSend,
}: {
  state: Exclude<ProviderResultState, "removed">;
  displayName: string;
  onSend?: () => void;
}) {
  if (state === "idle") {
    return (
      <motion.div
        key="send"
        className="w-full"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        <Button
          type="button"
          className="h-11 w-full rounded-xl"
          onClick={onSend}
          aria-label={`ارسال درخواست به ${displayName}`}
        >
          <Send className="size-4" strokeWidth={2} aria-hidden="true" />
          ارسال درخواست
        </Button>
      </motion.div>
    );
  }

  const configs = {
    sent: {
      className: "border-amber-200 bg-amber-50 text-amber-700",
      icon: Clock3,
      label: "در انتظار تأیید",
    },
    rejected: {
      className: "border-red-200 bg-red-50 text-red-600",
      icon: XCircle,
      label: "پذیرفته نشد",
    },
    accepted: {
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      icon: BadgeCheck,
      label: "تخصیص یافت",
    },
  } as const;

  const config = configs[state];
  const Icon = config.icon;

  return (
    <motion.div
      key={state}
      className="w-full"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      <div
        role="status"
        className={cn(
          "flex h-11 w-full items-center justify-center gap-2 rounded-xl border text-sm font-semibold",
          config.className,
        )}
      >
        <Icon className="size-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
        <span>{config.label}</span>
      </div>
    </motion.div>
  );
}

export function ProviderResultCard({
  displayName,
  image,
  distanceKm,
  price,
  pricingUnit = "fixed",
  state,
  onSend,
}: ProviderResultCardProps) {
  if (state === "removed") {
    return null;
  }

  const pricingUnitLabel =
    PRICING_UNIT_LABELS[pricingUnit] ?? PRICING_UNIT_LABELS.fixed;

  return (
    <Card
      className={cn(
        "animate-slide-up overflow-hidden rounded-2xl bg-surface p-4 shadow-[0_4px_12px_rgba(45,106,79,0.06)] transition-colors duration-200",
        CARD_STATE_CLASS[state],
      )}
    >
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <Avatar
            size="lg"
            className="shrink-0 border-2 border-primary/10 bg-surface shadow-sm"
          >
            {image ? <AvatarImage src={image} alt={displayName} /> : null}
            <AvatarFallback className="bg-gradient-to-br from-primary/10 to-accent/10 text-primary">
              <UserRound className="size-5" aria-hidden="true" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="break-words text-[15px] font-bold leading-snug text-foreground">
              {displayName}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-3.5 py-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <MapPin
              className="size-3.5 shrink-0 text-primary/60"
              aria-hidden="true"
            />
            {formatDistance(distanceKm)}
          </span>
          <span className="text-left">
            <span className="block text-sm font-bold text-primary tabular-nums">
              {formatPrice(price)}
            </span>
            <span className="mt-0.5 block text-[10px] font-medium text-muted-foreground/80">
              {pricingUnitLabel}
            </span>
          </span>
        </div>

        <ProviderActionBar
          state={state}
          displayName={displayName}
          onSend={onSend}
        />
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