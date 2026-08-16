"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  MapPin,
  Phone,
  ShieldAlert,
  UserRound,
} from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { MapPicker } from "@/components/shared/map-picker";
import { PriceDisplay } from "@/components/shared/price-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
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
import {
  cancelConsumerRequest,
  completeConsumerRequest,
  fetchConsumerRequest,
  type AppConsumerRequestDetail,
} from "@/lib/api/app-requests";
import { isApiClientError } from "@/lib/api/envelope";
import { toast } from "@/lib/toast";
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

const PROVIDER_STATUS_LABELS: Record<string, string> = {
  sent: "در انتظار تأیید",
  rejected: "رد شده",
  accepted: "پذیرفته شده",
  removed: "حذف شده",
};

function landLocation(
  land: AppConsumerRequestDetail["land"],
): GeoLocation | null {
  if (!land.latitude || !land.longitude) return null;
  return {
    lat: Number(land.latitude),
    lng: Number(land.longitude),
  };
}

export default function ConsumerRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const [request, setRequest] = useState<AppConsumerRequestDetail | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const controller = new AbortController();

    void fetchConsumerRequest(params.id, controller.signal)
      .then((detail) => {
        if (controller.signal.aborted) return;
        setRequest(detail);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setRequest(null);
        if (!isApiClientError(cause) || cause.status !== 404) {
          toast.error(
            isApiClientError(cause)
              ? cause.message
              : "بارگذاری درخواست ناموفق بود",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [params.id, user, reloadKey]);

  const location = useMemo(
    () => (request ? landLocation(request.land) : null),
    [request],
  );

  const assignedProvider = useMemo(() => {
    if (!request) return null;
    return (
      request.providers.find(
        (item) =>
          item.providerId === request.assignedProviderId ||
          item.status === "accepted",
      ) ?? null
    );
  }, [request]);

  const linkedProviders = useMemo(() => {
    if (!request) return [];
    return request.providers.filter((item) => item.status !== "removed");
  }, [request]);

  const refetchDetail = () => {
    setLoading(true);
    setReloadKey((key) => key + 1);
  };

  const handleCancel = async () => {
    if (!request) return;

    if (request.status === "in_progress" && cancelReason.trim().length < 3) {
      toast.error("دلیل لغو را وارد کنید");
      return;
    }

    setSubmitting(true);
    try {
      await cancelConsumerRequest(request.requestId, {
        expectedVersion: request.version,
        reason:
          request.status === "in_progress"
            ? cancelReason.trim()
            : "لغو توسط خدمات‌گیرنده",
      });
      setCancelOpen(false);
      setCancelReason("");
      toast.success("درخواست لغو شد");
      refetchDetail();
    } catch (cause: unknown) {
      toast.error(
        isApiClientError(cause) ? cause.message : "لغو درخواست ناموفق بود",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!request) return;

    setSubmitting(true);
    try {
      await completeConsumerRequest(request.requestId, {
        expectedVersion: request.version,
      });
      setCompleteOpen(false);
      toast.success("کار با موفقیت پایان یافت");
      refetchDetail();
    } catch (cause: unknown) {
      toast.error(
        isApiClientError(cause) ? cause.message : "تأیید پایان کار ناموفق بود",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <PageContainer withDock>
        <PageHeader title="جزئیات درخواست" backHref="/users/requests" />
        <LoadingSpinner className="py-16" />
      </PageContainer>
    );
  }

  if (!request) {
    return (
      <PageContainer withDock>
        <PageHeader title="جزئیات درخواست" backHref="/users/requests" />
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            درخواست یافت نشد
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const status = request.status as RequestStatus;
  const areaSqm = request.land.areaSquareMeters
    ? Number(request.land.areaSquareMeters)
    : null;
  const showPhone =
    (status === "in_progress" || status === "completed") &&
    assignedProvider?.phone;

  return (
    <PageContainer withDock>
      <PageHeader
        title="جزئیات درخواست"
        description={request.serviceName}
        backHref="/users/requests"
      />

      <div className="space-y-4 animate-fade-in">
        <Card className="card-elevated border-border/70">
          <CardContent className="space-y-4 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">
                  {request.serviceCategoryName}
                </p>
                <h2 className="text-lg font-bold">{request.serviceName}</h2>
              </div>
              <StatusBadge status={status} />
            </div>

            <div className="grid gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="size-4 text-accent" />
                {request.land.title}
                {areaSqm ? ` · ${toPersianDigits(areaSqm)} m²` : ""}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="size-4 text-accent" />
                {request.dates.map((date) => formatDate(date)).join(" · ")}
              </div>
              {request.assignedProviderName ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <UserRound className="size-4 text-accent" />
                  {request.assignedProviderName}
                </div>
              ) : null}
              {showPhone ? (
                <a
                  href={`tel:${assignedProvider!.phone}`}
                  dir="ltr"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
                >
                  <Phone className="size-4 shrink-0" />
                  {assignedProvider!.phone}
                </a>
              ) : status === "in_progress" || status === "completed" ? (
                <div className="inline-flex items-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  <ShieldAlert className="size-4 shrink-0 text-accent" />
                  شماره تماس در دسترس نیست
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  <ShieldAlert className="size-4 shrink-0 text-accent" />
                  پس از قبول درخواست، شماره تماس نمایش داده می‌شود
                </div>
              )}
            </div>

            <div className="rounded-xl bg-muted/50 px-3 py-2">
              <p className="text-xs text-muted-foreground">قیمت</p>
              <PriceDisplay
                amount={
                  request.agreedPriceToman && request.agreedPriceToman > 0
                    ? request.agreedPriceToman
                    : 0
                }
                size="lg"
              />
              {!request.agreedPriceToman || request.agreedPriceToman <= 0 ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  قیمت پس از قبول
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {location ? (
          <Card className="overflow-hidden border-border/70">
            <CardContent className="p-4">
              <p className="mb-3 text-sm font-semibold">موقعیت زمین</p>
              <MapPicker value={location} interactive={false} />
            </CardContent>
          </Card>
        ) : null}

        {request.status === "pending_provider" && linkedProviders.length > 0 ? (
          <Card className="border-border/70">
            <CardContent className="space-y-3 p-4">
              <p className="text-sm font-semibold">وضعیت خدمات‌دهندگان</p>
              {linkedProviders.map((item) => (
                <div
                  key={item.providerId}
                  className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5"
                >
                  <span className="text-sm">{item.name}</span>
                  <Badge variant="outline">
                    {PROVIDER_STATUS_LABELS[item.status] ?? item.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {request.status === "cancelled" && request.cancelReason ? (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-4 text-sm">
              <p className="font-semibold text-destructive">دلیل لغو</p>
              <p className="mt-1 text-muted-foreground">{request.cancelReason}</p>
            </CardContent>
          </Card>
        ) : null}

        {request.status === "pending_provider" ? (
          <Button
            variant="outline"
            className="h-11 w-full rounded-xl border-destructive/30 text-destructive"
            onClick={() => setCancelOpen(true)}
          >
            لغو درخواست
          </Button>
        ) : null}

        {request.status === "in_progress" ? (
          <div className="grid gap-3">
            <Button
              className="h-11 rounded-xl bg-gradient-to-l from-primary to-success"
              onClick={() => setCompleteOpen(true)}
            >
              <CheckCircle2 className="size-4" />
              پایان کار
            </Button>
            <Button
              variant="outline"
              className="h-11 rounded-xl border-destructive/30 text-destructive"
              onClick={() => setCancelOpen(true)}
            >
              لغو درخواست
            </Button>
          </div>
        ) : null}
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>لغو درخواست</DialogTitle>
            <DialogDescription>
              {request.status === "in_progress"
                ? "لطفاً دلیل لغو را بنویسید."
                : "آیا از لغو این درخواست مطمئن هستید؟"}
            </DialogDescription>
          </DialogHeader>
          {request.status === "in_progress" ? (
            <div className="space-y-2">
              <Label htmlFor="cancelReason">دلیل لغو</Label>
              <Textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
              />
            </div>
          ) : null}
          <DialogFooter className="gap-2 sm:justify-start">
            <Button
              variant="outline"
              onClick={() => setCancelOpen(false)}
              disabled={submitting}
            >
              انصراف
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleCancel()}
              disabled={submitting}
            >
              تأیید لغو
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        title="پایان کار"
        description="آیا کار انجام‌شده را تأیید می‌کنید؟ پس از تأیید، درخواست به وضعیت پایان‌یافته منتقل می‌شود."
        confirmLabel="تأیید پایان کار"
        loading={submitting}
        onConfirm={() => void handleComplete()}
      />
    </PageContainer>
  );
}
