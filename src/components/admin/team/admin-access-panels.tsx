"use client";

import { Plus, ShieldCheck, ShieldX, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useAdminViewer, useCan } from "@/components/admin/shell/admin-context";
import { Badge } from "@/components/admin/ui/badge";
import { Button } from "@/components/admin/ui/button";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { Dialog, DialogBody, DialogContent, DialogFooter } from "@/components/admin/ui/dialog";
import { Field, NativeSelect, Textarea } from "@/components/admin/ui/input";
import { EmptyState, Panel, PanelHeader } from "@/components/admin/ui/panel";
import { useAdminAction } from "@/components/admin/ui/use-admin-action";
import { adminApi } from "@/lib/admin/api";
import { faNumber, formatDateTime, formatShortDate } from "@/lib/admin/format";
import { ADMIN_PERMISSIONS, can } from "@/lib/admin/permissions";
import { cn } from "@/lib/utils";
import type { RoleOption, TeamAdminDetail } from "@/server/modules/admin/team/team.service";

import { ExpirySelect, expiryFromDays } from "./expiry-select";
import { RolePicker } from "./role-picker";
import { groupPermissionCodes, permissionLabel } from "./team-labels";

function useEditable(adminId: string, isSuperAdmin: boolean) {
  const viewer = useAdminViewer();
  const canManage = useCan(ADMIN_PERMISSIONS.adminsManage);
  const isSelf = viewer.id === adminId;
  return {
    editable: canManage && !isSelf && (!isSuperAdmin || viewer.isSuperAdmin),
    reason: isSelf ? "دسترسی‌های حساب خودتان را مدیر دیگری باید تغییر دهد." : null,
    viewer,
  };
}

export function RolesPanel({ detail, roles }: { detail: TeamAdminDetail; roles: RoleOption[] }) {
  const { editable, reason, viewer } = useEditable(detail.admin.id, detail.admin.isSuperAdmin);
  const [open, setOpen] = useState(false);
  const current = detail.assignments.filter((row) => !row.expired);

  return (
    <Panel className="overflow-hidden">
      <PanelHeader
        action={
          editable ? (
            <Button onClick={() => setOpen(true)} size="sm" variant="outline">
              ویرایش نقش‌ها
            </Button>
          ) : null
        }
        description={reason ?? "دسترسی‌های هر نقش روی هم جمع می‌شوند."}
        title="نقش‌ها"
      />
      {detail.assignments.length === 0 ? (
        <EmptyState className="py-8" title={detail.admin.isSuperAdmin ? "مدیر ارشد به نقش نیاز ندارد" : "هنوز نقشی داده نشده است"} />
      ) : (
        <ul className="divide-y divide-line border-t border-line">
          {detail.assignments.map((row) => (
            <li className={cn("flex flex-wrap items-center justify-between gap-2 px-5 py-3", row.expired && "opacity-60")} key={row.role.id}>
              <div className="min-w-0">
                <Link className="font-semibold hover:underline" href={`/admins/team/roles/${row.role.id}`}>
                  {row.role.name}
                </Link>
                <p className="text-[11.5px] text-muted-foreground">
                  {faNumber(row.role.permissions.length)} دسترسی · از {formatShortDate(row.assignedAt)}
                  {row.assignedBy ? ` · توسط ${row.assignedBy}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                {row.role.isActive ? null : <Badge tone="neutral">نقش غیرفعال</Badge>}
                {row.expired ? (
                  <Badge tone="danger">منقضی شده</Badge>
                ) : row.expiresAt ? (
                  <Badge tone="warning">تا {formatDateTime(row.expiresAt)}</Badge>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
      {open ? (
        <RolesDialog
          current={current.map((row) => ({ expiresAt: row.expiresAt, roleId: row.role.id }))}
          detail={detail}
          onClose={() => setOpen(false)}
          roles={roles}
          viewerAccess={viewer.access}
        />
      ) : null}
    </Panel>
  );
}

function RolesDialog({
  current,
  detail,
  onClose,
  roles,
  viewerAccess,
}: {
  current: Array<{ expiresAt: string | null; roleId: string }>;
  detail: TeamAdminDetail;
  onClose: () => void;
  roles: RoleOption[];
  viewerAccess: ReturnType<typeof useAdminViewer>["access"];
}) {
  const initial = current.map((row) => row.roleId);
  const [selected, setSelected] = useState<string[]>(initial);
  // -1 keeps the existing expiry of a role that is already assigned.
  const [expiry, setExpiry] = useState<Record<string, number>>(() => Object.fromEntries(initial.map((id) => [id, -1])));
  const action = useAdminAction();

  async function submit() {
    const ok = await action.run(
      () =>
        adminApi.patch(`/team/admins/${detail.admin.id}/roles`, {
          roles: selected.map((roleId) => {
            const days = expiry[roleId] ?? 0;
            const existing = current.find((row) => row.roleId === roleId)?.expiresAt ?? null;
            return { expiresAt: days === -1 ? existing : expiryFromDays(days), roleId };
          }),
        }),
      "نقش‌های مدیر به‌روز شد.",
    );
    if (ok) onClose();
  }

  const chosen = roles.filter((role) => selected.includes(role.id));
  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open>
      <DialogContent description="نقش‌هایی را که می‌خواهید این مدیر داشته باشد انتخاب کنید. برای دسترسی موقت، مدت اعتبار بگذارید." size="lg" title={`نقش‌های «${detail.admin.name}»`}>
        <DialogBody>
          <RolePicker
            canGrant={(role) => role.permissions.every((code) => can(viewerAccess, code as never))}
            initiallySelected={initial}
            onChange={setSelected}
            roles={roles}
            value={selected}
          />
          {chosen.length ? (
            <div className="grid gap-2">
              <p className="text-[12.5px] font-semibold text-foreground/85">مدت اعتبار</p>
              {chosen.map((role) => (
                <div className="flex items-center justify-between gap-3 rounded-lg bg-raised px-3 py-2" key={role.id}>
                  <span className="truncate text-[13px] font-semibold">{role.name}</span>
                  <ExpirySelect
                    className="w-40 shrink-0"
                    keepLabel={initial.includes(role.id) ? "بدون تغییر" : undefined}
                    onChange={(days) => setExpiry((previous) => ({ ...previous, [role.id]: days }))}
                    value={expiry[role.id] ?? 0}
                  />
                </div>
              ))}
            </div>
          ) : null}
          {action.error && Object.keys(action.errors).length ? <p className="text-xs text-danger">{action.error}</p> : null}
        </DialogBody>
        <DialogFooter>
          <Button onClick={onClose} variant="ghost">
            انصراف
          </Button>
          <Button loading={action.pending} onClick={() => void submit()}>
            ذخیره نقش‌ها
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function OverridesPanel({ detail }: { detail: TeamAdminDetail }) {
  const { editable, viewer } = useEditable(detail.admin.id, detail.admin.isSuperAdmin);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<TeamAdminDetail["overrides"][number] | null>(null);
  const action = useAdminAction();

  return (
    <Panel className="overflow-hidden">
      <PanelHeader
        action={
          editable ? (
            <Button onClick={() => setAdding(true)} size="sm" variant="outline">
              <Plus />
              افزودن استثنا
            </Button>
          ) : null
        }
        description="اجازه یا منع یک دسترسی مشخص برای همین مدیر، جدا از نقش‌ها. «منع» همیشه بر نقش‌ها مقدم است."
        title="استثناهای دسترسی"
      />
      {detail.overrides.length === 0 ? (
        <EmptyState className="py-8" title="استثنایی ثبت نشده است" />
      ) : (
        <ul className="divide-y divide-line border-t border-line">
          {detail.overrides.map((row) => (
            <li className={cn("flex flex-wrap items-start justify-between gap-3 px-5 py-3", row.expired && "opacity-60")} key={row.id}>
              <div className="flex min-w-0 items-start gap-2.5">
                <span
                  className={cn(
                    "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
                    row.effect === "allow" ? "bg-ok-soft text-ok" : "bg-danger-soft text-danger",
                  )}
                >
                  {row.effect === "allow" ? <ShieldCheck className="size-4" /> : <ShieldX className="size-4" />}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold">
                    {row.effect === "allow" ? "اجازه: " : "منع: "}
                    {permissionLabel(row.code)}
                  </p>
                  <p className="text-[12px] leading-5 text-muted-foreground">{row.reason}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatShortDate(row.createdAt)}
                    {row.grantedBy ? ` · ${row.grantedBy}` : ""}
                    {row.expired ? " · منقضی شده" : row.expiresAt ? ` · تا ${formatDateTime(row.expiresAt)}` : ""}
                  </p>
                </div>
              </div>
              {editable ? (
                <Button aria-label="حذف استثنا" onClick={() => setRemoving(row)} size="icon-sm" variant="ghost">
                  <Trash2 />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {adding ? <OverrideDialog codes={detail.permissionCodes} detail={detail} onClose={() => setAdding(false)} viewerAccess={viewer.access} /> : null}
      <ConfirmDialog
        confirm="حذف استثنا"
        description={removing ? `استثنای «${permissionLabel(removing.code)}» حذف می‌شود و دسترسی فقط از نقش‌ها تعیین می‌شود.` : ""}
        onConfirm={() => {
          if (!removing) return;
          void action
            .run(() => adminApi.delete(`/team/admins/${detail.admin.id}/overrides/${removing.id}`), "استثنا حذف شد.")
            .then((ok) => ok && setRemoving(null));
        }}
        onOpenChange={(open) => !open && setRemoving(null)}
        open={removing !== null}
        pending={action.pending}
        title="حذف استثنای دسترسی"
      />
    </Panel>
  );
}

function OverrideDialog({
  codes,
  detail,
  onClose,
  viewerAccess,
}: {
  codes: string[];
  detail: TeamAdminDetail;
  onClose: () => void;
  viewerAccess: ReturnType<typeof useAdminViewer>["access"];
}) {
  const [effect, setEffect] = useState<"allow" | "deny">("allow");
  const [permission, setPermission] = useState("");
  const [days, setDays] = useState(0);
  const [reason, setReason] = useState("");
  const action = useAdminAction();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const ok = await action.run(
      () =>
        adminApi.post(`/team/admins/${detail.admin.id}/overrides`, {
          effect,
          expiresAt: expiryFromDays(days),
          permission,
          reason,
        }),
      "استثنای دسترسی ثبت شد.",
    );
    if (ok) onClose();
  }

  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open>
      <DialogContent description="اگر برای این دسترسی از قبل استثنایی وجود داشته باشد، جایگزین می‌شود." title="افزودن استثنای دسترسی">
        <form noValidate onSubmit={submit}>
          <DialogBody>
            <div className="grid grid-cols-2 gap-2" role="radiogroup">
              {(["allow", "deny"] as const).map((value) => (
                <button
                  aria-checked={effect === value}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[13px] font-semibold transition-colors",
                    effect === value
                      ? value === "allow"
                        ? "border-ok bg-ok-soft text-ok"
                        : "border-danger bg-danger-soft text-danger"
                      : "border-line text-muted-foreground hover:bg-muted",
                  )}
                  key={value}
                  onClick={() => setEffect(value)}
                  role="radio"
                  type="button"
                >
                  {value === "allow" ? <ShieldCheck className="size-4" /> : <ShieldX className="size-4" />}
                  {value === "allow" ? "اجازه بده" : "منع کن"}
                </button>
              ))}
            </div>
            <Field error={action.errors.permission} htmlFor="override-permission" label="دسترسی">
              <NativeSelect id="override-permission" onChange={(event) => setPermission(event.target.value)} value={permission}>
                <option value="">انتخاب کنید</option>
                {groupPermissionCodes(codes).map((group) => (
                  <optgroup key={group.module} label={group.label}>
                    {group.permissions.map((item) => (
                      <option disabled={effect === "allow" && !can(viewerAccess, item.code)} key={item.code} value={item.code}>
                        {item.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </NativeSelect>
            </Field>
            <Field htmlFor="override-expiry" label="مدت اعتبار">
              <ExpirySelect id="override-expiry" onChange={setDays} value={days} />
            </Field>
            <Field error={action.errors.reason} htmlFor="override-reason" label="دلیل">
              <Textarea id="override-reason" maxLength={500} onChange={(event) => setReason(event.target.value)} rows={3} value={reason} />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button onClick={onClose} type="button" variant="ghost">
              انصراف
            </Button>
            <Button disabled={!permission || reason.trim().length < 5} loading={action.pending} type="submit">
              ثبت استثنا
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
