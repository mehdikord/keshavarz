"use client";

import { useCallback, useEffect, useState } from "react";
import { Laptop, LogOut, MonitorSmartphone, RefreshCw, Smartphone } from "lucide-react";
import { toast } from "sonner";

import { AdminConfirmDialog } from "@/components/admin-panel/dialogs/admin-confirm-dialog";
import { AdminPageHeader } from "@/components/admin-panel/shell/admin-page-header";
import { AdminSectionCard } from "@/components/admin-panel/shell/admin-section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  listAdminDeviceSessions,
  logoutOtherAdminSessions,
  revokeAdminDeviceSession,
  type AdminDeviceSession,
} from "@/lib/api/admin-auth";
import { isApiClientError } from "@/lib/api/envelope";
import { formatAdminDateTime } from "@/lib/admin/format";

interface DeviceDescription {
  label: string;
  mobile: boolean;
}

/** Coarse, dependency-free user-agent summary — enough to recognise a device. */
function describeUserAgent(userAgent: string | null): DeviceDescription {
  if (!userAgent) return { label: "دستگاه ناشناخته", mobile: false };
  const ua = userAgent.toLowerCase();

  const browser = ua.includes("edg/")
    ? "Edge"
    : ua.includes("opr/") || ua.includes("opera")
      ? "Opera"
      : ua.includes("firefox/")
        ? "Firefox"
        : ua.includes("chrome/") || ua.includes("crios/")
          ? "Chrome"
          : ua.includes("safari/")
            ? "Safari"
            : null;

  const os = ua.includes("android")
    ? "Android"
    : ua.includes("iphone") || ua.includes("ipad")
      ? "iOS"
      : ua.includes("windows")
        ? "Windows"
        : ua.includes("mac os")
          ? "macOS"
          : ua.includes("linux")
            ? "Linux"
            : null;

  const mobile = /android|iphone|ipad|mobile/.test(ua);
  const label = [browser, os].filter(Boolean).join(" روی ");
  return { label: label || "مرورگر ناشناخته", mobile };
}

export function AdminSessionsPage() {
  const [sessions, setSessions] = useState<AdminDeviceSession[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingRevoke, setPendingRevoke] = useState<AdminDeviceSession | null>(null);
  const [confirmOthers, setConfirmOthers] = useState(false);
  const [mutating, setMutating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSessions(await listAdminDeviceSessions());
    } catch (cause) {
      setError(isApiClientError(cause) ? cause.message : "بارگذاری نشست‌ها ناموفق بود.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void listAdminDeviceSessions()
      .then((result) => {
        if (!cancelled) setSessions(result);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(isApiClientError(cause) ? cause.message : "بارگذاری نشست‌ها ناموفق بود.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const others = sessions?.filter((session) => !session.current) ?? [];

  async function revokeOne(session: AdminDeviceSession) {
    setMutating(true);
    try {
      await revokeAdminDeviceSession(session.sessionId);
      toast.success("نشست پایان یافت");
      setPendingRevoke(null);
      await load();
    } catch (cause) {
      toast.error(isApiClientError(cause) ? cause.message : "پایان نشست ناموفق بود.");
    } finally {
      setMutating(false);
    }
  }

  async function revokeOthers() {
    setMutating(true);
    try {
      const count = await logoutOtherAdminSessions();
      toast.success(
        count > 0
          ? `${count.toLocaleString("fa-IR")} نشست دیگر پایان یافت`
          : "نشست فعال دیگری وجود نداشت",
      );
      setConfirmOthers(false);
      await load();
    } catch (cause) {
      toast.error(isApiClientError(cause) ? cause.message : "خروج از سایر دستگاه‌ها ناموفق بود.");
    } finally {
      setMutating(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <AdminPageHeader
        title="نشست‌های فعال"
        description="دستگاه‌هایی که با حساب شما وارد پنل شده‌اند. اگر نشستی را نمی‌شناسید، آن را پایان دهید و رمز عبور خود را تغییر دهید."
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void load()}
              disabled={loading}
            >
              <RefreshCw className="size-4" />
              به‌روزرسانی
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setConfirmOthers(true)}
              disabled={loading || others.length === 0}
            >
              <LogOut className="size-4" />
              خروج از سایر دستگاه‌ها
            </Button>
          </>
        }
      />

      <AdminSectionCard padded={false}>
        {loading && !sessions ? (
          <div className="space-y-3 p-4 sm:p-5">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
              تلاش مجدد
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--admin-border)]">
            {(sessions ?? []).map((session) => {
              const device = describeUserAgent(session.userAgent);
              const Icon = device.mobile ? Smartphone : Laptop;
              return (
                <li
                  key={session.sessionId}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{device.label}</p>
                      {session.current ? <Badge variant="success">همین دستگاه</Badge> : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      آخرین فعالیت: {formatAdminDateTime(session.lastActivityAt)}
                      {" · "}
                      ورود: {formatAdminDateTime(session.createdAt)}
                    </p>
                    {session.ipAddress ? (
                      <p className="font-mono text-xs text-muted-foreground" dir="ltr">
                        {session.ipAddress}
                      </p>
                    ) : null}
                  </div>
                  {!session.current ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="self-start sm:self-center"
                      onClick={() => setPendingRevoke(session)}
                    >
                      پایان نشست
                    </Button>
                  ) : null}
                </li>
              );
            })}
            {sessions && sessions.length <= 1 ? (
              <li className="flex items-center gap-2 p-4 text-sm text-muted-foreground sm:p-5">
                <MonitorSmartphone className="size-4" />
                نشست فعال دیگری روی دستگاه‌های دیگر وجود ندارد.
              </li>
            ) : null}
          </ul>
        )}
      </AdminSectionCard>

      <AdminConfirmDialog
        open={pendingRevoke !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRevoke(null);
        }}
        title="پایان این نشست؟"
        description="دستگاه انتخاب‌شده فوراً از پنل خارج می‌شود."
        confirmLabel="پایان نشست"
        destructive
        loading={mutating}
        onConfirm={() => (pendingRevoke ? revokeOne(pendingRevoke) : undefined)}
      />

      <AdminConfirmDialog
        open={confirmOthers}
        onOpenChange={setConfirmOthers}
        title="خروج از سایر دستگاه‌ها؟"
        description="همه نشست‌ها به جز همین دستگاه پایان می‌یابند."
        confirmLabel="خروج از سایر دستگاه‌ها"
        destructive
        loading={mutating}
        onConfirm={revokeOthers}
      />
    </div>
  );
}
