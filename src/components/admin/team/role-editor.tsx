"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAdminViewer, useCan } from "@/components/admin/shell/admin-context";
import { Button } from "@/components/admin/ui/button";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { Field, Input, Textarea } from "@/components/admin/ui/input";
import { Panel, PanelHeader } from "@/components/admin/ui/panel";
import { Switch } from "@/components/admin/ui/switch";
import { useAdminAction } from "@/components/admin/ui/use-admin-action";
import { adminApi } from "@/lib/admin/api";
import { faNumber } from "@/lib/admin/format";
import { ADMIN_PERMISSIONS, can } from "@/lib/admin/permissions";

import { PermissionChecklist } from "./permission-matrix";

export interface EditableRole {
  code: string;
  description: string | null;
  id: string;
  isActive: boolean;
  isSystem: boolean;
  members: number;
  name: string;
  permissions: string[];
}

export function RoleEditor({ permissionCodes, role }: { permissionCodes: string[]; role?: EditableRole }) {
  const viewer = useAdminViewer();
  const canManage = useCan(ADMIN_PERMISSIONS.rolesManage);
  const router = useRouter();
  const [name, setName] = useState(role?.name ?? "");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState(role?.description ?? "");
  const [isActive, setIsActive] = useState(role?.isActive ?? true);
  const [permissions, setPermissions] = useState<string[]>(role?.permissions ?? []);
  const [deleting, setDeleting] = useState(false);
  const action = useAdminAction();
  const remove = useAdminAction();

  const locked = Boolean(role?.isSystem);
  const readOnly = !canManage || (locked && !viewer.isSuperAdmin);
  const dirty =
    !role ||
    name !== role.name ||
    (description || null) !== (role.description || null) ||
    isActive !== role.isActive ||
    permissions.length !== role.permissions.length ||
    permissions.some((item) => !role.permissions.includes(item));

  async function save(event: React.FormEvent) {
    event.preventDefault();
    let createdId: string | null = null;
    const ok = await action.run(async () => {
      if (role) {
        await adminApi.patch(`/team/roles/${role.id}`, { description: description.trim() || null, isActive, name, permissions });
      } else {
        createdId = (
          await adminApi.post<{ id: string }>("/team/roles", { code: code.trim(), description: description.trim() || null, isActive, name, permissions })
        ).id;
      }
    }, role ? "نقش ذخیره شد." : "نقش ساخته شد.");
    if (ok && createdId) router.push(`/admins/team/roles/${createdId}`);
  }

  return (
    <form className="grid gap-5" noValidate onSubmit={save}>
      <Panel className="pb-5">
        <PanelHeader
          description={locked ? "نقش سیستمی همه دسترسی‌ها را دارد؛ فقط نام و توضیح آن قابل ویرایش است." : undefined}
          title="مشخصات نقش"
        />
        <div className="grid gap-4 px-5 sm:grid-cols-2">
          <Field error={action.errors.name} htmlFor="role-name" label="نام نقش">
            <Input
              aria-invalid={Boolean(action.errors.name)}
              disabled={readOnly}
              id="role-name"
              maxLength={120}
              onChange={(event) => setName(event.target.value)}
              placeholder="مثلاً پشتیبان مالی"
              value={name}
            />
          </Field>
          {role ? (
            <Field htmlFor="role-code" label="کد">
              <Input className="text-left font-mono text-[12.5px]" dir="ltr" disabled id="role-code" readOnly value={role.code} />
            </Field>
          ) : (
            <Field error={action.errors.code} hint="اختیاری؛ خالی بگذارید تا خودکار ساخته شود. بعداً قابل تغییر نیست." htmlFor="role-code" label="کد لاتین">
              <Input
                aria-invalid={Boolean(action.errors.code)}
                className="text-left font-mono text-[12.5px]"
                dir="ltr"
                id="role-code"
                maxLength={100}
                onChange={(event) => setCode(event.target.value)}
                placeholder="finance_support"
                value={code}
              />
            </Field>
          )}
          <div className="sm:col-span-2">
            <Field error={action.errors.description} htmlFor="role-description" label="توضیحات">
              <Textarea
                disabled={readOnly}
                id="role-description"
                maxLength={500}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="این نقش برای چه کسانی است و چه کاری انجام می‌دهند"
                rows={2}
                value={description}
              />
            </Field>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl border border-line px-4 py-3 sm:col-span-2">
            <div>
              <label className="text-[13px] font-semibold" htmlFor="role-active">
                نقش فعال
              </label>
              <p className="mt-0.5 text-xs text-muted-foreground">نقش غیرفعال هیچ دسترسی‌ای به اعضایش نمی‌دهد، ولی عضویت‌ها حفظ می‌شود.</p>
            </div>
            <Switch checked={isActive} disabled={readOnly || locked} id="role-active" onCheckedChange={setIsActive} />
          </div>
        </div>
      </Panel>

      <Panel className="pb-5">
        <PanelHeader
          description={`${faNumber(permissions.length)} از ${faNumber(permissionCodes.length)} دسترسی انتخاب شده است.${
            viewer.isSuperAdmin ? "" : " دسترسی‌هایی را که خودتان ندارید نمی‌توانید به نقش اضافه کنید."
          }`}
          title="دسترسی‌ها"
        />
        <div className="px-5">
          <PermissionChecklist
            codes={permissionCodes}
            disabled={readOnly || locked}
            grantable={(item) => can(viewer.access, item as never)}
            onChange={setPermissions}
            value={permissions}
          />
          {action.errors.permissions ? <p className="mt-2 text-xs text-danger">{action.errors.permissions}</p> : null}
        </div>
      </Panel>

      {readOnly ? null : (
        <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-[var(--a-shadow-pop)] backdrop-blur">
          <div>
            {role && !locked ? (
              <Button onClick={() => setDeleting(true)} type="button" variant="danger-soft">
                <Trash2 />
                حذف نقش
              </Button>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => router.push("/admins/team/roles")} type="button" variant="ghost">
              {role ? "بازگشت" : "انصراف"}
            </Button>
            <Button disabled={!dirty} loading={action.pending} type="submit">
              {role ? "ذخیره تغییرات" : "ساخت نقش"}
            </Button>
          </div>
        </div>
      )}

      {role ? (
        <ConfirmDialog
          confirm={role.members ? "گرفتن از اعضا و حذف" : "حذف نقش"}
          description={
            role.members
              ? `این نقش به ${faNumber(role.members)} مدیر داده شده است. با حذف، نقش از همه آن‌ها گرفته می‌شود و دسترسی‌هایشان بلافاصله کم می‌شود.`
              : "نقش حذف می‌شود و در گزارش ممیزی باقی می‌ماند."
          }
          onConfirm={() => {
            void remove
              .run(() => adminApi.delete(`/team/roles/${role.id}`, { unassign: role.members > 0 }), "نقش حذف شد.")
              .then((ok) => {
                if (ok) router.push("/admins/team/roles");
              });
          }}
          onOpenChange={setDeleting}
          open={deleting}
          pending={remove.pending}
          title={`حذف نقش «${role.name}»`}
        />
      ) : null}
    </form>
  );
}
