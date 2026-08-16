"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchAdminSubscriptionPlans,
  grantAdminProviderSubscription,
  type AdminSubscriptionPlan,
} from "@/lib/api/admin-subscriptions";
import { isApiClientError } from "@/lib/api/envelope";
import { formatPrice, toPersianDigits } from "@/lib/utils/format";

interface AdminGrantSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: string;
  onGranted: () => void;
}

export function AdminGrantSubscriptionDialog({
  open,
  onOpenChange,
  providerId,
  onGranted,
}: AdminGrantSubscriptionDialogProps) {
  const seedKey = open ? "open" : "closed";
  const [seedSnapshot, setSeedSnapshot] = useState(seedKey);
  const [plans, setPlans] = useState<AdminSubscriptionPlan[]>([]);
  const [planCode, setPlanCode] = useState("");
  const [durationMonths, setDurationMonths] = useState("");
  const [reason, setReason] = useState("");
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (seedKey !== seedSnapshot) {
    setSeedSnapshot(seedKey);
    if (open) {
      setLoadingPlans(true);
      setPlanCode("");
      setDurationMonths("");
      setReason("");
      setPlans([]);
    }
  }

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();

    void fetchAdminSubscriptionPlans({
      isActive: "1",
      signal: controller.signal,
    })
      .then((rows) => {
        if (controller.signal.aborted) return;
        setPlans(rows);
        setPlanCode(rows[0]?.code ?? "");
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        toast.error(
          isApiClientError(cause)
            ? cause.message
            : "بارگذاری پلن‌ها ناموفق بود.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingPlans(false);
      });

    return () => controller.abort();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>اعطای اشتراک</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>پلن</Label>
            <Select
              value={planCode || undefined}
              onValueChange={setPlanCode}
              disabled={loadingPlans || submitting}
            >
              <SelectTrigger className="w-full rounded-lg">
                <SelectValue placeholder="انتخاب پلن" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.planId} value={plan.code}>
                    {plan.name} · {formatPrice(plan.priceToman)} ·{" "}
                    {toPersianDigits(plan.durationMonths)} ماه
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="grant-duration">مدت سفارشی (اختیاری، ماه)</Label>
            <Input
              id="grant-duration"
              type="number"
              value={durationMonths}
              onChange={(event) => setDurationMonths(event.target.value)}
              disabled={submitting}
              dir="ltr"
              placeholder="پیش‌فرض پلن"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="grant-reason">دلیل (اختیاری)</Label>
            <Textarea
              id="grant-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              disabled={submitting}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            انصراف
          </Button>
          <Button
            type="button"
            disabled={submitting || !planCode}
            onClick={async () => {
              const duration = durationMonths.trim()
                ? Number(durationMonths)
                : undefined;
              if (
                duration !== undefined &&
                (!Number.isInteger(duration) || duration < 1 || duration > 36)
              ) {
                toast.error("مدت باید عدد صحیح بین ۱ تا ۳۶ باشد.");
                return;
              }
              if (reason.trim() && reason.trim().length < 3) {
                toast.error("دلیل حداقل ۳ کاراکتر باشد.");
                return;
              }
              setSubmitting(true);
              try {
                await grantAdminProviderSubscription(providerId, {
                  durationMonths: duration,
                  planCode,
                  reason: reason.trim() || undefined,
                });
                toast.success("اشتراک اعطا شد");
                onOpenChange(false);
                onGranted();
              } catch (cause) {
                toast.error(
                  isApiClientError(cause)
                    ? cause.message
                    : "اعطای اشتراک ناموفق بود.",
                );
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {submitting ? "در انتظار پاسخ سرور..." : "اعطا"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
