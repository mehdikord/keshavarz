"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAdminViewer, useCan } from "@/components/admin/shell/admin-context";
import { Button } from "@/components/admin/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter } from "@/components/admin/ui/dialog";
import { Field, Input } from "@/components/admin/ui/input";
import { Switch } from "@/components/admin/ui/switch";
import { useAdminAction } from "@/components/admin/ui/use-admin-action";
import { adminApi } from "@/lib/admin/api";
import { ADMIN_PERMISSIONS, can } from "@/lib/admin/permissions";
import type { RoleOption } from "@/server/modules/admin/team/team.service";

import { PasswordReveal } from "./password-reveal";
import { RolePicker } from "./role-picker";

export interface EditableAdmin {
  email: string | null;
  id: string;
  isSuperAdmin: boolean;
  name: string;
  phone: string;
}

export function AddAdminButton({ roles }: { roles: RoleOption[] }) {
  const canManage = useCan(ADMIN_PERMISSIONS.adminsManage);
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<{ id: string; name: string; password: string | null } | null>(null);
  const router = useRouter();
  if (!canManage) return null;
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        افزودن مدیر
      </Button>
      <AdminFormDialog
        onCreated={(result) => {
          setOpen(false);
          if (result.password) setCreated(result);
          else router.push(`/admins/team/admins/${result.id}`);
        }}
        onOpenChange={setOpen}
        open={open}
        roles={roles}
      />
      <PasswordReveal
        name={created?.name ?? ""}
        onClose={() => {
          const id = created?.id;
          setCreated(null);
          if (id) router.push(`/admins/team/admins/${id}`);
        }}
        password={created?.password ?? null}
      />
    </>
  );
}

export function AdminFormDialog({
  admin,
  onCreated,
  onOpenChange,
  open,
  roles = [],
}: {
  admin?: EditableAdmin;
  onCreated?: (result: { id: string; name: string; password: string | null }) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  roles?: RoleOption[];
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        description={
          admin
            ? "با تغییر شماره موبایل، مدیر از همه دستگاه‌ها خارج می‌شود و باید با شماره جدید وارد شود."
            : "مدیر با شماره موبایل و رمز عبور وارد پنل می‌شود. نقش‌ها مشخص می‌کنند به کدام بخش‌ها دسترسی دارد."
        }
        size="lg"
        title={admin ? "ویرایش مدیر" : "افزودن مدیر"}
      >
        {open ? <AdminForm admin={admin} onCreated={onCreated} onDone={() => onOpenChange(false)} roles={roles} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function AdminForm({
  admin,
  onCreated,
  onDone,
  roles,
}: {
  admin?: EditableAdmin;
  onCreated?: (result: { id: string; name: string; password: string | null }) => void;
  onDone: () => void;
  roles: RoleOption[];
}) {
  const viewer = useAdminViewer();
  const [name, setName] = useState(admin?.name ?? "");
  const [phone, setPhone] = useState(admin?.phone ?? "");
  const [email, setEmail] = useState(admin?.email ?? "");
  const [password, setPassword] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(admin?.isSuperAdmin ?? false);
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const action = useAdminAction();
  const isSelf = admin?.id === viewer.id;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    let result: { id: string; password: string | null } | null = null;
    const ok = await action.run(
      async () => {
        if (admin) {
          await adminApi.patch(`/team/admins/${admin.id}`, {
            email: email.trim() || null,
            name,
            phone,
            ...(viewer.isSuperAdmin && !isSelf ? { isSuperAdmin } : {}),
          });
        } else {
          result = await adminApi.post<{ id: string; password: string | null }>("/team/admins", {
            email: email.trim() || null,
            isSuperAdmin,
            name,
            password,
            phone,
            roleIds,
          });
        }
      },
      admin ? "اطلاعات مدیر ذخیره شد." : "مدیر جدید ساخته شد.",
    );
    if (!ok) return;
    if (result) onCreated?.({ ...(result as { id: string; password: string | null }), name });
    else onDone();
  }

  return (
    <form noValidate onSubmit={submit}>
      <DialogBody>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field error={action.errors.name} htmlFor="admin-name" label="نام و نام خانوادگی">
            <Input aria-invalid={Boolean(action.errors.name)} autoFocus id="admin-name" maxLength={120} onChange={(event) => setName(event.target.value)} value={name} />
          </Field>
          <Field error={action.errors.phone} htmlFor="admin-phone-field" label="شماره موبایل (نام کاربری ورود)">
            <Input
              aria-invalid={Boolean(action.errors.phone)}
              className="text-left"
              dir="ltr"
              id="admin-phone-field"
              inputMode="tel"
              onChange={(event) => setPhone(event.target.value)}
              placeholder="09xxxxxxxxx"
              value={phone}
            />
          </Field>
        </div>
        <Field error={action.errors.email} hint="اختیاری" htmlFor="admin-email" label="ایمیل">
          <Input
            aria-invalid={Boolean(action.errors.email)}
            className="text-left"
            dir="ltr"
            id="admin-email"
            inputMode="email"
            onChange={(event) => setEmail(event.target.value)}
            value={email}
          />
        </Field>
        {admin ? null : (
          <>
            <Field
              error={action.errors.password}
              hint="خالی بگذارید تا یک رمز قوی ساخته و یک بار نمایش داده شود. حداقل ۱۲ نویسه، شامل حرف و عدد."
              htmlFor="admin-password-field"
              label="رمز عبور اولیه"
            >
              <Input
                aria-invalid={Boolean(action.errors.password)}
                autoComplete="new-password"
                className="text-left"
                dir="ltr"
                id="admin-password-field"
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                value={password}
              />
            </Field>
            {roles.length ? (
              <div className="grid gap-1.5">
                <p className="text-[12.5px] font-semibold text-foreground/85">نقش‌ها</p>
                <RolePicker
                  canGrant={(role) => role.permissions.every((code) => can(viewer.access, code as never))}
                  initiallySelected={[]}
                  onChange={setRoleIds}
                  roles={roles}
                  value={roleIds}
                />
                {action.errors.roleIds ? <p className="text-xs text-danger">{action.errors.roleIds}</p> : null}
              </div>
            ) : null}
          </>
        )}
        {viewer.isSuperAdmin ? (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-line px-4 py-3">
            <div className="min-w-0">
              <label className="text-[13px] font-semibold" htmlFor="admin-super">
                مدیر ارشد
              </label>
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                {isSelf
                  ? "سطح مدیر ارشد را نمی‌توانید از حساب خودتان بردارید."
                  : "مدیر ارشد بدون توجه به نقش‌ها به همه بخش‌ها دسترسی کامل دارد."}
              </p>
            </div>
            <Switch checked={isSuperAdmin} disabled={isSelf} id="admin-super" onCheckedChange={setIsSuperAdmin} />
          </div>
        ) : null}
      </DialogBody>
      <DialogFooter>
        <Button onClick={onDone} type="button" variant="ghost">
          انصراف
        </Button>
        <Button loading={action.pending} type="submit">
          {admin ? "ذخیره تغییرات" : "ساخت مدیر"}
        </Button>
      </DialogFooter>
    </form>
  );
}
