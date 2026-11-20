"use client";

import { Undo2 } from "lucide-react";
import { useState } from "react";

import { toLatinDigits } from "@/components/admin/catalog/image-field";
import { useCan } from "@/components/admin/shell/admin-context";
import { Button } from "@/components/admin/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter } from "@/components/admin/ui/dialog";
import { Field, Input, Textarea } from "@/components/admin/ui/input";
import { useAdminAction } from "@/components/admin/ui/use-admin-action";
import { adminApi } from "@/lib/admin/api";
import { formatToman } from "@/lib/admin/format";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";

/**
 * Records a manual refund. The gateway has no refund API, so the money must be
 * returned to the user outside the system; this keeps the books straight.
 */
export function RefundButton({
  paymentId,
  refundableToman,
  subscription,
}: {
  paymentId: string;
  refundableToman: number;
  subscription: { planName: string; status: string } | null;
}) {
  const canRefund = useCan(ADMIN_PERMISSIONS.paymentsRefund);
  const [open, setOpen] = useState(false);
  if (!canRefund || refundableToman <= 0) return null;
  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline">
        <Undo2 />
        ثبت بازپرداخت
      </Button>
      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent
          description={`حداکثر قابل بازپرداخت: ${formatToman(refundableToman)}`}
          title="ثبت بازپرداخت"
        >
          {open ? (
            <RefundForm
              onDone={() => setOpen(false)}
              paymentId={paymentId}
              refundableToman={refundableToman}
              subscription={subscription}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function RefundForm({
  onDone,
  paymentId,
  refundableToman,
  subscription,
}: {
  onDone: () => void;
  paymentId: string;
  refundableToman: number;
  subscription: { planName: string; status: string } | null;
}) {
  const [amount, setAmount] = useState(String(refundableToman));
  const [reason, setReason] = useState("");
  const [cancelSubscription, setCancelSubscription] = useState(false);
  const action = useAdminAction();
  const value = Number(amount || 0);
  const full = value === refundableToman;
  const canCancel = Boolean(subscription && (subscription.status === "active" || subscription.status === "pending"));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const ok = await action.run(
      () =>
        adminApi.post(`/billing/payments/${paymentId}/refunds`, {
          amountToman: value,
          cancelSubscription: full && canCancel && cancelSubscription,
          reason,
        }),
      "بازپرداخت ثبت شد.",
    );
    if (ok) onDone();
  }

  return (
    <form noValidate onSubmit={submit}>
      <DialogBody>
        <p className="rounded-xl bg-warn-soft px-3 py-2.5 text-xs leading-5 text-warn">
          درگاه پرداخت فعلی امکان بازگشت خودکار وجه ندارد. این فرم بازپرداخت را در سامانه ثبت می‌کند؛ مبلغ را جداگانه (مثلاً با کارت‌به‌کارت) به
          کاربر برگردانید.
        </p>
        <Field
          error={action.errors.amountToman}
          hint={value > 0 ? `${formatToman(value)}${full ? " — بازپرداخت کامل" : " — بازپرداخت جزئی"}` : undefined}
          htmlFor="refund-amount"
          label="مبلغ (تومان)"
        >
          <div className="flex gap-2">
            <Input
              aria-invalid={Boolean(action.errors.amountToman)}
              className="text-left"
              dir="ltr"
              id="refund-amount"
              inputMode="numeric"
              onChange={(event) => setAmount(toLatinDigits(event.target.value).slice(0, 11))}
              value={amount}
            />
            <Button onClick={() => setAmount(String(refundableToman))} type="button" variant="soft">
              کل مانده
            </Button>
          </div>
        </Field>
        <Field error={action.errors.reason} hint="در سوابق پرداخت و گزارش ممیزی ثبت می‌شود." htmlFor="refund-reason" label="دلیل">
          <Textarea
            aria-invalid={Boolean(action.errors.reason)}
            id="refund-reason"
            maxLength={500}
            onChange={(event) => setReason(event.target.value)}
            rows={2}
            value={reason}
          />
        </Field>
        {canCancel ? (
          <label className={`flex items-start gap-2.5 rounded-xl border border-line px-3 py-2.5 text-[13px] ${full ? "" : "opacity-55"}`}>
            <input
              checked={full && cancelSubscription}
              className="mt-0.5 accent-primary"
              disabled={!full}
              onChange={(event) => setCancelSubscription(event.target.checked)}
              type="checkbox"
            />
            <span>
              اشتراک «{subscription?.planName}» هم لغو شود
              <span className="block text-xs text-muted-foreground">
                {full ? "خدمات‌دهنده بلافاصله از نتایج جستجو خارج می‌شود." : "فقط همراه بازپرداخت کامل ممکن است."}
              </span>
            </span>
          </label>
        ) : null}
        {action.errors.cancelSubscription ? <p className="text-xs text-danger">{action.errors.cancelSubscription}</p> : null}
      </DialogBody>
      <DialogFooter>
        <Button onClick={onDone} type="button" variant="ghost">
          انصراف
        </Button>
        <Button disabled={value <= 0} loading={action.pending} type="submit" variant="danger">
          ثبت بازپرداخت
        </Button>
      </DialogFooter>
    </form>
  );
}
