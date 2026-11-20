"use client";

import { Ban, CircleCheckBig, UserMinus } from "lucide-react";
import { useState } from "react";

import { useCan } from "@/components/admin/shell/admin-context";
import { Button } from "@/components/admin/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter } from "@/components/admin/ui/dialog";
import { Field, Textarea } from "@/components/admin/ui/input";
import { useAdminAction } from "@/components/admin/ui/use-admin-action";
import { adminApi } from "@/lib/admin/api";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";

type Kind = "cancel" | "complete";

const COPY: Record<Kind, { confirm: string; description: string; hint: string; success: string; title: string }> = {
  cancel: {
    confirm: "لغو درخواست",
    description:
      "درخواست برای همه بسته می‌شود؛ دعوت‌های باز خدمات‌دهندگان برداشته می‌شود و به خدمات‌گیرنده و خدمات‌دهندگان درگیر اعلان ارسال می‌شود.",
    hint: "این دلیل در اعلان لغو برای خدمات‌گیرنده و خدمات‌دهندگان نمایش داده می‌شود.",
    success: "درخواست لغو شد.",
    title: "لغو درخواست توسط پشتیبانی",
  },
  complete: {
    confirm: "ثبت انجام کار",
    description:
      "وقتی کار انجام شده ولی خدمات‌گیرنده آن را در اپلیکیشن تأیید نکرده است. به هر دو طرف اعلان ارسال می‌شود و کار در گزارش‌های مالی حساب می‌شود.",
    hint: "مثلاً: «خدمات‌گیرنده تلفنی انجام کار را تأیید کرد.» در تاریخچه درخواست ثبت می‌شود.",
    success: "انجام کار ثبت شد.",
    title: "ثبت انجام کار",
  },
};

export function RequestHeaderActions({
  requestId,
  status,
  version,
}: {
  requestId: string;
  status: string;
  version: number;
}) {
  const canCancel = useCan(ADMIN_PERMISSIONS.requestsCancel);
  const canManage = useCan(ADMIN_PERMISSIONS.requestsManage);
  const [kind, setKind] = useState<Kind | null>(null);

  const open = status === "awaiting_send" || status === "pending_provider" || status === "in_progress";
  const showComplete = canManage && status === "in_progress";
  const showCancel = canCancel && open;
  if (!showComplete && !showCancel) return null;

  return (
    <>
      {showComplete ? (
        <Button onClick={() => setKind("complete")} variant="outline">
          <CircleCheckBig />
          ثبت انجام کار
        </Button>
      ) : null}
      {showCancel ? (
        <Button onClick={() => setKind("cancel")} variant="danger-soft">
          <Ban />
          لغو درخواست
        </Button>
      ) : null}
      <Dialog onOpenChange={(next) => !next && setKind(null)} open={kind !== null}>
        {kind ? (
          <DialogContent description={COPY[kind].description} title={COPY[kind].title}>
            <ReasonForm
              confirm={COPY[kind].confirm}
              hint={COPY[kind].hint}
              onDone={() => setKind(null)}
              submit={(reason) => adminApi.post(`/requests/${requestId}/${kind}`, { expectedVersion: version, reason })}
              success={COPY[kind].success}
              tone={kind === "cancel" ? "danger" : "primary"}
            />
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  );
}

export function WithdrawLinkButton({
  linkId,
  providerName,
  requestId,
}: {
  linkId: string;
  providerName: string;
  requestId: string;
}) {
  const canManage = useCan(ADMIN_PERMISSIONS.requestsManage);
  const [open, setOpen] = useState(false);
  if (!canManage) return null;
  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" variant="ghost">
        <UserMinus />
        برداشتن دعوت
      </Button>
      <Dialog onOpenChange={setOpen} open={open}>
        {open ? (
          <DialogContent
            description={`درخواست از صندوق «${providerName}» برداشته می‌شود و دیگر نمی‌تواند آن را بپذیرد. به او اعلان ارسال می‌شود؛ دعوت دیگر خدمات‌دهندگان دست نمی‌خورد.`}
            title="برداشتن دعوت خدمات‌دهنده"
          >
            <ReasonForm
              confirm="برداشتن دعوت"
              hint="فقط در تاریخچه و گزارش مدیران دیده می‌شود."
              onDone={() => setOpen(false)}
              submit={(reason) => adminApi.post(`/requests/${requestId}/links/${linkId}/withdraw`, { reason })}
              success="دعوت برداشته شد."
              tone="danger"
            />
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  );
}

function ReasonForm({
  confirm,
  hint,
  onDone,
  submit,
  success,
  tone,
}: {
  confirm: string;
  hint: string;
  onDone: () => void;
  submit: (reason: string) => Promise<unknown>;
  success: string;
  tone: "danger" | "primary";
}) {
  const [reason, setReason] = useState("");
  const action = useAdminAction();

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const ok = await action.run(() => submit(reason), success);
    if (ok) onDone();
  }

  return (
    <form noValidate onSubmit={onSubmit}>
      <DialogBody>
        <Field error={action.errors.reason} hint={hint} htmlFor="request-action-reason" label="دلیل">
          <Textarea
            aria-invalid={Boolean(action.errors.reason)}
            autoFocus
            id="request-action-reason"
            maxLength={1500}
            onChange={(event) => setReason(event.target.value)}
            rows={4}
            value={reason}
          />
        </Field>
        {action.error && !action.errors.reason ? (
          <p className="text-xs text-danger" role="alert">
            {action.error}
          </p>
        ) : null}
      </DialogBody>
      <DialogFooter>
        <Button onClick={onDone} type="button" variant="ghost">
          انصراف
        </Button>
        <Button disabled={reason.trim().length < 5} loading={action.pending} type="submit" variant={tone === "danger" ? "danger" : "primary"}>
          {confirm}
        </Button>
      </DialogFooter>
    </form>
  );
}
