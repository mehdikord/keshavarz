"use client";

import {
  Ban,
  ChevronDown,
  LogOut,
  MessageSquareWarning,
  PauseCircle,
  PencilLine,
  PlayCircle,
  PowerOff,
  RotateCcw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/admin/ui/button";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { Dialog, DialogBody, DialogContent, DialogFooter } from "@/components/admin/ui/dialog";
import { Field, Input, Textarea } from "@/components/admin/ui/input";
import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from "@/components/admin/ui/menu";
import { useAdminAction } from "@/components/admin/ui/use-admin-action";
import { useCan } from "@/components/admin/shell/admin-context";
import { adminApi } from "@/lib/admin/api";
import { faNumber, formatDateTime } from "@/lib/admin/format";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { cn } from "@/lib/utils";

import { type EditableUser, UserEditDialog } from "./user-edit-dialog";

type ModerationAction = "activate" | "deactivate" | "suspend" | "ban" | "unban" | "warning";

const MODERATION_COPY: Record<
  ModerationAction,
  { confirm: string; description: string; done: string; title: string; tone: "primary" | "danger" | "wheat" }
> = {
  activate: {
    confirm: "فعال کردن حساب",
    description: "کاربر دوباره می‌تواند وارد شود و از همه بخش‌ها استفاده کند.",
    done: "حساب فعال شد.",
    title: "فعال‌سازی حساب",
    tone: "primary",
  },
  ban: {
    confirm: "مسدود کردن حساب",
    description: "کاربر از همه دستگاه‌ها خارج می‌شود و تا زمانی که محدودیت را بردارید نمی‌تواند وارد شود.",
    done: "حساب مسدود شد.",
    title: "مسدودسازی دائمی",
    tone: "danger",
  },
  deactivate: {
    confirm: "غیرفعال کردن حساب",
    description: "کاربر از همه دستگاه‌ها خارج می‌شود و تا فعال‌سازی دوباره نمی‌تواند وارد شود.",
    done: "حساب غیرفعال شد.",
    title: "غیرفعال‌سازی حساب",
    tone: "danger",
  },
  suspend: {
    confirm: "تعلیق حساب",
    description: "کاربر از همه دستگاه‌ها خارج می‌شود و تا پایان مدت تعلیق نمی‌تواند وارد شود. پس از آن، حساب خودبه‌خود آزاد می‌شود.",
    done: "حساب تعلیق شد.",
    title: "تعلیق موقت",
    tone: "danger",
  },
  unban: {
    confirm: "رفع محدودیت",
    description: "تعلیق یا مسدودیت فعال همین حالا پایان می‌یابد و کاربر می‌تواند دوباره وارد شود.",
    done: "محدودیت حساب برداشته شد.",
    title: "رفع محدودیت",
    tone: "primary",
  },
  warning: {
    confirm: "ثبت اخطار",
    description: "اخطار در تاریخچه مدیریتی کاربر ثبت می‌شود و دسترسی او تغییری نمی‌کند.",
    done: "اخطار ثبت شد.",
    title: "ثبت اخطار",
    tone: "wheat",
  },
};

const DURATIONS = [1, 3, 7, 14, 30, 90];

function ModerationDialog({
  action,
  onOpenChange,
  userId,
}: {
  action: ModerationAction | null;
  onOpenChange: (open: boolean) => void;
  userId: string;
}) {
  const copy = action ? MODERATION_COPY[action] : null;
  return (
    <Dialog onOpenChange={onOpenChange} open={action !== null}>
      {copy && action ? (
        <DialogContent description={copy.description} title={copy.title}>
          {/* Remounts on every open, so the form starts clean and the end date is fresh. */}
          <ModerationForm action={action} key={action} onDone={() => onOpenChange(false)} userId={userId} />
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

function toDays(value: string): number {
  return Number(value.replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))));
}

function ModerationForm({
  action,
  onDone,
  userId,
}: {
  action: ModerationAction;
  onDone: () => void;
  userId: string;
}) {
  const copy = MODERATION_COPY[action];
  const [reason, setReason] = useState("");
  const [days, setDays] = useState(7);
  const [customDays, setCustomDays] = useState("");
  const [openedAt] = useState(() => Date.now());
  const mutation = useAdminAction();
  const effectiveDays = customDays ? toDays(customDays) : days;
  const validDays = Number.isInteger(effectiveDays) && effectiveDays >= 1 && effectiveDays <= 3650;
  const endsAt = validDays ? new Date(openedAt + effectiveDays * 86_400_000) : null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const ok = await mutation.run(
      () =>
        adminApi.post(`/users/${userId}/moderation`, {
          action,
          endsAt: action === "suspend" ? new Date(Date.now() + effectiveDays * 86_400_000).toISOString() : null,
          reason,
        }),
      copy.done,
    );
    if (ok) onDone();
  }

  return (
    <form noValidate onSubmit={submit}>
      <DialogBody>
        {action === "suspend" ? (
          <div className="grid gap-2">
            <p className="text-[12.5px] font-semibold text-foreground/85">مدت تعلیق</p>
            <div className="flex flex-wrap gap-1.5" role="radiogroup">
              {DURATIONS.map((value) => (
                <button
                  aria-checked={!customDays && days === value}
                  className={cn(
                    "h-8 rounded-lg border px-3 text-[12.5px] font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    !customDays && days === value
                      ? "border-soil bg-soil text-soil-foreground"
                      : "border-border bg-background hover:bg-raised",
                  )}
                  key={value}
                  onClick={() => {
                    setDays(value);
                    setCustomDays("");
                  }}
                  role="radio"
                  type="button"
                >
                  {faNumber(value)} روز
                </button>
              ))}
              <Input
                aria-label="تعداد روز دلخواه"
                className="h-8 w-28 text-[12.5px]"
                inputMode="numeric"
                onChange={(event) => setCustomDays(event.target.value)}
                placeholder="روز دلخواه"
                value={customDays}
              />
            </div>
            <p className={cn("text-xs", validDays ? "text-muted-foreground" : "text-danger")}>
              {endsAt ? `پایان تعلیق: ${formatDateTime(endsAt)}` : "مدت باید بین ۱ تا ۳۶۵۰ روز باشد."}
            </p>
            {mutation.errors.endsAt ? <p className="text-xs text-danger">{mutation.errors.endsAt}</p> : null}
          </div>
        ) : null}
        <Field
          error={mutation.errors.reason}
          hint="این دلیل فقط برای مدیران نمایش داده می‌شود."
          htmlFor="moderation-reason"
          label="دلیل"
        >
          <Textarea
            aria-invalid={Boolean(mutation.errors.reason)}
            autoFocus
            id="moderation-reason"
            maxLength={1500}
            onChange={(event) => setReason(event.target.value)}
            placeholder="مثلاً: گزارش چندباره خدمات‌دهندگان درباره لغو بدون اطلاع"
            value={reason}
          />
        </Field>
      </DialogBody>
      <DialogFooter>
        <Button onClick={onDone} type="button" variant="ghost">
          انصراف
        </Button>
        <Button
          disabled={reason.trim().length < 5 || (action === "suspend" && !validDays)}
          loading={mutation.pending}
          type="submit"
          variant={copy.tone === "danger" ? "danger" : copy.tone === "wheat" ? "wheat" : "primary"}
        >
          {copy.confirm}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function UserHeaderActions({
  activeSessions,
  provinces,
  status,
  user,
}: {
  activeSessions: number;
  provinces: Array<{ id: string; name: string }>;
  status: string;
  user: EditableUser;
}) {
  const canUpdate = useCan(ADMIN_PERMISSIONS.usersUpdate);
  const canChangeStatus = useCan(ADMIN_PERMISSIONS.usersChangeStatus);
  const [editOpen, setEditOpen] = useState(false);
  const [moderation, setModeration] = useState<ModerationAction | null>(null);
  const [dialog, setDialog] = useState<"delete" | "restore" | "revoke" | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const mutation = useAdminAction();

  const deleted = status === "deleted";
  const restricted = status === "suspended" || status === "banned";

  async function confirm() {
    let ok = false;
    if (dialog === "delete") {
      ok = await mutation.run(() => adminApi.delete(`/users/${user.id}`, { reason: deleteReason }), "حساب کاربر حذف شد.");
    } else if (dialog === "restore") {
      ok = await mutation.run(() => adminApi.post(`/users/${user.id}/restore`), "حساب کاربر بازگردانی شد.");
    } else if (dialog === "revoke") {
      ok = await mutation.run(() => adminApi.post(`/users/${user.id}/sessions/revoke`, {}), "کاربر از همه دستگاه‌ها خارج شد.");
    }
    if (ok) {
      setDialog(null);
      setDeleteReason("");
    }
  }

  if (!canUpdate && !canChangeStatus) return null;

  return (
    <>
      {canUpdate && !deleted ? (
        <Button onClick={() => setEditOpen(true)} variant="outline">
          <PencilLine />
          ویرایش اطلاعات
        </Button>
      ) : null}

      {canChangeStatus ? (
        deleted ? (
          <Button onClick={() => setDialog("restore")}>
            <RotateCcw />
            بازگردانی حساب
          </Button>
        ) : (
          <Menu>
            <MenuTrigger asChild>
              <Button variant="primary">
                <ShieldCheck />
                مدیریت حساب
                <ChevronDown className="opacity-70" />
              </Button>
            </MenuTrigger>
            <MenuContent className="w-60">
              <MenuLabel>وضعیت دسترسی</MenuLabel>
              {restricted ? (
                <MenuItem onSelect={() => setModeration("unban")}>
                  <PlayCircle />
                  رفع محدودیت
                </MenuItem>
              ) : null}
              {status === "inactive" ? (
                <MenuItem onSelect={() => setModeration("activate")}>
                  <PlayCircle />
                  فعال‌سازی حساب
                </MenuItem>
              ) : (
                <MenuItem onSelect={() => setModeration("deactivate")}>
                  <PowerOff />
                  غیرفعال‌سازی حساب
                </MenuItem>
              )}
              {status !== "banned" ? (
                <MenuItem onSelect={() => setModeration("suspend")}>
                  <PauseCircle />
                  {status === "suspended" ? "تمدید یا تغییر تعلیق" : "تعلیق موقت"}
                </MenuItem>
              ) : null}
              {status !== "banned" ? (
                <MenuItem onSelect={() => setModeration("ban")} tone="danger">
                  <Ban />
                  مسدودسازی دائمی
                </MenuItem>
              ) : null}
              <MenuItem onSelect={() => setModeration("warning")}>
                <MessageSquareWarning />
                ثبت اخطار
              </MenuItem>
              <MenuSeparator />
              <MenuItem disabled={activeSessions === 0} onSelect={() => setDialog("revoke")}>
                <LogOut />
                خروج از همه دستگاه‌ها
                {activeSessions > 0 ? (
                  <span className="mr-auto text-[11px] text-muted-foreground">{faNumber(activeSessions)} نشست</span>
                ) : null}
              </MenuItem>
              <MenuSeparator />
              <MenuItem onSelect={() => setDialog("delete")} tone="danger">
                <Trash2 />
                حذف حساب
              </MenuItem>
            </MenuContent>
          </Menu>
        )
      ) : null}

      {canUpdate ? (
        <UserEditDialog onOpenChange={setEditOpen} open={editOpen} provinces={provinces} user={user} />
      ) : null}
      <ModerationDialog action={moderation} onOpenChange={(open) => !open && setModeration(null)} userId={user.id} />

      <ConfirmDialog
        confirm="خروج از همه دستگاه‌ها"
        description={`${faNumber(activeSessions)} نشست فعال بسته می‌شود و کاربر باید دوباره با کد تأیید وارد شود. حساب او فعال می‌ماند.`}
        onConfirm={confirm}
        onOpenChange={(open) => !open && setDialog(null)}
        open={dialog === "revoke"}
        pending={mutation.pending}
        title="خروج کاربر از همه دستگاه‌ها"
      />
      <ConfirmDialog
        confirm="بازگردانی حساب"
        description="حساب با همه سوابقش برمی‌گردد و کاربر می‌تواند دوباره با شماره خود وارد شود."
        onConfirm={confirm}
        onOpenChange={(open) => !open && setDialog(null)}
        open={dialog === "restore"}
        pending={mutation.pending}
        title="بازگردانی حساب"
        tone="primary"
      />
      <ConfirmDialog
        confirm="حذف حساب"
        description="کاربر از همه دستگاه‌ها خارج می‌شود و دیگر نمی‌تواند وارد شود. زمین‌ها، درخواست‌ها و پرداخت‌های او برای سوابق حفظ می‌شوند و حساب بعداً قابل بازگردانی است."
        disabled={deleteReason.trim().length < 5}
        onConfirm={confirm}
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null);
            setDeleteReason("");
          }
        }}
        open={dialog === "delete"}
        pending={mutation.pending}
        title="حذف حساب کاربر"
      >
        <Field error={mutation.errors.reason} htmlFor="delete-reason" label="دلیل حذف">
          <Textarea
            id="delete-reason"
            maxLength={1500}
            onChange={(event) => setDeleteReason(event.target.value)}
            placeholder="مثلاً: درخواست خود کاربر از طریق پشتیبانی"
            value={deleteReason}
          />
        </Field>
      </ConfirmDialog>
    </>
  );
}

/** Banner action: lift a suspension or ban without opening the menu. */
export function LiftRestrictionButton({ userId }: { userId: string }) {
  const canChangeStatus = useCan(ADMIN_PERMISSIONS.usersChangeStatus);
  const [open, setOpen] = useState(false);
  if (!canChangeStatus) return null;
  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" variant="outline">
        <PlayCircle />
        رفع محدودیت
      </Button>
      <ModerationDialog action={open ? "unban" : null} onOpenChange={setOpen} userId={userId} />
    </>
  );
}
