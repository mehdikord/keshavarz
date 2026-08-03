"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  MapPin,
  UserRound,
} from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ContactPhoneDisplay } from "@/components/shared/contact-phone-display";
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
import { getCategoryById, getServiceById } from "@/lib/mock/catalog";
import { toast } from "@/lib/toast";
import { toPersianDigits } from "@/lib/utils/format";
import {
  getProviderDisplayName,
} from "@/lib/utils/consumer-requests";
import { useAuthStore } from "@/stores/auth-store";
import { useConsumerStore } from "@/stores/consumer-store";
import { useRequestStore } from "@/stores/request-store";

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

const PROVIDER_STATUS_LABELS = {
  sent: "در انتظار تأیید",
  rejected: "رد شده",
  accepted: "پذیرفته شده",
  removed: "حذف شده",
} as const;

export default function ConsumerRequestDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const lands = useConsumerStore((state) => state.lands);
  const request = useRequestStore((state) =>
    state.getRequestById(params.id),
  );
  const requestProviders = useRequestStore((state) => state.requestProviders);
  const cancelRequest = useRequestStore((state) => state.cancelRequest);
  const completeRequest = useRequestStore((state) => state.completeRequest);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const land = useMemo(() => {
    if (!request) return null;
    return lands.find((item) => item.id === request.landId);
  }, [lands, request]);

  const linkedProviders = useMemo(() => {
    if (!request) return [];
    return requestProviders.filter((item) => item.requestId === request.id);
  }, [request, requestProviders]);

  if (!user || !request || request.consumerId !== user.id) {
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

  const service = getServiceById(request.serviceId);
  const category = service ? getCategoryById(service.categoryId) : null;

  const handleCancel = () => {
    if (request.status === "in_progress" && cancelReason.trim().length < 3) {
      toast.error("دلیل لغو را وارد کنید");
      return;
    }

    const error = cancelRequest(
      request.id,
      "consumer",
      request.status === "in_progress" ? cancelReason.trim() : "لغو توسط خدمات‌گیرنده",
    );
    if (error) {
      toast.error(error.message);
      return;
    }
    setCancelOpen(false);
    toast.success("درخواست لغو شد");
    router.push("/users/requests");
  };

  const handleComplete = () => {
    const error = completeRequest(request.id, user.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setCompleteOpen(false);
    toast.success("کار با موفقیت پایان یافت");
    router.push("/users/requests");
  };

  return (
    <PageContainer withDock>
      <PageHeader
        title="جزئیات درخواست"
        description={service?.name}
        backHref="/users/requests"
      />

      <div className="space-y-4 animate-fade-in">
        <Card className="card-elevated border-border/70">
          <CardContent className="space-y-4 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">
                  {category?.name}
                </p>
                <h2 className="text-lg font-bold">{service?.name}</h2>
              </div>
              <StatusBadge status={request.status} />
            </div>

            <div className="grid gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="size-4 text-accent" />
                {land?.title ?? "زمین نامشخص"}
                {land ? ` · ${toPersianDigits(land.areaSqm)} m²` : ""}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="size-4 text-accent" />
                {request.scheduledDates.map((date) => formatDate(date)).join(" · ")}
              </div>
              {request.assignedProviderId ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <UserRound className="size-4 text-accent" />
                  {getProviderDisplayName(request.assignedProviderId)}
                </div>
              ) : null}
              <ContactPhoneDisplay request={request} viewerRole="consumer" />
            </div>

            <div className="rounded-xl bg-muted/50 px-3 py-2">
              <p className="text-xs text-muted-foreground">قیمت</p>
              <PriceDisplay
                amount={request.price > 0 ? request.price : 0}
                size="lg"
              />
            </div>
          </CardContent>
        </Card>

        {land ? (
          <Card className="overflow-hidden border-border/70">
            <CardContent className="p-4">
              <p className="mb-3 text-sm font-semibold">موقعیت زمین</p>
              <MapPicker value={land.location} interactive={false} />
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
                  <span className="text-sm">
                    {getProviderDisplayName(item.providerId)}
                  </span>
                  <Badge variant="outline">
                    {PROVIDER_STATUS_LABELS[item.status]}
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
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              انصراف
            </Button>
            <Button variant="destructive" onClick={handleCancel}>
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
        onConfirm={handleComplete}
      />
    </PageContainer>
  );
}
