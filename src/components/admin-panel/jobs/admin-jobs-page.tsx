"use client";

import { useEffect, useState } from "react";
import { Bell, CreditCard, PlayCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import {
  AdminConfirmDialog,
  AdminDataTable,
  AdminForbidden,
  AdminPageHeader,
  AdminSectionCard,
  AdminStatusBadge,
  type AdminDataTableColumn,
} from "@/components/admin-panel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAdminPermissions } from "@/hooks/admin/use-admin-permissions";
import { formatAdminDateTime } from "@/lib/admin/format";
import {
  ADMIN_JOB_LABELS,
  ADMIN_JOB_NAMES,
  fetchNotificationDeadLetters,
  fetchPaymentDeadLetters,
  replayNotificationDeadLetter,
  replayPaymentDeadLetter,
  runAdminJobs,
  type AdminJobName,
  type JobRunOutcome,
  type NotificationDeadLetter,
  type PaymentDeadLetter,
} from "@/lib/api/admin-jobs";
import { isApiClientError } from "@/lib/api/envelope";
import { toPersianDigits } from "@/lib/utils/format";

const RUNNABLE_JOBS = ADMIN_JOB_NAMES.filter((name) => name !== "all");

export function AdminJobsPage() {
  const { can } = useAdminPermissions();
  const canViewPayments = can("payments.view");
  const canReplayPayments = can("payments.refund");
  const canViewNotifications = can("notifications.view");
  const canReplayNotifications = can("notifications.send");
  const canRunJobs = can("settings.manage");
  const canAccess =
    canViewPayments || canViewNotifications || canRunJobs;

  const [paymentItems, setPaymentItems] = useState<PaymentDeadLetter[]>([]);
  const [notificationItems, setNotificationItems] = useState<
    NotificationDeadLetter[]
  >([]);
  const [paymentsLoading, setPaymentsLoading] = useState(canViewPayments);
  const [notificationsLoading, setNotificationsLoading] = useState(
    canViewNotifications,
  );
  const [reloadKey, setReloadKey] = useState(0);

  const [selectedJobs, setSelectedJobs] = useState<AdminJobName[]>(["all"]);
  const [runConfirmOpen, setRunConfirmOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [lastResults, setLastResults] = useState<
    Array<[string, JobRunOutcome]>
  >([]);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const [notificationsError, setNotificationsError] = useState<string | null>(
    null,
  );

  const [replayTarget, setReplayTarget] = useState<
    | { kind: "payment"; id: string }
    | { kind: "notification"; id: string }
    | null
  >(null);
  const [replaying, setReplaying] = useState(false);

  useEffect(() => {
    if (!canViewPayments) return;
    const controller = new AbortController();
    void fetchPaymentDeadLetters(controller.signal)
      .then((items) => {
        if (controller.signal.aborted) return;
        setPaymentItems(items);
        setPaymentsError(null);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        // Show the failure in the table, not as an "empty queue".
        setPaymentItems([]);
        setPaymentsError(
          isApiClientError(cause)
            ? cause.message
            : "بارگذاری صف خطای پرداخت ناموفق بود.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setPaymentsLoading(false);
      });
    return () => controller.abort();
  }, [canViewPayments, reloadKey]);

  useEffect(() => {
    if (!canViewNotifications) return;
    const controller = new AbortController();
    void fetchNotificationDeadLetters(controller.signal)
      .then((items) => {
        if (controller.signal.aborted) return;
        setNotificationItems(items);
        setNotificationsError(null);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setNotificationItems([]);
        setNotificationsError(
          isApiClientError(cause)
            ? cause.message
            : "بارگذاری صف خطای اعلان ناموفق بود.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setNotificationsLoading(false);
      });
    return () => controller.abort();
  }, [canViewNotifications, reloadKey]);

  const paymentColumns: AdminDataTableColumn<PaymentDeadLetter>[] = [
    {
      id: "id",
      header: "شناسه",
      cell: (row) => <span className="font-mono text-xs">{row.id}</span>,
    },
    {
      id: "enqueuedAt",
      header: "زمان",
      cell: (row) => formatAdminDateTime(row.enqueuedAt),
    },
    {
      id: "attempts",
      header: "تلاش",
      cell: (row) => toPersianDigits(row.attempts),
    },
    {
      id: "lastError",
      header: "خطا",
      cell: (row) => (
        <span className="line-clamp-2 text-xs text-destructive">
          {row.lastError ?? "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      stickyActions: true,
      cell: (row) =>
        canReplayPayments ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-lg"
            onClick={() => setReplayTarget({ kind: "payment", id: row.id })}
          >
            ارسال دوباره
          </Button>
        ) : null,
    },
  ];

  const notificationColumns: AdminDataTableColumn<NotificationDeadLetter>[] = [
    {
      id: "deliveryId",
      header: "Delivery",
      cell: (row) => (
        <span className="font-mono text-xs">{row.deliveryId}</span>
      ),
    },
    {
      id: "title",
      header: "اعلان",
      cell: (row) => (
        <div>
          <p className="text-sm">{row.title}</p>
          <p className="font-mono text-[11px] text-muted-foreground">
            {row.notificationId}
          </p>
        </div>
      ),
    },
    {
      id: "channel",
      header: "کانال",
      cell: (row) => (
        <span className="font-mono text-xs">{row.channel}</span>
      ),
    },
    {
      id: "attempts",
      header: "تلاش",
      cell: (row) => toPersianDigits(row.attemptsCount),
    },
    {
      id: "error",
      header: "خطا",
      cell: (row) => (
        <span className="line-clamp-2 text-xs text-destructive">
          {row.errorMessage ?? "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      stickyActions: true,
      cell: (row) =>
        canReplayNotifications ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-lg"
            onClick={() =>
              setReplayTarget({ kind: "notification", id: row.deliveryId })
            }
          >
            ارسال دوباره
          </Button>
        ) : null,
    },
  ];

  function toggleJob(name: AdminJobName, checked: boolean) {
    if (name === "all") {
      setSelectedJobs(checked ? ["all"] : []);
      return;
    }
    setSelectedJobs((prev) => {
      const withoutAll = prev.filter((item) => item !== "all");
      if (checked) return [...withoutAll, name];
      return withoutAll.filter((item) => item !== name);
    });
  }

  async function onRunJobs() {
    if (selectedJobs.length === 0) {
      toast.error("حداقل یک job انتخاب کنید.");
      return;
    }
    setRunning(true);
    try {
      const result = await runAdminJobs(selectedJobs);
      setLastRun(result.ranAt);
      const outcomes = Object.entries(result.jobs);
      setLastResults(outcomes);
      const failed = outcomes.filter(([, outcome]) => !outcome.ok);
      const skipped = outcomes.filter(([, outcome]) => outcome.ok && outcome.skipped);
      if (failed.length > 0) {
        toast.error(
          `${failed.length.toLocaleString("fa-IR")} کار با خطا مواجه شد. جزئیات را در نتیجه اجرا ببینید.`,
        );
      } else if (skipped.length > 0) {
        toast.warning(
          `اجرا تمام شد؛ ${skipped.length.toLocaleString("fa-IR")} کار رد شد (در حال اجرا توسط سرویس دیگر).`,
        );
      } else {
        toast.success("همه کارها با موفقیت اجرا شدند.");
      }
      setRunConfirmOpen(false);
      setPaymentsLoading(canViewPayments);
      setNotificationsLoading(canViewNotifications);
      setReloadKey((value) => value + 1);
    } catch (cause: unknown) {
      toast.error(
        isApiClientError(cause) ? cause.message : "اجرای job ناموفق بود.",
      );
    } finally {
      setRunning(false);
    }
  }

  async function onReplay() {
    if (!replayTarget) return;
    setReplaying(true);
    try {
      if (replayTarget.kind === "payment") {
        await replayPaymentDeadLetter(replayTarget.id);
      } else {
        await replayNotificationDeadLetter(replayTarget.id);
      }
      toast.success("Replay انجام شد.");
      setReplayTarget(null);
      setPaymentsLoading(canViewPayments);
      setNotificationsLoading(canViewNotifications);
      setReloadKey((value) => value + 1);
    } catch (cause: unknown) {
      toast.error(
        isApiClientError(cause) ? cause.message : "Replay ناموفق بود.",
      );
    } finally {
      setReplaying(false);
    }
  }

  if (!canAccess) return <AdminForbidden />;

  return (
    <div className="space-y-4 animate-fade-in">
      <AdminPageHeader
        title="کارهای زمان‌بندی‌شده"
        description="پایش صف‌های خطا و اجرای کنترل‌شده کارهای پس‌زمینه."
        actions={
          <Button
            type="button"
            variant="outline"
            className="rounded-lg"
            onClick={() => {
              setPaymentsLoading(canViewPayments);
              setNotificationsLoading(canViewNotifications);
              setReloadKey((value) => value + 1);
            }}
          >
            <RefreshCw className="size-4" />
            بروزرسانی
          </Button>
        }
      />

      {canRunJobs ? (
        <AdminSectionCard>
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">اجرای Job</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                اجرای دستی کارهای پس‌زمینه؛ پیش از اجرا تأیید گرفته می‌شود.
              </p>
              {lastRun ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  آخرین اجرا: {formatAdminDateTime(lastRun)}
                </p>
              ) : null}
            </div>
            <Button
              type="button"
              className="rounded-lg"
              disabled={selectedJobs.length === 0}
              onClick={() => setRunConfirmOpen(true)}
            >
              <PlayCircle className="size-4" />
              اجرای Job
            </Button>
          </div>

          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={selectedJobs.includes("all")}
                onCheckedChange={(checked) =>
                  toggleJob("all", checked === true)
                }
              />
              {ADMIN_JOB_LABELS.all}
            </label>
            {RUNNABLE_JOBS.map((name) => (
              <label key={name} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={
                    selectedJobs.includes("all") || selectedJobs.includes(name)
                  }
                  disabled={selectedJobs.includes("all")}
                  onCheckedChange={(checked) =>
                    toggleJob(name, checked === true)
                  }
                />
                <span>{ADMIN_JOB_LABELS[name]}</span>
              </label>
            ))}
          </div>

          {lastResults.length > 0 ? (
            <ul className="mt-4 divide-y divide-[var(--admin-border)] rounded-lg border border-[var(--admin-border)]">
              {lastResults.map(([name, outcome]) => (
                <li key={name} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
                  <AdminStatusBadge
                    status={!outcome.ok ? "failed" : outcome.skipped ? "skipped" : "succeeded"}
                    label={!outcome.ok ? "خطا" : outcome.skipped ? "ردشده" : "موفق"}
                  />
                  <span className="font-medium">
                    {ADMIN_JOB_LABELS[name as AdminJobName] ?? name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {(outcome.durationMs / 1000).toLocaleString("fa-IR", {
                      maximumFractionDigits: 1,
                    })}{" "}
                    ثانیه
                  </span>
                  {outcome.error ? (
                    <span className="w-full font-mono text-xs text-destructive" dir="ltr">
                      {outcome.error}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </AdminSectionCard>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {canViewPayments ? (
          <AdminSectionCard>
            <div className="mb-3 flex items-center gap-2">
              <CreditCard className="size-4 text-primary" />
              <h3 className="text-sm font-semibold">صف خطای پرداخت</h3>
            </div>
            <AdminDataTable
              columns={paymentColumns}
              emptyTitle="صف پرداخت خالی است."
              error={paymentsError ? { message: paymentsError } : null}
              onRetry={() => {
                setPaymentsLoading(true);
                setReloadKey((value) => value + 1);
              }}
              getRowId={(row) => row.id}
              loading={paymentsLoading}
              rows={paymentItems}
              skeletonRows={4}
            />
          </AdminSectionCard>
        ) : null}

        {canViewNotifications ? (
          <AdminSectionCard>
            <div className="mb-3 flex items-center gap-2">
              <Bell className="size-4 text-primary" />
              <h3 className="text-sm font-semibold">صف خطای اعلان</h3>
            </div>
            <AdminDataTable
              columns={notificationColumns}
              emptyTitle="صف اعلان خالی است."
              error={notificationsError ? { message: notificationsError } : null}
              onRetry={() => {
                setNotificationsLoading(true);
                setReloadKey((value) => value + 1);
              }}
              getRowId={(row) => row.deliveryId}
              loading={notificationsLoading}
              rows={notificationItems}
              skeletonRows={4}
            />
          </AdminSectionCard>
        ) : null}
      </div>

      <AdminConfirmDialog
        open={runConfirmOpen}
        onOpenChange={setRunConfirmOpen}
        title="تأیید اجرای کارها"
        description={`این کارها اجرا می‌شوند: ${selectedJobs.map((name) => ADMIN_JOB_LABELS[name]).join("، ")}`}
        confirmLabel="اجرا"
        loading={running}
        onConfirm={() => void onRunJobs()}
      />

      <AdminConfirmDialog
        open={Boolean(replayTarget)}
        onOpenChange={(open) => {
          if (!open) setReplayTarget(null);
        }}
        title="تأیید ارسال دوباره"
        description={
          replayTarget
            ? `Replay برای ${replayTarget.kind} · ${replayTarget.id}`
            : undefined
        }
        confirmLabel="Replay"
        loading={replaying}
        onConfirm={() => void onReplay()}
      />
    </div>
  );
}
