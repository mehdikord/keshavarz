"use client";

import { CalendarPlus, MoreHorizontal, XCircle } from "lucide-react";
import { useState } from "react";

import { useCan } from "@/components/admin/shell/admin-context";
import { Button } from "@/components/admin/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter } from "@/components/admin/ui/dialog";
import { Field, Textarea } from "@/components/admin/ui/input";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/admin/ui/menu";
import { useAdminAction } from "@/components/admin/ui/use-admin-action";
import { adminApi } from "@/lib/admin/api";
import { formatDate } from "@/lib/admin/format";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";

import { DurationField, durationPayload, type DurationValue } from "./duration-field";

export interface SubscriptionActionTarget {
  endsAt: string | null;
  id: string;
  planName: string;
  providerName: string;
  status: string;
}

/** Row menu: extend (active only) and cancel (active or pending). */
export function SubscriptionActions({ subscription }: { subscription: SubscriptionActionTarget }) {
  const canManage = useCan(ADMIN_PERMISSIONS.subscriptionsManage);
  const [dialog, setDialog] = useState<"extend" | "cancel" | null>(null);
  const extendable = subscription.status === "active";
  const cancellable = subscription.status === "active" || subscription.status === "pending";
  if (!canManage || (!extendable && !cancellable)) return null;

  return (
    <>
      <Menu>
        <MenuTrigger asChild>
          <Button aria-label={`کارهای اشتراک ${subscription.providerName}`} size="icon-sm" variant="ghost">
            <MoreHorizontal />
          </Button>
        </MenuTrigger>
        <MenuContent>
          {extendable ? (
            <MenuItem onSelect={() => setDialog("extend")}>
              <CalendarPlus />
              تمدید اشتراک
            </MenuItem>
          ) : null}
          {cancellable ? (
            <MenuItem onSelect={() => setDialog("cancel")} tone="danger">
              <XCircle />
              لغو اشتراک
            </MenuItem>
          ) : null}
        </MenuContent>
      </Menu>
      <Dialog onOpenChange={(open) => !open && setDialog(null)} open={dialog !== null}>
        <DialogContent
          description={
            dialog === "extend"
              ? `«${subscription.planName}» ${subscription.providerName}، فعلاً تا ${formatDate(subscription.endsAt)}.`
              : subscription.status === "pending"
                ? "خرید ناتمام لغو می‌شود و پرداخت باز آن هم بسته می‌شود تا بعداً فعال نشود."
                : "اشتراک فوراً پایان می‌یابد و خدمات‌دهنده از نتایج جستجو خارج می‌شود. به او اعلان داده می‌شود."
          }
          size="sm"
          title={dialog === "extend" ? "تمدید اشتراک" : "لغو اشتراک"}
        >
          {dialog ? <SubscriptionActionForm kind={dialog} onDone={() => setDialog(null)} subscription={subscription} /> : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function SubscriptionActionForm({
  kind,
  onDone,
  subscription,
}: {
  kind: "extend" | "cancel";
  onDone: () => void;
  subscription: SubscriptionActionTarget;
}) {
  const [duration, setDuration] = useState<DurationValue>({ amount: "1", unit: "months" });
  const [reason, setReason] = useState("");
  const action = useAdminAction();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const ok = await action.run(
      () =>
        kind === "extend"
          ? adminApi.post(`/billing/subscriptions/${subscription.id}/extend`, { duration: durationPayload(duration), reason })
          : adminApi.post(`/billing/subscriptions/${subscription.id}/cancel`, { reason }),
      kind === "extend" ? "اشتراک تمدید شد." : "اشتراک لغو شد.",
    );
    if (ok) onDone();
  }

  return (
    <form noValidate onSubmit={submit}>
      <DialogBody>
        {kind === "extend" ? (
          <Field error={action.errors.duration} htmlFor="extend-amount" label="مدت تمدید">
            <DurationField id="extend-amount" invalid={Boolean(action.errors.duration)} onChange={setDuration} value={duration} />
          </Field>
        ) : null}
        <Field error={action.errors.reason} hint="در گزارش ممیزی ثبت می‌شود." htmlFor="subscription-reason" label="دلیل">
          <Textarea
            aria-invalid={Boolean(action.errors.reason)}
            autoFocus={kind === "cancel"}
            id="subscription-reason"
            maxLength={500}
            onChange={(event) => setReason(event.target.value)}
            rows={2}
            value={reason}
          />
        </Field>
      </DialogBody>
      <DialogFooter>
        <Button onClick={onDone} type="button" variant="ghost">
          انصراف
        </Button>
        <Button loading={action.pending} type="submit" variant={kind === "cancel" ? "danger" : "primary"}>
          {kind === "extend" ? "تمدید" : "لغو اشتراک"}
        </Button>
      </DialogFooter>
    </form>
  );
}
