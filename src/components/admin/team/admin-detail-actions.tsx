"use client";

import { KeyRound, LockOpen, LogOut, MoreHorizontal, Pencil, Power, PowerOff } from "lucide-react";
import { useState } from "react";

import { useAdminViewer, useCan } from "@/components/admin/shell/admin-context";
import { Button } from "@/components/admin/ui/button";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { Field, Input, Textarea } from "@/components/admin/ui/input";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/admin/ui/menu";
import { useAdminAction } from "@/components/admin/ui/use-admin-action";
import { adminApi } from "@/lib/admin/api";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";

import { AdminFormDialog, type EditableAdmin } from "./admin-form-dialog";
import { PasswordReveal } from "./password-reveal";

type DialogKind = "status" | "password" | "unlock" | "sessions" | null;

export function AdminDetailActions({
  activeSessions,
  admin,
  isActive,
  locked,
}: {
  activeSessions: number;
  admin: EditableAdmin;
  isActive: boolean;
  locked: boolean;
}) {
  const viewer = useAdminViewer();
  const canManage = useCan(ADMIN_PERMISSIONS.adminsManage);
  const [editOpen, setEditOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [reason, setReason] = useState("");
  const [password, setPassword] = useState("");
  const [revealed, setRevealed] = useState<string | null>(null);
  const action = useAdminAction();

  const isSelf = admin.id === viewer.id;
  const protectedSuper = admin.isSuperAdmin && !viewer.isSuperAdmin;
  if (!canManage || protectedSuper) return null;

  async function confirm() {
    let ok = false;
    if (dialog === "status") {
      ok = await action.run(
        () => adminApi.post(`/team/admins/${admin.id}/status`, { isActive: !isActive, reason }),
        isActive ? "مدیر غیرفعال شد و از همه دستگاه‌ها خارج شد." : "مدیر فعال شد.",
      );
    } else if (dialog === "password") {
      let generated: string | null = null;
      ok = await action.run(async () => {
        const result = await adminApi.post<{ password: string | null }>(`/team/admins/${admin.id}/password`, { password });
        generated = result.password;
      }, "رمز عبور بازنشانی شد و مدیر از همه دستگاه‌ها خارج شد.");
      if (ok && generated) setRevealed(generated);
    } else if (dialog === "unlock") {
      ok = await action.run(() => adminApi.post(`/team/admins/${admin.id}/unlock`), "قفل ورود برداشته شد.");
    } else if (dialog === "sessions") {
      ok = await action.run(() => adminApi.post(`/team/admins/${admin.id}/sessions/revoke`, {}), "مدیر از همه دستگاه‌ها خارج شد.");
    }
    if (ok) {
      setDialog(null);
      setReason("");
      setPassword("");
    }
  }

  return (
    <>
      <Button onClick={() => setEditOpen(true)} variant="outline">
        <Pencil />
        ویرایش
      </Button>
      {isSelf ? null : (
        <Menu>
          <MenuTrigger asChild>
            <Button aria-label="کارهای بیشتر" size="icon" variant="outline">
              <MoreHorizontal />
            </Button>
          </MenuTrigger>
          <MenuContent>
            <MenuItem onSelect={() => setDialog("password")}>
              <KeyRound />
              بازنشانی رمز عبور
            </MenuItem>
            {locked ? (
              <MenuItem onSelect={() => setDialog("unlock")}>
                <LockOpen />
                رفع قفل ورود
              </MenuItem>
            ) : null}
            <MenuItem disabled={activeSessions === 0} onSelect={() => setDialog("sessions")}>
              <LogOut />
              خروج از همه دستگاه‌ها
            </MenuItem>
            <MenuSeparator />
            <MenuItem onSelect={() => setDialog("status")} tone={isActive ? "danger" : "default"}>
              {isActive ? <PowerOff /> : <Power />}
              {isActive ? "غیرفعال کردن حساب" : "فعال کردن حساب"}
            </MenuItem>
          </MenuContent>
        </Menu>
      )}

      <AdminFormDialog admin={admin} onOpenChange={setEditOpen} open={editOpen} />

      <ConfirmDialog
        confirm={isActive ? "غیرفعال کردن" : "فعال کردن"}
        description={
          isActive
            ? "مدیر بلافاصله از همه دستگاه‌ها خارج می‌شود و تا فعال‌سازی دوباره نمی‌تواند وارد شود."
            : "مدیر دوباره می‌تواند با رمز فعلی‌اش وارد پنل شود."
        }
        disabled={reason.trim().length < 5}
        onConfirm={() => void confirm()}
        onOpenChange={(open) => !open && setDialog(null)}
        open={dialog === "status"}
        pending={action.pending}
        title={isActive ? `غیرفعال کردن «${admin.name}»` : `فعال کردن «${admin.name}»`}
        tone={isActive ? "danger" : "primary"}
      >
        <Field error={action.errors.reason} htmlFor="status-reason" label="دلیل (در گزارش ممیزی ثبت می‌شود)">
          <Textarea id="status-reason" maxLength={500} onChange={(event) => setReason(event.target.value)} rows={3} value={reason} />
        </Field>
      </ConfirmDialog>

      <ConfirmDialog
        confirm="بازنشانی رمز"
        description="رمز فعلی بی‌اعتبار و مدیر از همه دستگاه‌ها خارج می‌شود. اگر رمز را خالی بگذارید، یک رمز قوی ساخته و یک بار نمایش داده می‌شود."
        onConfirm={() => void confirm()}
        onOpenChange={(open) => !open && setDialog(null)}
        open={dialog === "password"}
        pending={action.pending}
        title={`بازنشانی رمز «${admin.name}»`}
        tone="primary"
      >
        <Field
          error={action.errors.password}
          hint="اختیاری؛ حداقل ۱۲ نویسه، شامل حرف و عدد."
          htmlFor="reset-password"
          label="رمز عبور جدید"
        >
          <Input
            autoComplete="new-password"
            className="text-left"
            dir="ltr"
            id="reset-password"
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            value={password}
          />
        </Field>
      </ConfirmDialog>

      <ConfirmDialog
        confirm="رفع قفل"
        description="شمارنده تلاش‌های ناموفق صفر می‌شود و مدیر می‌تواند دوباره وارد شود."
        onConfirm={() => void confirm()}
        onOpenChange={(open) => !open && setDialog(null)}
        open={dialog === "unlock"}
        pending={action.pending}
        title="رفع قفل ورود"
        tone="primary"
      />

      <ConfirmDialog
        confirm="خروج از همه دستگاه‌ها"
        description="همه نشست‌های فعال این مدیر بسته می‌شود و باید دوباره وارد شود."
        onConfirm={() => void confirm()}
        onOpenChange={(open) => !open && setDialog(null)}
        open={dialog === "sessions"}
        pending={action.pending}
        title="بستن همه نشست‌ها"
      />

      <PasswordReveal name={admin.name} onClose={() => setRevealed(null)} password={revealed} />
    </>
  );
}
