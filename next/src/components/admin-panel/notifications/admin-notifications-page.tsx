"use client";

import { useEffect, useMemo, useState } from "react";
import { Filter, Send } from "lucide-react";
import { toast } from "sonner";

import {
  AdminConfirmDialog,
  AdminCursorPagination,
  AdminDataTable,
  AdminFilterChips,
  AdminFilterDrawer,
  AdminForbidden,
  AdminPageHeader,
  AdminStatusBadge,
  type AdminDataTableColumn,
} from "@/components/admin-panel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAdminPermissions } from "@/hooks/admin/use-admin-permissions";
import { useAdminUrlListState } from "@/hooks/admin/use-admin-url-list-state";
import { formatAdminDateTime } from "@/lib/admin/format";
import type { AdminCursorMeta, AdminFilterChip } from "@/lib/admin/search-params";
import {
  ADMIN_NOTIFICATION_TYPES,
  NOTIFICATION_CHANNELS,
  fetchAdminNotifications,
  sendAdminNotification,
  type AdminNotification,
  type AdminNotificationChannel,
  type AdminNotificationType,
} from "@/lib/api/admin-notifications";
import { isApiClientError } from "@/lib/api/envelope";

function isNotificationType(value: string | null): value is AdminNotificationType {
  return ADMIN_NOTIFICATION_TYPES.includes(value as AdminNotificationType);
}

function parseIdList(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(/[\s,]+/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

export function AdminNotificationsPage() {
  const { can } = useAdminPermissions();
  const canView = can("notifications.view");
  const canSend = can("notifications.send");
  const list = useAdminUrlListState();

  const typeParam = list.get("type");
  const type = isNotificationType(typeParam) ? typeParam : null;
  const recipientTypeParam = list.get("recipientType");
  const recipientType =
    recipientTypeParam === "user" || recipientTypeParam === "admin"
      ? recipientTypeParam
      : null;

  const [filterOpen, setFilterOpen] = useState(false);
  const [typeDraft, setTypeDraft] = useState(type ?? "all");
  const [recipientDraft, setRecipientDraft] = useState(recipientType ?? "all");

  const [items, setItems] = useState<AdminNotification[]>([]);
  const [meta, setMeta] = useState<AdminCursorMeta>({
    hasMore: false,
    limit: list.limit,
    nextCursor: null,
  });
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState<{
    message: string;
    requestId?: string;
  } | null>(null);

  const [sendOpen, setSendOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [userIdsRaw, setUserIdsRaw] = useState("");
  const [adminIdsRaw, setAdminIdsRaw] = useState("");
  const [channels, setChannels] = useState<AdminNotificationChannel[]>([
    "in_app",
  ]);

  useEffect(() => {
    if (!canView) return;
    const controller = new AbortController();

    void fetchAdminNotifications({
      cursor: list.cursor,
      limit: list.limit,
      recipientType: recipientType ?? undefined,
      signal: controller.signal,
      type: type ?? undefined,
    })
      .then((result) => {
        if (controller.signal.aborted) return;
        setItems(result.items);
        setMeta(result.meta);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError({
          message: isApiClientError(cause)
            ? cause.message
            : "بارگذاری اعلان‌ها ناموفق بود.",
          requestId: isApiClientError(cause) ? cause.requestId : undefined,
        });
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [canView, list.cursor, list.limit, recipientType, reloadKey, type]);

  const chips: AdminFilterChip[] = useMemo(() => {
    const next: AdminFilterChip[] = [];
    if (type) next.push({ id: "type", keys: ["type"], label: `نوع: ${type}` });
    if (recipientType)
      next.push({
        id: "recipientType",
        keys: ["recipientType"],
        label: `گیرنده: ${recipientType}`,
      });
    return next;
  }, [recipientType, type]);

  const columns: AdminDataTableColumn<AdminNotification>[] = useMemo(
    () => [
      {
        id: "createdAt",
        header: "زمان",
        cell: (row) => formatAdminDateTime(row.createdAt),
      },
      {
        id: "title",
        header: "عنوان",
        cell: (row) => (
          <div>
            <p className="font-medium">{row.title}</p>
            <p className="line-clamp-1 text-xs text-muted-foreground">{row.body}</p>
          </div>
        ),
      },
      {
        id: "type",
        header: "نوع",
        cell: (row) => (
          <span className="font-mono text-xs">{row.type}</span>
        ),
      },
      {
        id: "recipient",
        header: "گیرنده",
        cell: (row) => (
          <div className="space-y-1">
            <AdminStatusBadge status={row.recipient.type} />
            <p className="font-mono text-[11px] text-muted-foreground">
              {row.recipient.userId ?? row.recipient.adminId ?? "—"}
            </p>
          </div>
        ),
      },
      {
        id: "deliveries",
        header: "ارسال",
        cell: (row) => (
          <div className="space-y-1">
            {row.deliveries.map((delivery, index) => (
              <div key={`${delivery.channel}-${index}`} className="text-xs">
                <span className="font-mono">{delivery.channel}</span>
                {" · "}
                <AdminStatusBadge status={delivery.status} />
              </div>
            ))}
          </div>
        ),
      },
    ],
    [],
  );

  function toggleChannel(channel: AdminNotificationChannel, checked: boolean) {
    setChannels((prev) => {
      if (checked) return [...new Set([...prev, channel])];
      return prev.filter((item) => item !== channel);
    });
  }

  async function onConfirmSend() {
    const userIds = parseIdList(userIdsRaw);
    const adminIds = parseIdList(adminIdsRaw);
    if (userIds.length + adminIds.length === 0) {
      toast.error("حداقل یک گیرنده لازم است.");
      return;
    }
    if (channels.length === 0) {
      toast.error("حداقل یک کانال انتخاب کنید.");
      return;
    }

    setSending(true);
    try {
      const result = await sendAdminNotification({
        adminIds: adminIds.length ? adminIds : undefined,
        body: body.trim(),
        channels,
        title: title.trim(),
        userIds: userIds.length ? userIds : undefined,
      });
      toast.success(`${result.createdCount} اعلان ایجاد شد.`);
      setConfirmOpen(false);
      setSendOpen(false);
      setTitle("");
      setBody("");
      setUserIdsRaw("");
      setAdminIdsRaw("");
      setChannels(["in_app"]);
      setLoading(true);
      setReloadKey((value) => value + 1);
    } catch (cause: unknown) {
      toast.error(
        isApiClientError(cause) ? cause.message : "ارسال اعلان ناموفق بود.",
      );
    } finally {
      setSending(false);
    }
  }

  if (!canView) return <AdminForbidden />;

  return (
    <div className="space-y-4 animate-fade-in">
      <AdminPageHeader
        title="اعلان‌های مدیریتی"
        description="ارسال اعلان و مشاهده لیست با صفحه‌بندی cursor."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              onClick={() => {
                setTypeDraft(type ?? "all");
                setRecipientDraft(recipientType ?? "all");
                setFilterOpen(true);
              }}
            >
              <Filter className="size-4" />
              فیلتر
            </Button>
            {canSend ? (
              <Button
                type="button"
                className="rounded-lg"
                onClick={() => setSendOpen(true)}
              >
                <Send className="size-4" />
                ارسال اعلان
              </Button>
            ) : null}
          </div>
        }
      />

      <AdminFilterChips
        chips={chips}
        onClearAll={() => {
          setLoading(true);
          list.setFilters({ recipientType: null, type: null });
        }}
        onRemove={(chip) => {
          setLoading(true);
          const updates: Record<string, null> = {};
          for (const key of chip.keys ?? []) updates[key] = null;
          list.setFilters(updates);
        }}
      />

      <AdminDataTable
        columns={columns}
        error={error}
        getRowId={(row) => row.notificationId}
        loading={loading}
        onRetry={() => setReloadKey((value) => value + 1)}
        rows={items}
      />

      <AdminCursorPagination
        canGoPrevious={Boolean(list.cursor) || list.cursorStack.length > 0}
        meta={meta}
        onLimitChange={(limit) => {
          setLoading(true);
          list.setLimit(limit);
        }}
        onNext={() => {
          if (!meta.nextCursor) return;
          setLoading(true);
          list.goNext(meta.nextCursor);
        }}
        onPrevious={() => {
          setLoading(true);
          list.goPrevious();
        }}
        pageItemCount={items.length}
      />

      <AdminFilterDrawer
        open={filterOpen}
        onOpenChange={setFilterOpen}
        onApply={() => {
          setLoading(true);
          list.setFilters({
            recipientType: recipientDraft === "all" ? null : recipientDraft,
            type: typeDraft === "all" ? null : typeDraft,
          });
          setFilterOpen(false);
        }}
        onReset={() => {
          setTypeDraft("all");
          setRecipientDraft("all");
        }}
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>نوع</Label>
            <Select value={typeDraft} onValueChange={setTypeDraft}>
              <SelectTrigger className="rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                {ADMIN_NOTIFICATION_TYPES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>نوع گیرنده</Label>
            <Select value={recipientDraft} onValueChange={setRecipientDraft}>
              <SelectTrigger className="rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                <SelectItem value="user">user</SelectItem>
                <SelectItem value="admin">admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </AdminFilterDrawer>

      {sendOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-lg space-y-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4 shadow-lg">
            <h2 className="text-base font-semibold">ارسال اعلان مدیریتی</h2>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>عنوان</Label>
                <Input
                  className="rounded-lg"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>متن</Label>
                <Textarea
                  className="min-h-24 rounded-lg"
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>شناسه کاربران (public، جدا با ویرگول)</Label>
                <Textarea
                  className="rounded-lg font-mono text-xs"
                  value={userIdsRaw}
                  onChange={(event) => setUserIdsRaw(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>شناسه ادمین‌ها (public، جدا با ویرگول)</Label>
                <Textarea
                  className="rounded-lg font-mono text-xs"
                  value={adminIdsRaw}
                  onChange={(event) => setAdminIdsRaw(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>کانال‌ها</Label>
                <div className="flex flex-wrap gap-3">
                  {NOTIFICATION_CHANNELS.map((channel) => (
                    <label
                      key={channel}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Checkbox
                        checked={channels.includes(channel)}
                        onCheckedChange={(checked) =>
                          toggleChannel(channel, checked === true)
                        }
                      />
                      {channel}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-lg"
                onClick={() => setSendOpen(false)}
                disabled={sending}
              >
                انصراف
              </Button>
              <Button
                type="button"
                className="rounded-lg"
                disabled={sending || !title.trim() || !body.trim()}
                onClick={() => setConfirmOpen(true)}
              >
                ادامه
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <AdminConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="تأیید ارسال اعلان"
        description="اعلان برای گیرنده‌های مشخص‌شده ایجاد می‌شود. تا پاسخ API صبر کنید."
        confirmLabel="ارسال"
        loading={sending}
        onConfirm={() => void onConfirmSend()}
      />
    </div>
  );
}
