"use client";

import { Globe, RotateCcw, Save, Undo2 } from "lucide-react";
import { useMemo, useState } from "react";

import { useCan } from "@/components/admin/shell/admin-context";
import { Badge } from "@/components/admin/ui/badge";
import { Button } from "@/components/admin/ui/button";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { Input } from "@/components/admin/ui/input";
import { Panel, PanelHeader } from "@/components/admin/ui/panel";
import { Switch } from "@/components/admin/ui/switch";
import { Tooltip } from "@/components/admin/ui/tooltip";
import { useAdminAction } from "@/components/admin/ui/use-admin-action";
import { adminApi } from "@/lib/admin/api";
import { faNumber, formatDateTime } from "@/lib/admin/format";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { cn } from "@/lib/utils";
import type { AdminSettingItem } from "@/server/modules/admin/settings/settings-admin.service";

type Draft = Record<string, string | boolean>;

/** Inputs hold text; integers are converted (Persian digits included) on save. */
function toDraft(items: AdminSettingItem[]): Draft {
  return Object.fromEntries(
    items.map((item) => [item.id, typeof item.value === "boolean" ? item.value : String(item.value)]),
  );
}

const latinDigits = (value: string) => value.replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0));

export function SettingsSectionForm({
  description,
  id,
  items,
  title,
}: {
  description: string;
  id: string;
  items: AdminSettingItem[];
  title: string;
}) {
  const canManage = useCan(ADMIN_PERMISSIONS.settingsManage);
  const saved = useMemo(() => toDraft(items), [items]);
  const [draft, setDraft] = useState<Draft>(saved);
  const [savedSnapshot, setSavedSnapshot] = useState(saved);
  const [resetting, setResetting] = useState<AdminSettingItem | null>(null);
  const action = useAdminAction();
  const reset = useAdminAction();

  // Server data changed (after save/reset + refresh): start again from it.
  if (savedSnapshot !== saved) {
    setSavedSnapshot(saved);
    setDraft(saved);
  }

  const dirtyIds = items.filter((item) => draft[item.id] !== saved[item.id]).map((item) => item.id);
  const dirty = dirtyIds.length > 0;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const values: Record<string, string | number | boolean> = {};
    for (const item of items) {
      if (!dirtyIds.includes(item.id)) continue;
      const value = draft[item.id]!;
      values[item.id] =
        item.definition.type === "integer" && typeof value === "string"
          ? latinDigits(value).trim() === ""
            ? ""
            : Number(latinDigits(value))
          : value;
    }
    await action.run(() => adminApi.patch(`/settings/sections/${id}`, { values }), "تنظیمات ذخیره شد.");
  }

  return (
    <Panel>
      <form noValidate onSubmit={submit}>
        <PanelHeader description={description} title={title} />
        <div className="divide-y divide-line border-t border-line">
          {items.map((item) => (
            <SettingRow
              canManage={canManage}
              error={action.errors[item.id]}
              item={item}
              key={item.id}
              onChange={(value) => setDraft((current) => ({ ...current, [item.id]: value }))}
              onReset={() => setResetting(item)}
              value={draft[item.id]!}
            />
          ))}
        </div>
        {canManage ? (
          <div
            className={cn(
              "flex flex-wrap items-center justify-end gap-2 border-t border-line bg-raised px-5 py-3 transition-colors",
              dirty && "bg-wheat-soft/60",
            )}
          >
            {dirty ? (
              <span className="me-auto text-[12px] text-wheat-ink">
                {faNumber(dirtyIds.length)} تغییر ذخیره‌نشده
              </span>
            ) : null}
            <Button
              disabled={!dirty || action.pending}
              onClick={() => {
                setDraft(saved);
                action.reset();
              }}
              type="button"
              variant="ghost"
            >
              <Undo2 />
              لغو تغییرات
            </Button>
            <Button disabled={!dirty} loading={action.pending} type="submit">
              <Save />
              ذخیره
            </Button>
          </div>
        ) : null}
      </form>

      <ConfirmDialog
        confirm="بازگشت به پیش‌فرض"
        description={
          resetting
            ? `مقدار ذخیره‌شده «${resetting.definition.label}» پاک می‌شود و مقدار پیش‌فرض (${describeValue(resetting.definition.default)}) دوباره اعمال می‌شود.`
            : ""
        }
        onConfirm={() => {
          if (!resetting) return;
          void reset
            .run(() => adminApi.post("/settings/reset", { id: resetting.id }), "به مقدار پیش‌فرض برگشت.")
            .then((ok) => ok && setResetting(null));
        }}
        onOpenChange={(open) => !open && setResetting(null)}
        open={resetting !== null}
        pending={reset.pending}
        title="بازگشت به مقدار پیش‌فرض"
        tone="primary"
      />
    </Panel>
  );
}

function describeValue(value: string | number | boolean): string {
  if (typeof value === "boolean") return value ? "روشن" : "خاموش";
  if (typeof value === "number") return faNumber(value);
  return value ? `«${value}»` : "خالی";
}

function SettingRow({
  canManage,
  error,
  item,
  onChange,
  onReset,
  value,
}: {
  canManage: boolean;
  error?: string;
  item: AdminSettingItem;
  onChange: (value: string | boolean) => void;
  onReset: () => void;
  value: string | boolean;
}) {
  const { definition } = item;
  const inputId = `setting-${item.id.replace(".", "-")}`;

  let control: React.ReactNode;
  if (definition.type === "boolean") {
    control = (
      <div className="flex items-center gap-3">
        <Switch
          checked={value === true}
          disabled={!canManage}
          id={inputId}
          label={definition.label}
          onCheckedChange={onChange}
        />
        <span className={cn("text-[12.5px] font-semibold", value === true ? "text-ok" : "text-warn")}>
          {value === true ? definition.onLabel : definition.offLabel}
        </span>
      </div>
    );
  } else {
    control = (
      <div className="flex items-center gap-2">
        <Input
          aria-describedby={`${inputId}-help`}
          aria-invalid={Boolean(error)}
          className={cn(
            definition.type === "integer" ? "w-32 text-left tabular-nums" : "max-w-md",
            definition.type === "string" && definition.ltr && "text-left",
          )}
          dir={definition.type === "integer" || (definition.type === "string" && definition.ltr) ? "ltr" : undefined}
          disabled={!canManage}
          id={inputId}
          inputMode={definition.type === "integer" ? "numeric" : definition.type === "string" && definition.ltr ? "tel" : undefined}
          maxLength={definition.type === "string" ? definition.maxLength : 6}
          onChange={(event) => onChange(event.target.value)}
          placeholder={definition.type === "string" ? definition.placeholder : undefined}
          value={value as string}
        />
        {definition.type === "integer" && definition.unit ? (
          <span className="text-[12.5px] text-muted-foreground">{definition.unit}</span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid gap-3 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-6">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <label className="text-[13.5px] font-bold text-foreground" htmlFor={inputId}>
            {definition.label}
          </label>
          {definition.isPublic ? (
            <Tooltip content="این مقدار از طریق API عمومی در اختیار اپلیکیشن قرار می‌گیرد.">
              <span tabIndex={0}>
                <Badge dot={false} tone="info">
                  <Globe className="size-3" />
                  عمومی
                </Badge>
              </span>
            </Tooltip>
          ) : null}
        </div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground" id={`${inputId}-help`}>
          {definition.help}
        </p>
        <p className="mt-1.5 font-mono text-[11px] text-muted-foreground/80" dir="ltr">
          {item.id}
        </p>
      </div>
      <div className="grid content-start gap-1.5">
        {control}
        {error ? (
          <p className="text-xs text-danger" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-muted-foreground">
          {item.isInvalidStored ? (
            <Badge tone="danger">مقدار ذخیره‌شده نامعتبر است؛ پیش‌فرض اعمال می‌شود</Badge>
          ) : item.isCustom ? (
            <span>
              تنظیم‌شده{item.updatedBy ? ` توسط ${item.updatedBy}` : ""}
              {item.updatedAt ? `، ${formatDateTime(item.updatedAt)}` : ""}
            </span>
          ) : (
            <span>مقدار پیش‌فرض ({describeValue(definition.default)})</span>
          )}
          {item.isCustom && canManage ? (
            <Button
              aria-label={`بازگرداندن «${definition.label}» به پیش‌فرض`}
              className="h-6 px-1.5 text-[11.5px]"
              onClick={onReset}
              size="sm"
              type="button"
              variant="ghost"
            >
              <RotateCcw className="size-3" />
              بازگشت به پیش‌فرض
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
