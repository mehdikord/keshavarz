"use client";

import { BadgeCheck, BadgeX, MoreHorizontal, Power, PowerOff, Send, UserRound } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useCan } from "@/components/admin/shell/admin-context";
import { Button } from "@/components/admin/ui/button";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { Field, Textarea } from "@/components/admin/ui/input";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/admin/ui/menu";
import { Switch } from "@/components/admin/ui/switch";
import { useAdminAction } from "@/components/admin/ui/use-admin-action";
import { adminApi } from "@/lib/admin/api";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";

export function ProviderHeaderActions({
  approved,
  id,
  isActive,
  isAvailable,
}: {
  approved: boolean;
  id: string;
  isActive: boolean;
  isAvailable: boolean;
}) {
  const canUpdate = useCan(ADMIN_PERMISSIONS.providersUpdate);
  const canChangeStatus = useCan(ADMIN_PERMISSIONS.providersChangeStatus);
  const canSeeUser = useCan(ADMIN_PERMISSIONS.usersView);
  const canNotify = useCan(ADMIN_PERMISSIONS.notificationsSend);
  const [dialog, setDialog] = useState<"status" | "unapprove" | null>(null);
  const [reason, setReason] = useState("");
  const availability = useAdminAction();
  const mutation = useAdminAction();

  async function confirm() {
    let ok = false;
    if (dialog === "status") {
      ok = await mutation.run(
        () => adminApi.post(`/providers/${id}/status`, { isActive: !isActive, reason }),
        isActive ? "پروفایل خدمات‌دهنده غیرفعال شد." : "پروفایل خدمات‌دهنده فعال شد.",
      );
    } else if (dialog === "unapprove") {
      ok = await mutation.run(() => adminApi.post(`/providers/${id}/approval`, { approved: false }), "تأیید خدمات‌دهنده برداشته شد.");
    }
    if (ok) {
      setDialog(null);
      setReason("");
    }
  }

  return (
    <>
      {canUpdate ? (
        <label className="flex h-9 items-center gap-2.5 rounded-[10px] border border-border bg-background px-3 text-[13px] font-semibold">
          <Switch
            checked={isAvailable}
            disabled={availability.pending || !isActive}
            label="آماده پذیرش کار"
            onCheckedChange={(next) =>
              void availability.run(
                () => adminApi.patch(`/providers/${id}`, { isAvailable: next }),
                next ? "خدمات‌دهنده آماده پذیرش کار شد." : "پذیرش کار برای این خدمات‌دهنده متوقف شد.",
              )
            }
          />
          پذیرش کار
        </label>
      ) : null}
      {canChangeStatus && !approved ? (
        <Button
          loading={mutation.pending && dialog === null}
          onClick={() => void mutation.run(() => adminApi.post(`/providers/${id}/approval`, { approved: true }), "خدمات‌دهنده تأیید شد.")}
          variant="soft"
        >
          <BadgeCheck />
          تأیید خدمات‌دهنده
        </Button>
      ) : null}
      <Menu>
        <MenuTrigger asChild>
          <Button aria-label="کارهای بیشتر" size="icon" variant="outline">
            <MoreHorizontal />
          </Button>
        </MenuTrigger>
        <MenuContent>
          {canSeeUser ? (
            <MenuItem asChild>
              <Link href={`/admins/users/${id}`}>
                <UserRound />
                حساب کاربری
              </Link>
            </MenuItem>
          ) : null}
          {canNotify ? (
            <MenuItem asChild>
              <Link href={`/admins/notifications/new?user=${id}`}>
                <Send />
                ارسال اعلان
              </Link>
            </MenuItem>
          ) : null}
          {canChangeStatus ? (
            <>
              {approved ? (
                <MenuItem onSelect={() => setDialog("unapprove")}>
                  <BadgeX />
                  برداشتن تأیید
                </MenuItem>
              ) : null}
              <MenuSeparator />
              <MenuItem onSelect={() => setDialog("status")} tone={isActive ? "danger" : "default"}>
                {isActive ? <PowerOff /> : <Power />}
                {isActive ? "غیرفعال کردن پروفایل" : "فعال کردن پروفایل"}
              </MenuItem>
            </>
          ) : null}
        </MenuContent>
      </Menu>

      <ConfirmDialog
        confirm={isActive ? "غیرفعال کردن" : "فعال کردن"}
        description={
          isActive
            ? "خدمات‌دهنده از جستجوی کشاورزان حذف می‌شود و درخواست جدیدی دریافت نمی‌کند. کارهای در جریان و سوابق حفظ می‌شوند."
            : "خدمات‌دهنده در صورت داشتن شرایط دیگر (اشتراک، خدمت فعال، محدوده کاری) دوباره در جستجو دیده می‌شود."
        }
        disabled={reason.trim().length < 5}
        onConfirm={() => void confirm()}
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null);
            mutation.reset();
          }
        }}
        open={dialog === "status"}
        pending={mutation.pending}
        title={isActive ? "غیرفعال کردن پروفایل خدمات‌دهنده" : "فعال کردن پروفایل خدمات‌دهنده"}
        tone={isActive ? "danger" : "primary"}
      >
        <Field
          error={mutation.errors.reason}
          hint="در تاریخچه مدیریتی ثبت می‌شود."
          htmlFor="provider-status-reason"
          label="دلیل"
        >
          <Textarea
            aria-invalid={Boolean(mutation.errors.reason)}
            id="provider-status-reason"
            maxLength={500}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            value={reason}
          />
        </Field>
      </ConfirmDialog>

      <ConfirmDialog
        confirm="برداشتن تأیید"
        description="نشان «تأییدشده» از پروفایل برداشته می‌شود. این کار روی نمایش در جستجو اثری ندارد."
        onConfirm={() => void confirm()}
        onOpenChange={(open) => !open && setDialog(null)}
        open={dialog === "unapprove"}
        pending={mutation.pending}
        title="برداشتن تأیید خدمات‌دهنده"
      />
    </>
  );
}

export function BioEditor({ bio, id }: { bio: string | null; id: string }) {
  const canUpdate = useCan(ADMIN_PERMISSIONS.providersUpdate);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(bio ?? "");
  const action = useAdminAction();

  if (!editing) {
    return (
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13.5px] leading-7 whitespace-pre-line text-foreground/90">
          {bio || <span className="text-muted-foreground">خدمات‌دهنده توضیحی درباره خود ننوشته است.</span>}
        </p>
        {canUpdate ? (
          <Button
            onClick={() => {
              setValue(bio ?? "");
              setEditing(true);
            }}
            size="sm"
            variant="ghost"
          >
            ویرایش
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <form
      className="grid gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        const ok = await action.run(() => adminApi.patch(`/providers/${id}`, { bio: value.trim() || null }), "معرفی خدمات‌دهنده ذخیره شد.");
        if (ok) setEditing(false);
      }}
    >
      <Field error={action.errors.bio} hint="در پروفایل عمومی خدمات‌دهنده به کشاورزان نمایش داده می‌شود." htmlFor="provider-bio" label="معرفی">
        <Textarea
          aria-invalid={Boolean(action.errors.bio)}
          autoFocus
          id="provider-bio"
          maxLength={1000}
          onChange={(event) => setValue(event.target.value)}
          rows={4}
          value={value}
        />
      </Field>
      <div className="flex justify-end gap-2">
        <Button onClick={() => setEditing(false)} type="button" variant="ghost">
          انصراف
        </Button>
        <Button loading={action.pending} type="submit">
          ذخیره
        </Button>
      </div>
    </form>
  );
}
