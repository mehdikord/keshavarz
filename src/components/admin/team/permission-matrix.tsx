"use client";

import { Check, Minus, ShieldX } from "lucide-react";

import { Tooltip } from "@/components/admin/ui/tooltip";
import { cn } from "@/lib/utils";

import { groupPermissionCodes } from "./team-labels";

/** Editable checklist of permissions grouped by section (used by the role editor). */
export function PermissionChecklist({
  codes,
  disabled,
  grantable,
  onChange,
  value,
}: {
  codes: string[];
  disabled?: boolean;
  /** Codes the editor may add; others are shown but locked (unless already selected). */
  grantable?: (code: string) => boolean;
  onChange: (next: string[]) => void;
  value: string[];
}) {
  const selected = new Set(value);
  const toggle = (code: string, on: boolean) => {
    const next = new Set(selected);
    if (on) next.add(code);
    else next.delete(code);
    onChange([...next]);
  };

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {groupPermissionCodes(codes).map((group) => {
        const all = group.permissions.every((item) => selected.has(item.code));
        const lockedAll = group.permissions.some((item) => !selected.has(item.code) && grantable && !grantable(item.code));
        return (
          <fieldset className="rounded-xl border border-line" disabled={disabled} key={group.module}>
            <legend className="sr-only">{group.label}</legend>
            <div className="flex items-center justify-between gap-2 border-b border-line bg-raised/70 px-3.5 py-2.5">
              <span className="text-[13px] font-bold">{group.label}</span>
              <button
                className="rounded-md px-2 py-0.5 text-[11.5px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
                disabled={disabled || (!all && lockedAll)}
                onClick={() => {
                  const next = new Set(selected);
                  for (const item of group.permissions) {
                    if (all) next.delete(item.code);
                    else if (!grantable || grantable(item.code)) next.add(item.code);
                  }
                  onChange([...next]);
                }}
                type="button"
              >
                {all ? "برداشتن همه" : "انتخاب همه"}
              </button>
            </div>
            <ul className="grid gap-0.5 p-1.5">
              {group.permissions.map((item) => {
                const checked = selected.has(item.code);
                const locked = !checked && Boolean(grantable && !grantable(item.code));
                const row = (
                  <label
                    className={cn(
                      "flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-2 hover:bg-muted/60",
                      (locked || disabled) && "cursor-not-allowed opacity-55 hover:bg-transparent",
                    )}
                  >
                    <input
                      checked={checked}
                      className="mt-0.5 size-4 shrink-0 accent-[var(--a-soil)]"
                      disabled={locked || disabled}
                      onChange={(event) => toggle(item.code, event.target.checked)}
                      type="checkbox"
                    />
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold">{item.label}</span>
                      {item.description ? (
                        <span className="block text-[11.5px] leading-5 text-muted-foreground">{item.description}</span>
                      ) : null}
                    </span>
                  </label>
                );
                return (
                  <li key={item.code}>
                    {locked ? (
                      <Tooltip content="این دسترسی را خودتان ندارید و نمی‌توانید آن را بدهید.">
                        <div>{row}</div>
                      </Tooltip>
                    ) : (
                      row
                    )}
                  </li>
                );
              })}
            </ul>
          </fieldset>
        );
      })}
    </div>
  );
}

export type PermissionSource = { kind: "role"; name: string } | { kind: "allow" } | { kind: "super" };

/** Read-only view of what an admin can do and why. */
export function EffectivePermissions({
  codes,
  sources,
}: {
  codes: string[];
  sources: Record<string, { denied: boolean; granted: PermissionSource[] }>;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {groupPermissionCodes(codes).map((group) => (
        <div className="rounded-xl border border-line" key={group.module}>
          <p className="border-b border-line bg-raised/70 px-3.5 py-2 text-[12.5px] font-bold">{group.label}</p>
          <ul className="grid gap-0.5 p-1.5">
            {group.permissions.map((item) => {
              const source = sources[item.code] ?? { denied: false, granted: [] };
              const active = !source.denied && source.granted.length > 0;
              const why = source.denied
                ? "استثنای «منع» این دسترسی را بسته است"
                : source.granted
                    .map((entry) => (entry.kind === "role" ? `نقش ${entry.name}` : entry.kind === "super" ? "مدیر ارشد" : "استثنای «اجازه»"))
                    .join("، ") || "ندارد";
              return (
                <li className="flex items-start gap-2 rounded-lg px-2 py-1.5" key={item.code}>
                  <span
                    aria-hidden
                    className={cn(
                      "mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full",
                      source.denied ? "bg-danger-soft text-danger" : active ? "bg-ok-soft text-ok" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {source.denied ? <ShieldX className="size-3" /> : active ? <Check className="size-3" /> : <Minus className="size-3" />}
                  </span>
                  <span className="min-w-0">
                    <span className={cn("block text-[12.5px] font-semibold", !active && "text-muted-foreground")}>
                      {item.label}
                      <span className="sr-only">{active ? " (دارد)" : " (ندارد)"}</span>
                    </span>
                    {active || source.denied ? <span className="block text-[11px] text-muted-foreground">{why}</span> : null}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
