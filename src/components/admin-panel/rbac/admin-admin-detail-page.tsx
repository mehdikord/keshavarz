"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, KeyRound } from "lucide-react";
import { toast } from "sonner";

import {
  AdminConfirmDialog,
  AdminForbidden,
  AdminPageHeader,
  AdminSectionCard,
  AdminStatusBadge,
} from "@/components/admin-panel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAdminPermissions } from "@/hooks/admin/use-admin-permissions";
import { useAdminSession } from "@/hooks/admin/use-admin-session";
import { copyPublicId, formatAdminDateTime } from "@/lib/admin/format";
import { fetchAdminMe } from "@/lib/api/admin-auth";
import {
  fetchAdminAdmin,
  fetchAdminPermissions,
  fetchAdminRolePermissions,
  fetchAdminRoles,
  groupPermissionsByModule,
  patchAdminAdmin,
  previewEffectivePermissions,
  replaceAdminAdminRoles,
  replaceAdminPermissionOverrides,
  resetAdminAdminPassword,
  updateAdminAdminStatus,
  type AdminDetail,
  type AdminPermission,
  type AdminPermissionOverride,
  type AdminRole,
} from "@/lib/api/admin-rbac";
import { isApiClientError } from "@/lib/api/envelope";
import { toPersianDigits } from "@/lib/utils/format";

interface AdminAdminDetailPageProps {
  adminId: string;
}

export function AdminAdminDetailPage({ adminId }: AdminAdminDetailPageProps) {
  const { can, isSuperAdmin: actorIsSuperAdmin } = useAdminPermissions();
  const { admin: sessionAdmin, setAdmin: setSessionAdmin } = useAdminSession();
  const canView = can("admins.view");
  const canManage = can("admins.manage");
  // Role and permission catalogs are behind roles.view; degrade without it.
  const canViewRoles = can("roles.view");

  const [detail, setDetail] = useState<AdminDetail | null>(null);
  const [rolesCatalog, setRolesCatalog] = useState<AdminRole[]>([]);
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [rolePermissionMap, setRolePermissionMap] = useState<
    Record<string, string[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [rolesConfirmOpen, setRolesConfirmOpen] = useState(false);
  const [savingRoles, setSavingRoles] = useState(false);

  const [overrides, setOverrides] = useState<AdminPermissionOverride[]>([]);
  const [overrideCode, setOverrideCode] = useState("");
  const [overrideEffect, setOverrideEffect] = useState<"allow" | "deny">(
    "allow",
  );
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideExpiresAt, setOverrideExpiresAt] = useState("");
  const [overridesConfirmOpen, setOverridesConfirmOpen] = useState(false);

  const [statusConfirm, setStatusConfirm] = useState<"activate" | "deactivate" | null>(
    null,
  );
  const [resetOpen, setResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (!canView) return;
    const controller = new AbortController();

    void Promise.all([
      fetchAdminAdmin(adminId, controller.signal),
      canViewRoles ? fetchAdminRoles(controller.signal) : Promise.resolve([]),
      canViewRoles
        ? fetchAdminPermissions(controller.signal)
        : Promise.resolve([]),
    ])
      .then(async ([admin, roles, perms]) => {
        if (controller.signal.aborted) return;
        setDetail(admin);
        setName(admin.name);
        setEmail(admin.email ?? "");
        setSelectedRoleIds(admin.roles.map((role) => role.roleId));
        setOverrides(admin.permissionOverrides);
        setRolesCatalog(roles);
        setPermissions(perms);

        const roleCodes = canViewRoles
          ? admin.roles.map((role) => role.roleId)
          : [];
        const entries = await Promise.all(
          roleCodes.map(async (roleId) => {
            const result = await fetchAdminRolePermissions(
              roleId,
              controller.signal,
            );
            return [roleId, result.permissionCodes] as const;
          }),
        );
        if (controller.signal.aborted) return;
        setRolePermissionMap(Object.fromEntries(entries));
        setError(null);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          isApiClientError(cause)
            ? cause.message
            : "بارگذاری مدیر ناموفق بود.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [adminId, canView, canViewRoles, reloadKey]);

  // Newly ticked roles need their permission codes for the preview.
  const ensureRolePermissions = useCallback(
    (roleId: string) => {
      if (!canViewRoles || rolePermissionMap[roleId]) return;
      void fetchAdminRolePermissions(roleId)
        .then((result) =>
          setRolePermissionMap((prev) => ({
            ...prev,
            [roleId]: result.permissionCodes,
          })),
        )
        .catch(() => undefined);
    },
    [canViewRoles, rolePermissionMap],
  );

  const rolePermissionCodes = useMemo(() => {
    const codes = new Set<string>();
    for (const roleId of selectedRoleIds) {
      for (const code of rolePermissionMap[roleId] ?? []) {
        codes.add(code);
      }
    }
    return [...codes];
  }, [rolePermissionMap, selectedRoleIds]);

  const effectivePreview = useMemo(() => {
    if (!detail) return [];
    return previewEffectivePermissions({
      allPermissionCodes: permissions.map((item) => item.permissionCode),
      isSuperAdmin: detail.isSuperAdmin,
      overrides,
      rolePermissionCodes,
    });
  }, [detail, overrides, permissions, rolePermissionCodes]);

  const permissionGroups = useMemo(
    () => groupPermissionsByModule(permissions),
    [permissions],
  );

  const isSelf = sessionAdmin?.adminId === adminId;
  // Mirrors the server escalation guards: only super admins manage super
  // admins, and nobody but a super admin edits their own access.
  const canEditTarget =
    canManage && Boolean(detail) && (actorIsSuperAdmin || !detail?.isSuperAdmin);
  const canEditAccess = canEditTarget && (actorIsSuperAdmin || !isSelf);

  /** Keep the session (menu, gating) in sync after editing your own account. */
  const syncSelf = useCallback(() => {
    if (!isSelf) return;
    void fetchAdminMe()
      .then(setSessionAdmin)
      .catch(() => undefined);
  }, [isSelf, setSessionAdmin]);

  if (!canView) return <AdminForbidden />;

  if (loading && !detail) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <AdminSectionCard className="flex flex-col items-center gap-3 text-center text-sm text-destructive">
        {error ?? "مدیر یافت نشد."}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setLoading(true);
            setError(null);
            setReloadKey((value) => value + 1);
          }}
        >
          تلاش مجدد
        </Button>
      </AdminSectionCard>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <AdminPageHeader
        title={detail.name}
        description="پروفایل، نقش‌ها، override و اقدامات امنیتی مدیر."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/admins/admins">بازگشت</Link>
            </Button>
            {can("audit_logs.view") ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/admins/audit-logs?adminId=${encodeURIComponent(adminId)}`}>
                  گزارش ممیزی این مدیر
                </Link>
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <AdminStatusBadge
          status={detail.isActive ? "active" : "inactive"}
          label={detail.isActive ? "فعال" : "غیرفعال"}
        />
        {detail.isSuperAdmin ? (
          <AdminStatusBadge status="approved" label="مدیر ارشد" />
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 gap-1 px-2 font-mono text-xs"
          dir="ltr"
          onClick={() => void copyPublicId(detail.adminId)}
        >
          <Copy className="size-3.5" />
          {detail.adminId}
        </Button>
      </div>

      <Tabs defaultValue="profile" className="gap-4">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="profile">پروفایل</TabsTrigger>
          <TabsTrigger value="roles">نقش‌ها</TabsTrigger>
          <TabsTrigger value="overrides">استثناهای دسترسی</TabsTrigger>
          <TabsTrigger value="effective">
            مجوزهای مؤثر ({toPersianDigits(effectivePreview.length)})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
            <AdminSectionCard>
              <form
                className="grid gap-4 sm:grid-cols-2"
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (!canEditTarget) return;
                  setSavingProfile(true);
                  try {
                    const updated = await patchAdminAdmin(adminId, {
                      email: email.trim() || null,
                      name: name.trim(),
                    });
                    setDetail(updated);
                    syncSelf();
                    toast.success("پروفایل به‌روزرسانی شد");
                  } catch (cause) {
                    toast.error(
                      isApiClientError(cause)
                        ? cause.message
                        : "ذخیره پروفایل ناموفق بود.",
                    );
                  } finally {
                    setSavingProfile(false);
                  }
                }}
              >
                <div className="space-y-2">
                  <Label>نام</Label>
                  <Input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    disabled={!canEditTarget || savingProfile}
                  />
                </div>
                <div className="space-y-2">
                  <Label>موبایل</Label>
                  <Input value={detail.phone} readOnly dir="ltr" className="font-mono" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>ایمیل</Label>
                  <Input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={!canEditTarget || savingProfile}
                    dir="ltr"
                  />
                </div>
                <p className="text-xs text-muted-foreground sm:col-span-2">
                  ایجاد: {formatAdminDateTime(detail.createdAt)} · به‌روزرسانی:{" "}
                  {formatAdminDateTime(detail.updatedAt)}
                </p>
                {canEditTarget ? (
                  <div className="sm:col-span-2">
                    <Button type="submit" disabled={savingProfile}>
                      {savingProfile ? "در حال ذخیره..." : "ذخیره پروفایل"}
                    </Button>
                  </div>
                ) : null}
              </form>
            </AdminSectionCard>

            <AdminSectionCard>
              <h2 className="mb-3 text-sm font-semibold">اقدامات امنیتی</h2>
              {!canManage ? (
                <p className="text-sm text-muted-foreground">
                  برای این بخش به مجوز «مدیریت مدیران» نیاز دارید.
                </p>
              ) : !canEditTarget ? (
                <p className="text-sm text-muted-foreground">
                  فقط مدیر ارشد می‌تواند حساب مدیر ارشد دیگری را مدیریت کند.
                </p>
              ) : (
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      setStatusConfirm(detail.isActive ? "deactivate" : "activate")
                    }
                  >
                    {detail.isActive ? "غیرفعال‌سازی" : "فعال‌سازی"}
                  </Button>
                  {isSelf ? (
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/admins/me/change-password">
                        <KeyRound className="size-4" />
                        تغییر رمز عبور خودم
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setNewPassword("");
                        setResetOpen(true);
                      }}
                    >
                      <KeyRound className="size-4" />
                      ریست رمز عبور
                    </Button>
                  )}
                  {isSelf ? (
                    <p className="text-xs text-muted-foreground">
                      حساب خودتان را نمی‌توانید غیرفعال کنید.
                    </p>
                  ) : null}
                </div>
              )}
            </AdminSectionCard>
          </div>
        </TabsContent>

        <TabsContent value="roles">
          <AdminSectionCard>
            <p className="mb-4 text-sm text-muted-foreground">
              با ذخیره، فهرست نقش‌های این مدیر به‌طور کامل با انتخاب‌های زیر جایگزین می‌شود.
            </p>
            {!canViewRoles ? (
              <p className="mb-4 text-sm text-muted-foreground">
                برای دیدن و تغییر نقش‌ها به مجوز «مشاهده نقش‌ها» نیاز دارید.
              </p>
            ) : canManage && !canEditAccess ? (
              <p className="mb-4 text-sm text-amber-700">
                {isSelf
                  ? "نقش‌ها و مجوزهای حساب خودتان را نمی‌توانید تغییر دهید."
                  : "فقط مدیر ارشد می‌تواند نقش‌های مدیر ارشد را تغییر دهد."}
              </p>
            ) : null}
            <div className="space-y-2">
              {rolesCatalog.map((role) => {
                const checked = selectedRoleIds.includes(role.roleId);
                return (
                  <label
                    key={role.roleId}
                    className="flex items-start gap-3 rounded-lg border border-[var(--admin-border)] px-3 py-2"
                  >
                    <Checkbox
                      checked={checked}
                      // An inactive role can still be removed, just not added.
                      disabled={!canEditAccess || (!role.isActive && !checked)}
                      onCheckedChange={(value) => {
                        if (value) ensureRolePermissions(role.roleId);
                        setSelectedRoleIds((prev) => {
                          if (value) return [...new Set([...prev, role.roleId])];
                          return prev.filter((id) => id !== role.roleId);
                        });
                      }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{role.name}</span>
                        {role.isSystem ? (
                          <AdminStatusBadge status="pending" label="سیستمی" />
                        ) : null}
                        {!role.isActive ? (
                          <AdminStatusBadge status="inactive" label="غیرفعال" />
                        ) : null}
                      </span>
                      <span className="mt-0.5 block font-mono text-[11px] text-muted-foreground" dir="ltr">
                        {role.roleId}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
            {canEditAccess && canViewRoles ? (
              <Button
                type="button"
                className="mt-4"
                disabled={savingRoles}
                onClick={() => setRolesConfirmOpen(true)}
              >
                ذخیره نقش‌ها
              </Button>
            ) : null}
          </AdminSectionCard>
        </TabsContent>

        <TabsContent value="overrides" className="space-y-4">
          <AdminSectionCard>
            <p className="mb-4 text-sm text-muted-foreground">
              استثنا یک مجوز را جدا از نقش‌ها به این مدیر می‌دهد (اجازه) یا از او می‌گیرد (منع).
              «منع» حتی برای مدیر ارشد اولویت دارد. با ذخیره، کل فهرست جایگزین می‌شود.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>مجوز</Label>
                <Select value={overrideCode || undefined} onValueChange={setOverrideCode}>
                  <SelectTrigger className="w-full rounded-lg">
                    <SelectValue placeholder="انتخاب مجوز" />
                  </SelectTrigger>
                  <SelectContent>
                    {permissions.map((item) => (
                      <SelectItem
                        key={item.permissionCode}
                        value={item.permissionCode}
                      >
                        {item.permissionCode} · {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>اثر</Label>
                <Select
                  value={overrideEffect}
                  onValueChange={(value) =>
                    setOverrideEffect(value as "allow" | "deny")
                  }
                >
                  <SelectTrigger className="w-full rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="allow">اجازه</SelectItem>
                    <SelectItem value="deny">منع</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="override-expires-at">انقضا (اختیاری)</Label>
                <Input
                  id="override-expires-at"
                  type="datetime-local"
                  value={overrideExpiresAt}
                  onChange={(event) => setOverrideExpiresAt(event.target.value)}
                  dir="ltr"
                  className="text-xs"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>دلیل</Label>
                <Textarea
                  value={overrideReason}
                  onChange={(event) => setOverrideReason(event.target.value)}
                  rows={2}
                />
              </div>
            </div>
            {canEditAccess ? (
              <Button
                type="button"
                variant="outline"
                className="mt-3"
                disabled={!overrideCode}
                onClick={() => {
                  // datetime-local is wall-clock time; the API wants UTC ISO.
                  const expiresAt = overrideExpiresAt
                    ? new Date(overrideExpiresAt)
                    : null;
                  if (expiresAt && Number.isNaN(expiresAt.getTime())) {
                    toast.error("تاریخ انقضا معتبر نیست.");
                    return;
                  }
                  if (expiresAt && expiresAt.getTime() <= Date.now()) {
                    toast.error("تاریخ انقضا باید در آینده باشد.");
                    return;
                  }
                  if (
                    overrides.some((item) => item.permissionCode === overrideCode)
                  ) {
                    toast.error("این مجوز قبلاً در لیست هست.");
                    return;
                  }
                  setOverrides((prev) => [
                    ...prev,
                    {
                      effect: overrideEffect,
                      expiresAt: expiresAt ? expiresAt.toISOString() : null,
                      permissionCode: overrideCode,
                      reason: overrideReason.trim() || null,
                    },
                  ]);
                  setOverrideCode("");
                  setOverrideReason("");
                  setOverrideExpiresAt("");
                }}
              >
                افزودن به پیش‌نویس
              </Button>
            ) : null}
          </AdminSectionCard>

          <AdminSectionCard>
            <h2 className="mb-3 text-sm font-semibold">پیش‌نویس استثناها</h2>
            {overrides.length === 0 ? (
              <p className="text-sm text-muted-foreground">موردی نیست.</p>
            ) : (
              <ul className="space-y-2">
                {overrides.map((item) => (
                  <li
                    key={item.permissionCode}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--admin-border)] px-3 py-2"
                  >
                    <AdminStatusBadge
                      status={item.effect === "deny" ? "rejected" : "approved"}
                      label={item.effect === "deny" ? "منع" : "اجازه"}
                    />
                    <span className="font-mono text-xs" dir="ltr">
                      {item.permissionCode}
                    </span>
                    {item.expiresAt ? (
                      <span className="text-xs text-muted-foreground">
                        تا {formatAdminDateTime(item.expiresAt)}
                      </span>
                    ) : null}
                    {canEditAccess ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="mr-auto h-7"
                        onClick={() =>
                          setOverrides((prev) =>
                            prev.filter(
                              (row) =>
                                row.permissionCode !== item.permissionCode,
                            ),
                          )
                        }
                      >
                        حذف
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            {canEditAccess ? (
              <Button
                type="button"
                className="mt-4"
                onClick={() => setOverridesConfirmOpen(true)}
              >
                ذخیره استثناها
              </Button>
            ) : null}
          </AdminSectionCard>
        </TabsContent>

        <TabsContent value="effective">
          <AdminSectionCard>
            <p className="mb-3 text-sm text-muted-foreground">
              پیش‌نمایش بر اساس نقش‌های انتخاب‌شده و استثناهای پیش‌نویس؛ تا ذخیره نکنید اعمال نمی‌شود.
            </p>
            {detail.isSuperAdmin ? (
              <p className="mb-3 text-xs text-muted-foreground">
                مدیر ارشد همه مجوزها را دارد، مگر مواردی که صریحاً منع شده باشند.
              </p>
            ) : null}
            <div className="space-y-4">
              {permissionGroups.map((group) => {
                const codes = group.permissions.filter((item) =>
                  effectivePreview.includes(item.permissionCode),
                );
                if (codes.length === 0) return null;
                return (
                  <div key={group.module}>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {group.module}
                    </h3>
                    <ul className="flex flex-wrap gap-1.5">
                      {codes.map((item) => (
                        <li key={item.permissionCode}>
                          <span className="inline-flex rounded-md border border-[var(--admin-border)] bg-[var(--admin-canvas)]/50 px-2 py-1 font-mono text-[11px]" dir="ltr">
                            {item.permissionCode}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </AdminSectionCard>
        </TabsContent>
      </Tabs>

      <AdminConfirmDialog
        open={rolesConfirmOpen}
        onOpenChange={setRolesConfirmOpen}
        title="تأیید تخصیص نقش‌ها"
        description="نقش‌های مدیر جایگزین می‌شوند و کش مجوز باطل می‌گردد."
        confirmLabel="ذخیره نقش‌ها"
        onConfirm={async () => {
          setSavingRoles(true);
          try {
            const updated = await replaceAdminAdminRoles(adminId, {
              roleIds: selectedRoleIds,
            });
            setDetail(updated);
            setSelectedRoleIds(updated.roles.map((role) => role.roleId));
            syncSelf();
            toast.success("نقش‌ها ذخیره شد");
            setRolesConfirmOpen(false);
            setLoading(true);
            setReloadKey((value) => value + 1);
          } catch (cause) {
            toast.error(
              isApiClientError(cause)
                ? cause.message
                : "ذخیره نقش‌ها ناموفق بود.",
            );
          } finally {
            setSavingRoles(false);
          }
        }}
      />

      <AdminConfirmDialog
        open={overridesConfirmOpen}
        onOpenChange={setOverridesConfirmOpen}
        title="تأیید ذخیره استثناها"
        description="فهرست فعلی به‌طور کامل جایگزین استثناهای قبلی می‌شود."
        confirmLabel="ذخیره"
        onConfirm={async () => {
          try {
            const updated = await replaceAdminPermissionOverrides(adminId, {
              overrides: overrides.map((item) => ({
                effect: item.effect,
                expiresAt: item.expiresAt,
                permissionCode: item.permissionCode,
                reason: item.reason,
              })),
            });
            setDetail(updated);
            setOverrides(updated.permissionOverrides);
            syncSelf();
            toast.success("استثناها ذخیره شد");
            setOverridesConfirmOpen(false);
          } catch (cause) {
            toast.error(
              isApiClientError(cause)
                ? cause.message
                : "ذخیره استثناها ناموفق بود.",
            );
          }
        }}
      />

      <AdminConfirmDialog
        open={Boolean(statusConfirm)}
        onOpenChange={(open) => {
          if (!open) setStatusConfirm(null);
        }}
        title={
          statusConfirm === "deactivate" ? "غیرفعال‌سازی مدیر" : "فعال‌سازی مدیر"
        }
        description={
          statusConfirm === "deactivate"
            ? "همه نشست‌های این مدیر بلافاصله پایان می‌یابد. آخرین مدیر ارشد را نمی‌توان غیرفعال کرد."
            : undefined
        }
        destructive={statusConfirm === "deactivate"}
        confirmLabel="اعمال"
        onConfirm={async () => {
          try {
            const updated = await updateAdminAdminStatus(adminId, {
              isActive: statusConfirm === "activate",
            });
            setDetail(updated);
            toast.success("وضعیت به‌روزرسانی شد");
            setStatusConfirm(null);
          } catch (cause) {
            toast.error(
              isApiClientError(cause)
                ? cause.message
                : "تغییر وضعیت ناموفق بود.",
            );
          }
        }}
      />

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ریست رمز عبور</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>رمز جدید</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              disabled={resetting}
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground">
              حداقل ۱۲ کاراکتر · نشست‌های مدیر باطل می‌شوند · رمز نمایش داده نمی‌شود.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={resetting}
              onClick={() => setResetOpen(false)}
            >
              انصراف
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={resetting || newPassword.length < 12}
              onClick={async () => {
                setResetting(true);
                try {
                  await resetAdminAdminPassword(adminId, {
                    newPassword,
                  });
                  toast.success("رمز عبور تغییر کرد");
                  setResetOpen(false);
                  setNewPassword("");
                } catch (cause) {
                  toast.error(
                    isApiClientError(cause)
                      ? cause.message
                      : "ریست رمز ناموفق بود.",
                  );
                } finally {
                  setResetting(false);
                }
              }}
            >
              {resetting ? "در حال اعمال..." : "تأیید ریست"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
