"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";

import {
  AdminForbidden,
  AdminPageHeader,
  AdminSectionCard,
  AdminStatusBadge,
} from "@/components/admin-panel";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAdminPermissions } from "@/hooks/admin/use-admin-permissions";
import { copyPublicId, formatAdminDateTime } from "@/lib/admin/format";
import {
  createAdminPaymentRefund,
  fetchAdminPayment,
  type AdminPaymentDetail,
} from "@/lib/api/admin-payments";
import { isApiClientError } from "@/lib/api/envelope";
import { formatPrice, toPersianDigits } from "@/lib/utils/format";

interface AdminPaymentDetailPageProps {
  paymentId: string;
}

export function AdminPaymentDetailPage({
  paymentId,
}: AdminPaymentDetailPageProps) {
  const { can } = useAdminPermissions();
  const canView = can("payments.view");
  const canRefund = can("payments.refund");

  const [payment, setPayment] = useState<AdminPaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [refundOpen, setRefundOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!canView) return;
    const controller = new AbortController();

    void fetchAdminPayment(paymentId, controller.signal)
      .then((detail) => {
        if (controller.signal.aborted) return;
        setPayment(detail);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          isApiClientError(cause)
            ? cause.message
            : "بارگذاری پرداخت ناموفق بود.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [canView, paymentId, reloadKey]);

  const refundedTotal = useMemo(() => {
    if (!payment) return 0;
    return payment.refunds
      .filter((item) => item.status === "succeeded")
      .reduce((sum, item) => sum + item.amountToman, 0);
  }, [payment]);

  const remaining = payment ? Math.max(0, payment.amountToman - refundedTotal) : 0;
  const canStartRefund =
    canRefund &&
    payment &&
    (payment.status === "paid" || payment.status === "partially_refunded") &&
    remaining > 0;

  if (!canView) return <AdminForbidden />;

  if (loading && !payment) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !payment) {
    return (
      <AdminSectionCard className="text-center text-sm text-destructive">
        {error ?? "پرداخت یافت نشد."}
      </AdminSectionCard>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <AdminPageHeader
        title="جزئیات پرداخت"
        description="اطلاعات پرداخت و ثبت refund با تأیید صریح."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/admins/payments">بازگشت به فهرست</Link>
            </Button>
            {canStartRefund ? (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => {
                  setAmount(String(remaining));
                  setReason("");
                  setRefundOpen(true);
                }}
              >
                ثبت بازپرداخت
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <AdminStatusBadge status={payment.status} />
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 gap-1 px-2 font-mono text-xs"
          dir="ltr"
          onClick={() => void copyPublicId(payment.paymentId, "شناسه پرداخت")}
        >
          <Copy className="size-3.5" />
          {payment.paymentId}
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <AdminSectionCard>
          <h2 className="mb-3 text-sm font-semibold">خلاصه</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">مبلغ</dt>
              <dd className="font-medium">{formatPrice(payment.amountToman)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">باقی‌مانده قابل refund</dt>
              <dd>{formatPrice(remaining)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">کاربر</dt>
              <dd>
                <Link
                  href={`/admins/users/${payment.userId}`}
                  className="font-mono text-xs text-primary hover:underline"
                  dir="ltr"
                >
                  {payment.userId}
                </Link>
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">درگاه</dt>
              <dd>{payment.gateway}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">ایجاد</dt>
              <dd>{formatAdminDateTime(payment.createdAt)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">پرداخت</dt>
              <dd>{formatAdminDateTime(payment.paidAt)}</dd>
            </div>
            {payment.subscriptionId ? (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">اشتراک</dt>
                <dd className="font-mono text-xs" dir="ltr">
                  {payment.subscriptionId}
                  {payment.subscriptionStatus
                    ? ` (${payment.subscriptionStatus})`
                    : ""}
                </dd>
              </div>
            ) : null}
            {payment.authority ? (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Authority</dt>
                <dd className="font-mono text-xs" dir="ltr">
                  {payment.authority}
                </dd>
              </div>
            ) : null}
            {payment.transactionReference ? (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">مرجع تراکنش</dt>
                <dd className="font-mono text-xs" dir="ltr">
                  {payment.transactionReference}
                </dd>
              </div>
            ) : null}
            {payment.failureMessage ? (
              <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-destructive">
                {payment.failureCode ? `${payment.failureCode}: ` : ""}
                {payment.failureMessage}
              </p>
            ) : null}
          </dl>
        </AdminSectionCard>

        <AdminSectionCard>
          <h2 className="mb-3 text-sm font-semibold">
            بازپرداخت‌ها ({toPersianDigits(payment.refunds.length)})
          </h2>
          {payment.refunds.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              هنوز بازپرداختی ثبت نشده است.
            </p>
          ) : (
            <ul className="space-y-3">
              {payment.refunds.map((item) => (
                <li
                  key={item.refundId}
                  className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-canvas)]/50 px-3 py-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <AdminStatusBadge status={item.status} />
                    <span className="text-sm font-medium">
                      {formatPrice(item.amountToman)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatAdminDateTime(item.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm">{item.reason}</p>
                </li>
              ))}
            </ul>
          )}
          <Button asChild variant="link" className="mt-3 h-auto px-0 text-xs">
            <Link href="/admins/refunds">مشاهده فهرست همه refundها</Link>
          </Button>
        </AdminSectionCard>
      </div>

      <Dialog
        open={refundOpen}
        onOpenChange={(open) => {
          if (submitting) return;
          setRefundOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ثبت بازپرداخت</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              نتیجه فقط پس از پاسخ موفق API نمایش داده می‌شود. سقف قابل
              بازپرداخت: {formatPrice(remaining)}
            </p>
            <div className="space-y-2">
              <Label htmlFor="refund-amount">مبلغ (تومان)</Label>
              <Input
                id="refund-amount"
                type="number"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                disabled={submitting}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="refund-reason">دلیل</Label>
              <Textarea
                id="refund-reason"
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
              onClick={() => setRefundOpen(false)}
            >
              انصراف
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={submitting || reason.trim().length < 3}
              onClick={async () => {
                const amountToman = Number(amount);
                if (!Number.isInteger(amountToman) || amountToman <= 0) {
                  toast.error("مبلغ باید عدد صحیح مثبت باشد.");
                  return;
                }
                if (amountToman > remaining) {
                  toast.error("مبلغ از باقی‌مانده بیشتر است.");
                  return;
                }
                setSubmitting(true);
                try {
                  const result = await createAdminPaymentRefund(paymentId, {
                    amountToman,
                    reason: reason.trim(),
                  });
                  toast.success(
                    `بازپرداخت ثبت شد · وضعیت پرداخت: ${result.paymentStatus}`,
                  );
                  setRefundOpen(false);
                  setLoading(true);
                  setReloadKey((value) => value + 1);
                } catch (cause) {
                  toast.error(
                    isApiClientError(cause)
                      ? cause.message
                      : "ثبت بازپرداخت ناموفق بود.",
                  );
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {submitting ? "در انتظار پاسخ سرور..." : "تأیید بازپرداخت"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
