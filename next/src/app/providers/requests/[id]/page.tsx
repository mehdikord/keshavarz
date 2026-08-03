"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CalendarDays, MapPin, UserRound } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ContactPhoneDisplay } from "@/components/shared/contact-phone-display";
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
import { getCategoryById, getServiceById } from "@/lib/mock/catalog";
import { getLandsForUser } from "@/lib/mock/users";
import { toast } from "@/lib/toast";
import { toPersianDigits } from "@/lib/utils/format";
import {
  getUserDisplayName,
} from "@/lib/utils/provider-requests";
import { useAuthStore } from "@/stores/auth-store";
import { useProviderStore } from "@/stores/provider-store";
import { useRequestStore } from "@/stores/request-store";

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export default function ProviderRequestDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const request = useRequestStore((state) =>
    state.getRequestById(params.id),
  );
  const acceptRequest = useRequestStore((state) => state.acceptRequest);
  const rejectRequest = useRequestStore((state) => state.rejectRequest);
  const cancelRequest = useRequestStore((state) => state.cancelRequest);
  const offeredServices = useProviderStore((state) => state.offeredServices);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const land = useMemo(() => {
    if (!request) return null;
    return getLandsForUser(request.consumerId).find(
      (item) => item.id === request.landId,
    );
  }, [request]);

  if (!user || !request) {
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

  const service = getServiceById(request.serviceId);
  const category = service ? getCategoryById(service.categoryId) : null;

  const handleAccept = () => {
    const price =
      offeredServices.find((item) => item.serviceId === request.serviceId)
        ?.price ?? 0;

    if (!price) {
      toast.error("قیمت این خدمت در پروفایل شما ثبت نشده");
      return;
    }

    const error = acceptRequest(request.id, user.id, price);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("درخواست پذیرفته شد");
    router.push("/providers/requests");
  };

  const handleReject = () => {
    const error = rejectRequest(request.id, user.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.info("درخواست رد شد");
    router.push("/providers/requests");
  };

  const handleCancel = () => {
    if (cancelReason.trim().length < 3) {
      toast.error("دلیل لغو را وارد کنید");
      return;
    }

    const error = cancelRequest(request.id, "provider", cancelReason.trim());
    if (error) {
      toast.error(error.message);
      return;
    }
    setCancelOpen(false);
    toast.success("درخواست لغو شد");
    router.push("/providers/requests");
  };

  return (
    <PageContainer withDock>
      <PageHeader
        title="جزئیات درخواست"
        description={service?.name}
        backHref="/providers/requests"
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
                <UserRound className="size-4 text-primary" />
                {getUserDisplayName(request.consumerId)}
              </div>
              <ContactPhoneDisplay request={request} viewerRole="provider" />
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="size-4 text-primary" />
                {land?.title ?? "زمین نامشخص"}
                {land ? ` · ${toPersianDigits(land.areaSqm)} m²` : ""}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="size-4 text-primary" />
                {request.scheduledDates.map((date) => formatDate(date)).join(" · ")}
              </div>
            </div>

            <div className="rounded-xl bg-muted/50 px-3 py-2">
              <p className="text-xs text-muted-foreground">قیمت</p>
              <PriceDisplay
                amount={request.price > 0 ? request.price : 0}
                size="lg"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              ایجاد: {formatDate(request.createdAt)}
            </p>
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

        {request.status === "cancelled" && request.cancelReason ? (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-4 text-sm">
              <p className="font-semibold text-destructive">دلیل لغو</p>
              <p className="mt-1 text-muted-foreground">{request.cancelReason}</p>
            </CardContent>
          </Card>
        ) : null}

        {request.status === "pending_provider" ? (
          <div className="grid grid-cols-2 gap-3">
            <Button className="h-11 rounded-xl" onClick={handleAccept}>
              قبول درخواست
            </Button>
            <Button
              variant="outline"
              className="h-11 rounded-xl border-destructive/30 text-destructive"
              onClick={handleReject}
            >
              رد درخواست
            </Button>
          </div>
        ) : null}

        {request.status === "in_progress" ? (
          <Button
            variant="destructive"
            className="h-11 w-full rounded-xl"
            onClick={() => setCancelOpen(true)}
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
            <Button variant="destructive" onClick={handleCancel}>
              تأیید لغو
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
