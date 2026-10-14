"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

import {
  AdminDataTable,
  AdminForbidden,
  AdminPageHeader,
  AdminSectionCard,
  type AdminDataTableColumn,
} from "@/components/admin-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { useAdminPermissions } from "@/hooks/admin/use-admin-permissions";
import { formatAdminDateTime } from "@/lib/admin/format";
import {
  SETTING_VALUE_TYPES,
  fetchAdminSettings,
  upsertAdminSetting,
  type AdminSetting,
  type AdminSettingValueType,
} from "@/lib/api/admin-settings";
import { isApiClientError } from "@/lib/api/envelope";

function formatSettingValue(setting: AdminSetting): string {
  if (setting.valueType === "json") {
    try {
      return JSON.stringify(setting.settingValue);
    } catch {
      return String(setting.settingValue);
    }
  }
  if (setting.valueType === "boolean") {
    return setting.settingValue === true ? "true" : "false";
  }
  return String(setting.settingValue ?? "");
}

function parseDraftValue(
  valueType: AdminSettingValueType,
  raw: string,
): unknown {
  switch (valueType) {
    case "string":
      return raw;
    case "integer": {
      const n = Number(raw);
      if (!Number.isInteger(n) || !Number.isSafeInteger(n)) {
        throw new Error("مقدار باید عدد صحیح معتبر باشد.");
      }
      return n;
    }
    case "boolean":
      if (raw === "true") return true;
      if (raw === "false") return false;
      throw new Error("مقدار boolean باید true یا false باشد.");
    case "json":
      return JSON.parse(raw) as unknown;
    default:
      return raw;
  }
}

export function AdminSettingsPage() {
  const { can } = useAdminPermissions();
  const canView = can("settings.view");
  const canManage = can("settings.manage");

  const [items, setItems] = useState<AdminSetting[]>([]);
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<AdminSetting | null>(null);
  const [draftValue, setDraftValue] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftIsPublic, setDraftIsPublic] = useState(false);
  const [draftType, setDraftType] = useState<AdminSettingValueType>("string");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!canView) return;
    const controller = new AbortController();

    void fetchAdminSettings({ signal: controller.signal })
      .then((settings) => {
        if (controller.signal.aborted) return;
        setItems(settings);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        const message = isApiClientError(cause)
          ? cause.message
          : "بارگذاری تنظیمات ناموفق بود.";
        setError(message);
        toast.error(message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [canView, reloadKey]);

  const groups = useMemo(() => {
    const set = new Set(items.map((item) => item.group));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filtered = useMemo(() => {
    if (groupFilter === "all") return items;
    return items.filter((item) => item.group === groupFilter);
  }, [groupFilter, items]);

  const columns: AdminDataTableColumn<AdminSetting>[] = useMemo(
    () => [
      {
        id: "key",
        header: "کلید",
        cell: (row) => (
          <div>
            <p className="font-mono text-sm">{row.key}</p>
            <p className="text-xs text-muted-foreground">{row.group}</p>
          </div>
        ),
      },
      {
        id: "value",
        header: "مقدار",
        cell: (row) => (
          <code className="block max-w-xs truncate rounded bg-muted/60 px-2 py-1 text-xs">
            {formatSettingValue(row)}
          </code>
        ),
      },
      {
        id: "type",
        header: "نوع",
        cell: (row) => (
          <span className="font-mono text-xs">{row.valueType}</span>
        ),
      },
      {
        id: "visibility",
        header: "قابلیت دسترسی",
        cell: (row) =>
          row.isPublic ? (
            <Badge variant="success" className="rounded-md">
              عمومی
            </Badge>
          ) : (
            <Badge variant="secondary" className="rounded-md">
              داخلی
            </Badge>
          ),
      },
      {
        id: "updatedAt",
        header: "به‌روزرسانی",
        cell: (row) => formatAdminDateTime(row.updatedAt),
      },
      {
        id: "actions",
        header: "",
        cell: (row) =>
          canManage ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-lg"
              onClick={() => {
                setEditing(row);
                setDraftValue(formatSettingValue(row));
                setDraftDescription(row.description ?? "");
                setDraftIsPublic(row.isPublic);
                setDraftType(row.valueType);
              }}
            >
              <Pencil className="size-3.5" />
              ویرایش
            </Button>
          ) : null,
      },
    ],
    [canManage],
  );

  async function onSave() {
    if (!editing) return;
    setSaving(true);
    try {
      const settingValue = parseDraftValue(draftType, draftValue);
      await upsertAdminSetting({
        description: draftDescription.trim() || null,
        group: editing.group,
        isPublic: draftIsPublic ? 1 : 0,
        key: editing.key,
        settingValue,
        valueType: draftType,
      });
      toast.success("تنظیمات ذخیره شد.");
      setEditing(null);
      setLoading(true);
      setReloadKey((value) => value + 1);
    } catch (cause: unknown) {
      const message =
        cause instanceof Error && !(isApiClientError(cause))
          ? cause.message
          : isApiClientError(cause)
            ? cause.message
            : "ذخیره تنظیمات ناموفق بود.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  if (!canView) {
    return <AdminForbidden />;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <AdminPageHeader
        title="تنظیمات سیستم"
        description="مشاهده و ویرایش تنظیمات گروه‌بندی‌شده. تنظیمات عمومی و داخلی از هم متمایزند."
      />

      <AdminSectionCard>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Label className="text-xs text-muted-foreground">گروه</Label>
          <Select value={groupFilter} onValueChange={setGroupFilter}>
            <SelectTrigger className="w-48 rounded-lg">
              <SelectValue placeholder="همه گروه‌ها" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه گروه‌ها</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group} value={group}>
                  {group}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}

        <AdminDataTable
          columns={columns}
          emptyTitle="تنظیمی یافت نشد."
          getRowId={(row) => `${row.group}.${row.key}`}
          loading={loading}
          rows={filtered}
        />
      </AdminSectionCard>

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              ویرایش {editing ? `${editing.group}.${editing.key}` : ""}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>نوع مقدار</Label>
              <Select
                value={draftType}
                onValueChange={(value) =>
                  setDraftType(value as AdminSettingValueType)
                }
              >
                <SelectTrigger className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SETTING_VALUE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>مقدار</Label>
              {draftType === "json" || draftType === "string" ? (
                <Textarea
                  className="min-h-28 rounded-lg font-mono text-xs"
                  value={draftValue}
                  onChange={(event) => setDraftValue(event.target.value)}
                />
              ) : draftType === "boolean" ? (
                <Select value={draftValue} onValueChange={setDraftValue}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">true</SelectItem>
                    <SelectItem value="false">false</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  className="rounded-lg font-mono"
                  value={draftValue}
                  onChange={(event) => setDraftValue(event.target.value)}
                />
              )}
            </div>

            <div className="space-y-1.5">
              <Label>توضیح</Label>
              <Textarea
                className="rounded-lg"
                value={draftDescription}
                onChange={(event) => setDraftDescription(event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>قابلیت دسترسی</Label>
              <Select
                value={draftIsPublic ? "public" : "internal"}
                onValueChange={(value) => setDraftIsPublic(value === "public")}
              >
                <SelectTrigger className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">عمومی (allow-list)</SelectItem>
                  <SelectItem value="internal">داخلی</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              onClick={() => setEditing(null)}
              disabled={saving}
            >
              انصراف
            </Button>
            <Button
              type="button"
              className="rounded-lg"
              onClick={() => void onSave()}
              disabled={saving}
            >
              ذخیره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
