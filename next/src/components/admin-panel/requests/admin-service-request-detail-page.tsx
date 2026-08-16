"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Copy, UserMinus } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminPermissions } from "@/hooks/admin/use-admin-permissions";
import { copyPublicId, formatAdminDateTime } from "@/lib/admin/format";
import {
  cancelAdminServiceRequest,
  fetchAdminServiceRequest,
  fetchAdminServiceRequestHistories,
  removeAdminProviderLink,
  type AdminRequestDetail,
  type AdminRequestHistories,
  type AdminRequestProviderLink,
} from "@/lib/api/admin-requests";
import { isApiClientError } from "@/lib/api/envelope";
import { formatPrice, toPersianDigits } from "@/lib/utils/format";

interface AdminServiceRequestDetailPageProps {
  requestId: string;
}

export function AdminServiceRequestDetailPage({
  requestId,
}: AdminServiceRequestDetailPageProps) {
  const { can } = useAdminPermissions();
  const canView = can("requests.view");
  const canCancel = can("requests.cancel");
  const canManage = can("requests.manage");

  const [detail, setDetail] = useState<AdminRequestDetail | null>(null);
  const [histories, setHistories] = useState<AdminRequestHistories | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [removingLink, setRemovingLink] =
    useState<AdminRequestProviderLink | null>(null);

  useEffect(() => {
    if (!canView) return;
    const controller = new AbortController();

    void Promise.all([
      fetchAdminServiceRequest(requestId, controller.signal),
      fetchAdminServiceRequestHistories(requestId, controller.signal),
    ])
      .then(([request, history]) => {
        if (controller.signal.aborted) return;
        setDetail(request);
        setHistories(history);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          isApiClientError(cause)
            ? cause.message
            : "بارگذاری درخواست ناموفق بود.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [canView, reloadKey, requestId]);

  if (!canView) return <AdminForbidden />;

  if (loading && !detail) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <AdminSectionCard className="text-center text-sm text-destructive">
        {error ?? "درخواست یافت نشد."}
      </AdminSectionCard>
    );
  }

  const canCancelRequest =
    canCancel &&
    detail.status !== "cancelled" &&
    detail.status !== "completed";

  const providerColumns: AdminDataTableColumn<AdminRequestProviderLink>[] = [
    {
      id: "name",
      header: "Provider",
      cell: (row) => (
        <div>
          <Button asChild variant="link" className="h-auto p-0 font-medium">
            <Link href={`/admins/providers/${row.providerId}`}>{row.name}</Link>
          </Button>
          {row.phone ? (
            <p className="font-mono text-[11px] text-muted-foreground" dir="ltr">
              {row.phone}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      id: "status",
      header: "وضعیت لینک",
      cell: (row) => <AdminStatusBadge status={row.status} />,
    },
    {
      id: "price",
      header: "قیمت",
      cell: (row) => (
        <span className="text-xs">{formatPrice(row.priceToman)}</span>
      ),
    },
    {
      id: "distance",
      header: "فاصله",
      cell: (row) => (
        <span className="text-xs">{toPersianDigits(row.distanceKm)} km</span>
      ),
    },
    {
      id: "sentAt",
      header: "ارسال",
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {formatAdminDateTime(row.sentAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "عملیات",
      stickyActions: true,
      cell: (row) =>
        canManage && row.status === "sent" ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8"
            onClick={() => setRemovingLink(row)}
          >
            <UserMinus className="size-3.5" />
            حذف لینک
          </Button>
        ) : row.rejectionReason || row.removedReason ? (
          <span className="max-w-40 truncate text-xs text-muted-foreground">
            {row.rejectionReason ?? row.removedReason}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <AdminPageHeader
        title={detail.serviceName}
        description="جزئیات درخواست، snapshotهای immutable، لینک Providerها و تاریخچه append-only."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/admins/service-requests">بازگشت به فهرست</Link>
            </Button>
            {canCancelRequest ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setCancelOpen(true)}
              >
                لغو مدیریتی
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <AdminStatusBadge status={detail.status} />
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 gap-1 px-2 font-mono text-xs"
          dir="ltr"
          onClick={() => void copyPublicId(detail.requestId, "شناسه درخواست")}
        >
          <Copy className="size-3.5" />
          {detail.requestId}
        </Button>
        <span className="text-xs text-muted-foreground">
          نسخه {toPersianDigits(detail.version)}
        </span>
      </div>

      <Tabs defaultValue="summary" className="gap-4">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="summary">خلاصه</TabsTrigger>
          <TabsTrigger value="providers">
            Providerها ({toPersianDigits(detail.providers.length)})
          </TabsTrigger>
          <TabsTrigger value="history">تاریخچه</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <AdminSectionCard>
              <h2 className="mb-3 text-sm font-semibold">خدمت و مصرف‌کننده</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">دسته</dt>
                  <dd>{detail.serviceCategoryName}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">خدمت</dt>
                  <dd>{detail.serviceName}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">مصرف‌کننده</dt>
                  <dd>
                    <Link
                      href={`/admins/users/${detail.consumer.userId}`}
                      className="text-primary hover:underline"
                    >
                      {detail.consumer.name}
                    </Link>
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">یادداشت</dt>
                  <dd className="max-w-xs text-left">
                    {detail.consumerNote ?? "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">مبلغ توافقی</dt>
                  <dd>
                    {detail.agreedPriceToman != null
                      ? formatPrice(detail.agreedPriceToman)
                      : "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Provider پذیرفته‌شده</dt>
                  <dd>
                    {detail.assignedProviderId ? (
                      <Link
                        href={`/admins/providers/${detail.assignedProviderId}`}
                        className="text-primary hover:underline"
                      >
                        {detail.assignedProviderName ?? detail.assignedProviderId}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
              </dl>
            </AdminSectionCard>

            <AdminSectionCard>
              <h2 className="mb-3 text-sm font-semibold">
                snapshot زمین (فقط‌خواندنی)
              </h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">عنوان</dt>
                  <dd>{detail.land.title}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">مساحت</dt>
                  <dd dir="ltr">{detail.land.areaSquareMeters} m²</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">مختصات</dt>
                  <dd className="font-mono text-xs" dir="ltr">
                    {detail.land.latitude}, {detail.land.longitude}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">تاریخ‌های درخواستی</dt>
                  <dd className="max-w-xs text-left text-xs">
                    {detail.dates.length > 0
                      ? detail.dates.map((date) => formatAdminDateTime(date)).join(" · ")
                      : "—"}
                  </dd>
                </div>
              </dl>
            </AdminSectionCard>

            <AdminSectionCard className="xl:col-span-2">
              <h2 className="mb-3 text-sm font-semibold">زمان‌بندی وضعیت</h2>
              <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <p>
                  <span className="text-muted-foreground">ایجاد: </span>
                  {formatAdminDateTime(detail.createdAt)}
                </p>
                <p>
                  <span className="text-muted-foreground">پذیرش: </span>
                  {formatAdminDateTime(detail.acceptedAt)}
                </p>
                <p>
                  <span className="text-muted-foreground">اتمام: </span>
                  {formatAdminDateTime(detail.completedAt)}
                </p>
                <p>
                  <span className="text-muted-foreground">لغو: </span>
                  {formatAdminDateTime(detail.cancelledAt)}
                </p>
              </div>
              {detail.cancelReason ? (
                <p className="mt-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-canvas)]/50 px-3 py-2 text-sm">
                  دلیل لغو ({detail.cancelledBy ?? "—"}): {detail.cancelReason}
                </p>
              ) : null}
            </AdminSectionCard>
          </div>
        </TabsContent>

        <TabsContent value="providers">
          <AdminDataTable
            columns={providerColumns}
            rows={detail.providers}
            getRowId={(row) => row.linkId}
            emptyTitle="لینک Providerی نیست"
            emptyDescription="هنوز Providerی به این درخواست وصل نشده است."
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <AdminSectionCard>
            <h2 className="mb-3 text-sm font-semibold">تاریخچه وضعیت درخواست</h2>
            {!histories || histories.statusHistories.length === 0 ? (
              <p className="text-sm text-muted-foreground">موردی ثبت نشده.</p>
            ) : (
              <ul className="space-y-3">
                {histories.statusHistories.map((item) => (
                  <li
                    key={item.historyId}
                    className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-canvas)]/50 px-3 py-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {item.fromStatus ? (
                        <AdminStatusBadge status={item.fromStatus} />
                      ) : null}
                      <span className="text-xs text-muted-foreground">→</span>
                      <AdminStatusBadge status={item.toStatus} />
                      <span className="text-xs text-muted-foreground">
                        {formatAdminDateTime(item.createdAt)}
                      </span>
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px]">
                        {item.actorType}
                      </span>
                    </div>
                    {item.reason ? (
                      <p className="mt-2 text-sm">{item.reason}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </AdminSectionCard>

          <AdminSectionCard>
            <h2 className="mb-3 text-sm font-semibold">تاریخچه لینک Provider</h2>
            {!histories || histories.providerLinkHistories.length === 0 ? (
              <p className="text-sm text-muted-foreground">موردی ثبت نشده.</p>
            ) : (
              <ul className="space-y-3">
                {histories.providerLinkHistories.map((item) => (
                  <li
                    key={item.historyId}
                    className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-canvas)]/50 px-3 py-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {item.fromStatus ? (
                        <AdminStatusBadge status={item.fromStatus} />
                      ) : null}
                      <span className="text-xs text-muted-foreground">→</span>
                      <AdminStatusBadge status={item.toStatus} />
                      <span className="text-xs text-muted-foreground">
                        {formatAdminDateTime(item.createdAt)}
                      </span>
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px]">
                        {item.actorType}
                      </span>
                    </div>
                    {item.reason ? (
                      <p className="mt-2 text-sm">{item.reason}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </AdminSectionCard>
        </TabsContent>
      </Tabs>

      <AdminConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="لغو مدیریتی درخواست"
        description="این اقدام تاریخچه را append می‌کند و وضعیت را به لغوشده تغییر می‌دهد. قابل ویرایش دستی نیست."
        destructive
        requireReason
        confirmLabel="لغو درخواست"
        onConfirm={async (reason) => {
          try {
            await cancelAdminServiceRequest(requestId, {
              expectedVersion: detail.version,
              reason: reason ?? "",
            });
            toast.success("درخواست لغو شد");
            setCancelOpen(false);
            setLoading(true);
            setReloadKey((value) => value + 1);
          } catch (cause) {
            toast.error(
              isApiClientError(cause)
                ? cause.message
                : "لغو درخواست ناموفق بود.",
            );
          }
        }}
      />

      <AdminConfirmDialog
        open={Boolean(removingLink)}
        onOpenChange={(open) => {
          if (!open) setRemovingLink(null);
        }}
        title="حذف لینک Provider"
        description={
          removingLink
            ? `لینک «${removingLink.name}» فقط اگر وضعیت sent باشد حذف می‌شود.`
            : undefined
        }
        destructive
        requireReason
        confirmLabel="حذف لینک"
        onConfirm={async (reason) => {
          if (!removingLink) return;
          try {
            await removeAdminProviderLink(removingLink.linkId, {
              reason: reason?.trim() || undefined,
            });
            toast.success("لینک Provider حذف شد");
            setRemovingLink(null);
            setLoading(true);
            setReloadKey((value) => value + 1);
          } catch (cause) {
            toast.error(
              isApiClientError(cause)
                ? cause.message
                : "حذف لینک ناموفق بود.",
            );
          }
        }}
      />
    </div>
  );
}
