"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CalendarDays,
  LoaderCircle,
  MapPin,
  Phone,
  ShieldAlert,
  UserRound,
} from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { MapPicker } from "@/components/shared/map-picker";
import { PriceDisplay } from "@/components/shared/price-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { canShowPhone } from "@/lib/contact-privacy";
import { isApiClientError } from "@/lib/api/envelope";
import {
  acceptProviderRequest,
  cancelProviderRequest,
  fetchProviderRequest,
  rejectProviderRequest,
  viewProviderRequest,
  type AppProviderRequestDetail,
} from "@/lib/api/app-requests";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/utils/format";
import { useAuthStore } from "@/stores/auth-store";
import type { GeoLocation, RequestStatus } from "@/types";

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

function landToLocation(
  land: AppProviderRequestDetail["land"],
): GeoLocation | null {
  if (!land.latitude || !land.longitude) return null;
  return {
    lat: Number(land.latitude),
    lng: Number(land.longitude),
  };
}

function ProviderConsumerPhone({
  detail,
  className,
}: {
  detail: AppProviderRequestDetail;
  className?: string;
}) {
  const maskedMessage = "پس از قبول درخواست، شماره تماس نمایش داده می‌شود";

  if (!canShowPhone(detail.status as RequestStatus)) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground",
          className,
        )}
      >
        <ShieldAlert className="size-4 shrink-0 text-accent" />
        {maskedMessage}
      </div>
    );
  }

  if (detail.consumer.phone) {
    return (
      <a
        href={`tel:${detail.consumer.phone}`}
        dir="ltr"
        className={cn(
          "inline-flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/15",
          className,
        )}
      >
        <Phone className="size-4 shrink-0" />
        {detail.consumer.phone}
      </a>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground",
        className,
      )}
    >
      <ShieldAlert className="size-4 shrink-0 text-accent" />
      {maskedMessage}
    </div>
  );
}

export default function ProviderRequestDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);

  const [detail, setDetail] = useState<AppProviderRequestDetail | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "not_found">(
    "loading",
  );
  const [actionBusy, setActionBusy] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const viewedRef = useRef(false);

  const reloadDetail = useCallback(async (signal?: AbortSignal) => {
    return fetchProviderRequest(params.id, signal);
  }, [params.id]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    viewedRef.current = false;

    void (async () => {
      try {
        const nextDetail = await reloadDetail(controller.signal);
        if (cancelled) return;

        setDetail(nextDetail);
        setLoadState("ready");

        if (
          !viewedRef.current &&
          nextDetail.linkStatus === "sent" &&
          !nextDetail.viewedAt
        ) {
          viewedRef.current = true;
          try {
            await viewProviderRequest(nextDetail.requestId);
            const refreshed = await reloadDetail(controller.signal);
            if (!cancelled) setDetail(refreshed);
          } catch {
            // Non-blocking: viewing is best-effort.
          }
        }
      } catch (cause: unknown) {
        if (cancelled || controller.signal.aborted) return;

        if (isApiClientError(cause) && cause.status === 404) {
          setLoadState("not_found");
          return;
        }

        toast.error(
          isApiClientError(cause)
            ? cause.message
            : "بارگذاری جزئیات درخواست ناموفق بود.",
        );
        setLoadState("not_found");
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [reloadDetail]);

  const landLocation = useMemo(
    () => (detail ? landToLocation(detail.land) : null),
    [detail],
  );

  const displayPrice =
    detail?.agreedPriceToman ?? detail?.priceToman ?? 0;

  if (!user) return null;

  if (loadState === "loading") {
    return (
      <PageContainer withDock>
        <PageHeader title="جزئیات درخواست" backHref="/providers/requests" />
        <div className="flex justify-center py-16">
          <LoaderCircle className="size-8 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }

  if (loadState === "not_found" || !detail) {
    return (
      <PageContainer withDock>
        <PageHeader title="جزئیات درخواست" backHref="/providers/requests" />
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            درخواست یافت نشد
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const canRespond =
    detail.linkStatus === "sent" && detail.status === "pending_provider";
  const canCancel =
    detail.status === "in_progress" && detail.isAssigned;

  const handleAccept = async () => {
    setActionBusy(true);
    try {
      await acceptProviderRequest(detail.requestId, {
        expectedVersion: detail.version,
      });
      const refreshed = await reloadDetail();
      setDetail(refreshed);
      toast.success("درخواست پذیرفته شد");
      router.push("/providers/requests");
    } catch (cause: unknown) {
      toast.error(
        isApiClientError(cause) ? cause.message : "پذیرش درخواست ناموفق بود.",
      );
    } finally {
      setActionBusy(false);
    }
  };

  const handleReject = async () => {
    setActionBusy(true);
    try {
      await rejectProviderRequest(detail.requestId, {
        expectedVersion: detail.version,
      });
      const refreshed = await reloadDetail();
      setDetail(refreshed);
      toast.info("درخواست رد شد");
      router.push("/providers/requests");
    } catch (cause: unknown) {
      toast.error(
        isApiClientError(cause) ? cause.message : "رد درخواست ناموفق بود.",
      );
    } finally {
      setActionBusy(false);
    }
  };

  const handleCancel = async () => {
    if (cancelReason.trim().length < 3) {
      toast.error("دلیل لغو را وارد کنید");
      return;
    }

    setActionBusy(true);
    try {
      await cancelProviderRequest(detail.requestId, {
        expectedVersion: detail.version,
        reason: cancelReason.trim(),
      });
      const refreshed = await reloadDetail();
      setDetail(refreshed);
      setCancelOpen(false);
      toast.success("درخواست لغو شد");
      router.push("/providers/requests");
    } catch (cause: unknown) {
      toast.error(
        isApiClientError(cause) ? cause.message : "لغو درخواست ناموفق بود.",
      );
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <PageContainer withDock>
      <PageHeader
        title="جزئیات درخواست"
        description={detail.serviceName}
        backHref="/providers/requests"
      />

      <div className="space-y-4 animate-fade-in">
        <Card className="card-elevated border-border/70">
          <CardContent className="space-y-4 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">
                  {detail.serviceCategoryName}
                </p>
                <h2 className="text-lg font-bold">{detail.serviceName}</h2>
              </div>
              <StatusBadge status={detail.status as RequestStatus} />
            </div>

            <div className="grid gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <UserRound className="size-4 text-primary" />
                {detail.consumer.name}
              </div>
              <ProviderConsumerPhone detail={detail} />
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="size-4 text-primary" />
                {detail.land.title}
                {detail.land.areaSquareMeters
                  ? ` · ${toPersianDigits(detail.land.areaSquareMeters)} m²`
                  : ""}
                {detail.distanceKm > 0
                  ? ` · ${toPersianDigits(detail.distanceKm.toFixed(1))} km`
                  : ""}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="size-4 text-primary" />
                {detail.dates.map((date) => formatDate(date)).join(" · ")}
              </div>
            </div>

            {detail.consumerNote ? (
              <div className="rounded-xl bg-muted/50 px-3 py-2 text-sm">
                <p className="text-xs text-muted-foreground">یادداشت مشتری</p>
                <p className="mt-1">{detail.consumerNote}</p>
              </div>
            ) : null}

            <div className="rounded-xl bg-muted/50 px-3 py-2">
              <p className="text-xs text-muted-foreground">قیمت</p>
              <PriceDisplay amount={displayPrice > 0 ? displayPrice : 0} size="lg" />
            </div>

            <p className="text-xs text-muted-foreground">
              ایجاد: {formatDate(detail.createdAt)}
            </p>
          </CardContent>
        </Card>

        {landLocation ? (
          <Card className="overflow-hidden border-border/70">
            <CardContent className="p-4">
              <p className="mb-3 text-sm font-semibold">موقعیت زمین</p>
              <MapPicker value={landLocation} interactive={false} />
            </CardContent>
          </Card>
        ) : null}

        {detail.status === "cancelled" && detail.cancelReason ? (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-4 text-sm">
              <p className="font-semibold text-destructive">دلیل لغو</p>
              <p className="mt-1 text-muted-foreground">{detail.cancelReason}</p>
            </CardContent>
          </Card>
        ) : null}

        {canRespond ? (
          <div className="grid grid-cols-2 gap-3">
            <Button
              className="h-11 rounded-xl"
              onClick={() => void handleAccept()}
              disabled={actionBusy}
            >
              {actionBusy ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                "قبول درخواست"
              )}
            </Button>
            <Button
              variant="outline"
              className="h-11 rounded-xl border-destructive/30 text-destructive"
              onClick={() => void handleReject()}
              disabled={actionBusy}
            >
              رد درخواست
            </Button>
          </div>
        ) : null}

        {canCancel ? (
          <Button
            variant="destructive"
            className="h-11 w-full rounded-xl"
            onClick={() => setCancelOpen(true)}
            disabled={actionBusy}
          >
            لغو درخواست
          </Button>
        ) : null}
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>لغو درخواست</DialogTitle>
            <DialogDescription>
              لطفاً دلیل لغو را بنویسید. این فیلد اجباری است.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cancelReason">دلیل لغو</Label>
            <Textarea
              id="cancelReason"
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              placeholder="مثلاً عدم دسترسی به تجهیزات در تاریخ مقرر"
            />
          </div>
          <DialogFooter className="gap-2 sm:justify-start">
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              انصراف
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleCancel()}
              disabled={actionBusy}
            >
              تأیید لغو
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
