"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useQueryUpdater } from "@/components/admin/users/users-list-controls";
import { Button } from "@/components/admin/ui/button";
import { controlClass, NativeSelect } from "@/components/admin/ui/input";
import { faNumber } from "@/lib/admin/format";
import { cn } from "@/lib/utils";

import { AUDIT_SUBJECT_LABELS, auditModuleLabel } from "./team-labels";

export interface AuditFilterValues {
  action?: string;
  actor?: string;
  ip?: string;
  module?: string;
  period: string;
  subjectId?: string;
  subjectType?: string;
}

function useDebouncedParam(key: string, initial: string | undefined) {
  const update = useQueryUpdater();
  const [value, setValue] = useState(initial ?? "");
  const lastSent = useRef(initial ?? "");
  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed === lastSent.current) return;
    const timer = window.setTimeout(() => {
      lastSent.current = trimmed;
      update({ [key]: trimmed || null });
    }, 400);
    return () => window.clearTimeout(timer);
  });
  return [value, setValue, () => { setValue(""); lastSent.current = ""; }] as const;
}

export function AuditFilterBar({
  facets,
  values,
}: {
  facets: {
    admins: Array<{ id: string; name: string }>;
    modules: Array<{ count: number; module: string }>;
    subjectTypes: Array<{ count: number; type: string }>;
  };
  values: AuditFilterValues;
}) {
  const update = useQueryUpdater();
  const [action, setAction, clearAction] = useDebouncedParam("action", values.action);
  const [ip, setIp, clearIp] = useDebouncedParam("ip", values.ip);
  const [subjectId, setSubjectId, clearSubject] = useDebouncedParam("subjectId", values.subjectId);
  const active = Boolean(values.action || values.actor || values.ip || values.module || values.subjectId || values.subjectType || values.period !== "all");

  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <NativeSelect aria-label="مدیر" className="[&_select]:h-10" onChange={(event) => update({ actor: event.target.value || null })} value={values.actor ?? ""}>
          <option value="">همه مدیران</option>
          <option value="system">سامانه (بدون مدیر)</option>
          {facets.admins.map((admin) => (
            <option key={admin.id} value={admin.id}>
              {admin.name}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect aria-label="بخش" className="[&_select]:h-10" onChange={(event) => update({ module: event.target.value || null })} value={values.module ?? ""}>
          <option value="">همه بخش‌ها</option>
          {facets.modules.map((row) => (
            <option key={row.module} value={row.module}>
              {auditModuleLabel(row.module)} ({faNumber(row.count)})
            </option>
          ))}
        </NativeSelect>
        <NativeSelect aria-label="بازه زمانی" className="[&_select]:h-10" onChange={(event) => update({ period: event.target.value === "all" ? null : event.target.value })} value={values.period}>
          <option value="all">همه زمان‌ها</option>
          <option value="today">امروز</option>
          <option value="7d">۷ روز گذشته</option>
          <option value="30d">۳۰ روز گذشته</option>
          <option value="90d">۹۰ روز گذشته</option>
        </NativeSelect>
        <input
          aria-label="کد عملیات"
          className={cn(controlClass, "h-10 text-left font-mono text-[12.5px]")}
          dir="ltr"
          onChange={(event) => setAction(event.target.value)}
          placeholder="action, e.g. users.update"
          value={action}
        />
      </div>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <NativeSelect
          aria-label="نوع موضوع"
          className="[&_select]:h-10"
          onChange={(event) => update({ subjectType: event.target.value || null })}
          value={values.subjectType ?? ""}
        >
          <option value="">همه موضوع‌ها</option>
          {facets.subjectTypes.map((row) => (
            <option key={row.type} value={row.type}>
              {AUDIT_SUBJECT_LABELS[row.type] ?? row.type} ({faNumber(row.count)})
            </option>
          ))}
        </NativeSelect>
        <input
          aria-label="شناسه داخلی موضوع"
          className={cn(controlClass, "h-10 text-left")}
          dir="ltr"
          inputMode="numeric"
          onChange={(event) => setSubjectId(event.target.value.replace(/\D/g, ""))}
          placeholder="شناسه موضوع"
          value={subjectId}
        />
        <input
          aria-label="آی‌پی"
          className={cn(controlClass, "h-10 text-left")}
          dir="ltr"
          onChange={(event) => setIp(event.target.value)}
          placeholder="IP"
          value={ip}
        />
        {active ? (
          <Button
            onClick={() => {
              clearAction();
              clearIp();
              clearSubject();
              update({ action: null, actor: null, ip: null, module: null, period: null, subjectId: null, subjectType: null });
            }}
            variant="ghost"
          >
            <X />
            پاک کردن فیلترها
          </Button>
        ) : null}
      </div>
    </div>
  );
}
