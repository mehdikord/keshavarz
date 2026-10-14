"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Copy, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import {
  AdminConfirmDialog,
  AdminForbidden,
  AdminPageHeader,
  AdminSectionCard,
  AdminStatusBadge,
} from "@/components/admin-panel";
import { Button } from "@/components/ui/button";
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
import { useAdminPermissions } from "@/hooks/admin/use-admin-permissions";
import { copyPublicId, formatAdminDateTime } from "@/lib/admin/format";
import {
  createUserModerationAction,
  fetchAdminUser,
  fetchUserModerationActions,
  patchAdminUser,
  type AdminModerationAction,
  type AdminUserDetail,
  type UserModerationActionType,
} from "@/lib/api/admin-users";
import { isApiClientError } from "@/lib/api/envelope";

const MODERATION_OPTIONS: Array<{
  value: UserModerationActionType;
  label: string;
  destructive?: boolean;
}> = [
  { value: "warning", label: "اخطار" },
  { value: "activate", label: "فعال‌سازی" },
  { value: "deactivate", label: "غیرفعال‌سازی", destructive: true },
  { value: "suspend", label: "تعلیق", destructive: true },
  { value: "ban", label: "مسدودسازی", destructive: true },
  { value: "unban", label: "رفع مسدودی" },
];

interface AdminUserDetailPageProps {
  userId: string;
}

export function AdminUserDetailPage({ userId }: AdminUserDetailPageProps) {
  const { can } = useAdminPermissions();
  const canView = can("users.view");
  const canUpdate = can("users.update");
  const canModerate = can("users.change_status");

  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [timeline, setTimeline] = useState<AdminModerationAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [locale, setLocale] = useState("");
  const [timezone, setTimezone] = useState("");
  const [saving, setSaving] = useState(false);
  const [moderationAction, setModerationAction] =
    useState<UserModerationActionType>("warning");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!canView) return;
    const controller = new AbortController();

    void Promise.all([
      fetchAdminUser(userId, controller.signal),
      fetchUserModerationActions({
        userId,
        limit: 20,
        signal: controller.signal,
      }),
    ])
      .then(([detail, actions]) => {
        if (controller.signal.aborted) return;
        setUser(detail);
        setName(detail.name);
        setLocale(detail.locale);
        setTimezone(detail.timezone);
        setTimeline(actions.items);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          isApiClientError(cause)
            ? cause.message
            : "بارگذاری کاربر ناموفق بود.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [canView, reloadKey, userId]);

  if (!canView) return <AdminForbidden />;

  if (loading && !user) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <AdminSectionCard className="text-center text-sm text-destructive">
        {error ?? "کاربر یافت نشد."}
      </AdminSectionCard>
    );
  }

  const selectedModeration = MODERATION_OPTIONS.find(
    (item) => item.value === moderationAction,
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <AdminPageHeader
        title={user.name}
        description="جزئیات کاربر، ویرایش فیلدهای مجاز و timeline moderation."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/admins/users">بازگشت به فهرست</Link>
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          <AdminSectionCard>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <AdminStatusBadge
                status={user.isActive ? "active" : "inactive"}
              />
              {user.providerProfile ? (
                <AdminStatusBadge
                  status={user.providerProfile.approved ? "approved" : "pending"}
                  label={
                    user.providerProfile.approved
                      ? "Provider تأییدشده"
                      : "Provider در انتظار"
                  }
                />
              ) : null}
            </div>

            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={async (event) => {
                event.preventDefault();
                if (!canUpdate) return;
                setSaving(true);
                try {
                  const updated = await patchAdminUser(userId, {
                    name: name.trim(),
                    locale: locale.trim(),
                    timezone: timezone.trim(),
                  });
                  setUser(updated);
                  toast.success("پروفایل کاربر به‌روزرسانی شد");
                } catch (cause) {
                  toast.error(
                    isApiClientError(cause)
                      ? cause.message
                      : "ذخیره کاربر ناموفق بود.",
                  );
                } finally {
                  setSaving(false);
                }
              }}
            >
              <div className="space-y-2 sm:col-span-2">
                <Label>شناسه عمومی</Label>
                <div className="flex gap-2">
                  <Input value={user.userId} readOnly className="font-mono text-xs" dir="ltr" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => void copyPublicId(user.userId)}
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-name">نام</Label>
                <Input
                  id="user-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={!canUpdate || saving}
                />
              </div>
              <div className="space-y-2">
                <Label>موبایل</Label>
                <Input value={user.phone} readOnly dir="ltr" className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-locale">Locale</Label>
                <Input
                  id="user-locale"
                  value={locale}
                  onChange={(event) => setLocale(event.target.value)}
                  disabled={!canUpdate || saving}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-timezone">Timezone</Label>
                <Input
                  id="user-timezone"
                  value={timezone}
                  onChange={(event) => setTimezone(event.target.value)}
                  disabled={!canUpdate || saving}
                  dir="ltr"
                />
              </div>
              <div className="space-y-1 text-xs text-muted-foreground sm:col-span-2">
                <p>عضویت: {formatAdminDateTime(user.createdAt)}</p>
                <p>آخرین ورود: {formatAdminDateTime(user.lastLoginAt)}</p>
                <p>تأیید موبایل: {formatAdminDateTime(user.phoneVerifiedAt)}</p>
              </div>
              {canUpdate ? (
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={saving}>
                    {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
                  </Button>
                </div>
              ) : null}
            </form>
          </AdminSectionCard>

          <AdminSectionCard>
            <h2 className="mb-4 text-sm font-semibold">تاریخچه moderation</h2>
            {timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                هنوز اقدامی ثبت نشده است.
              </p>
            ) : (
              <ul className="space-y-3">
                {timeline.map((item) => (
                  <li
                    key={item.moderationActionId}
                    className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-canvas)]/50 px-3 py-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <AdminStatusBadge status="pending" label={item.action} />
                      <span className="text-xs text-muted-foreground">
                        {formatAdminDateTime(item.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-foreground">{item.reason}</p>
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground" dir="ltr">
                      by {item.adminId}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </AdminSectionCard>
        </div>

        <div className="space-y-4">
          <AdminSectionCard>
            <div className="mb-3 flex items-center gap-2">
              <ShieldAlert className="size-4 text-primary" />
              <h2 className="text-sm font-semibold">اقدام moderation</h2>
            </div>
            {!canModerate ? (
              <p className="text-sm text-muted-foreground">
                مجوز `users.change_status` برای این بخش لازم است.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>نوع اقدام</Label>
                  <Select
                    value={moderationAction}
                    onValueChange={(value) =>
                      setModerationAction(value as UserModerationActionType)
                    }
                  >
                    <SelectTrigger className="w-full rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MODERATION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant={selectedModeration?.destructive ? "destructive" : "default"}
                  className="w-full"
                  onClick={() => setConfirmOpen(true)}
                >
                  ثبت اقدام
                </Button>
              </div>
            )}
          </AdminSectionCard>

          {user.providerProfile ? (
            <AdminSectionCard>
              <h2 className="mb-3 text-sm font-semibold">پروفایل Provider</h2>
              <div className="space-y-2 text-sm">
                <p>
                  وضعیت:{" "}
                  {user.providerProfile.approved ? "تأییدشده" : "تأییدنشده"}
                </p>
                <p>
                  فعال: {user.providerProfile.active ? "بله" : "خیر"} · در دسترس:{" "}
                  {user.providerProfile.available ? "بله" : "خیر"}
                </p>
                <Button asChild variant="outline" size="sm" className="mt-2">
                  <Link href={`/admins/providers/${user.userId}`}>
                    مشاهده Provider
                  </Link>
                </Button>
              </div>
            </AdminSectionCard>
          ) : null}
        </div>
      </div>

      <AdminConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`تأیید ${selectedModeration?.label ?? "اقدام"}`}
        description="این اقدام ثبت audit می‌شود و در صورت نیاز نشست‌های کاربر باطل خواهد شد."
        destructive={Boolean(selectedModeration?.destructive)}
        requireReason
        confirmLabel="ثبت"
        onConfirm={async (reason) => {
          try {
            await createUserModerationAction(userId, {
              action: moderationAction,
              reason: reason ?? "",
            });
            toast.success("اقدام moderation ثبت شد");
            setConfirmOpen(false);
            setLoading(true);
            setReloadKey((value) => value + 1);
          } catch (cause) {
            toast.error(
              isApiClientError(cause)
                ? cause.message
                : "ثبت moderation ناموفق بود.",
            );
          }
        }}
      />
    </div>
  );
}
