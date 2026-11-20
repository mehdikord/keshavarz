"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import { CornerDownLeft, LoaderCircle, Search, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { Avatar } from "@/components/admin/ui/avatar";
import { Badge } from "@/components/admin/ui/badge";
import { Ltr } from "@/components/admin/ui/ltr";
import { adminApi } from "@/lib/admin/api";
import { formatPhone } from "@/lib/admin/format";
import { USER_STATUS } from "@/lib/admin/labels";
import { ADMIN_PERMISSIONS, can } from "@/lib/admin/permissions";
import { cn } from "@/lib/utils";
import type { AdminUserListItem } from "@/server/modules/admin/users/users.service";

import { useAdminViewer } from "./admin-context";
import { ADMIN_NAV, flattenNav } from "./nav";

interface Entry {
  hint?: React.ReactNode;
  href: string;
  icon: React.ReactNode;
  id: string;
  label: string;
  section: string;
  sub?: string;
}

export function CommandPalette({ onOpenChange, open }: { onOpenChange: (open: boolean) => void; open: boolean }) {
  const router = useRouter();
  const viewer = useAdminViewer();
  const canSearchUsers = can(viewer.access, ADMIN_PERMISSIONS.usersView);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const trimmed = query.trim();
  const searching = canSearchUsers && trimmed.length >= 2;

  useEffect(() => {
    if (!searching) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const items = await adminApi.get<AdminUserListItem[]>(
          "/users",
          { perPage: 10, q: trimmed },
          controller.signal,
        );
        setUsers(items.slice(0, 6));
      } catch {
        if (!controller.signal.aborted) setUsers([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [searching, trimmed]);

  const entries = useMemo<Entry[]>(() => {
    const needle = trimmed.toLowerCase();
    const pages = ADMIN_NAV.flatMap((group) =>
      flattenNav(group.items)
        .filter((item) => !item.upcoming && can(viewer.access, item.permission))
        .filter((item) => !needle || `${item.label} ${item.keywords ?? ""}`.toLowerCase().includes(needle))
        .map<Entry>((item) => {
          const Icon = item.icon;
          return {
            href: item.href,
            icon: <Icon className="size-4" />,
            id: `page:${item.href}`,
            label: item.label,
            section: "صفحه‌ها",
          };
        }),
    );
    const people = (searching ? users : []).map<Entry>((user) => ({
      hint: <Badge tone={USER_STATUS[user.status]?.tone}>{USER_STATUS[user.status]?.label}</Badge>,
      href: `/admins/users/${user.id}`,
      icon: <Avatar image={user.image} name={user.name} seed={user.id} size={28} />,
      id: `user:${user.id}`,
      label: user.name,
      section: "کاربران",
      sub: formatPhone(user.phone),
    }));
    return [...people, ...pages];
  }, [searching, trimmed, users, viewer.access]);

  const activeIndex = Math.min(active, Math.max(0, entries.length - 1));

  function go(entry: Entry | undefined) {
    if (!entry) return;
    onOpenChange(false);
    router.push(entry.href);
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setQuery("");
      setUsers([]);
      setActive(0);
    }
    onOpenChange(next);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, entries.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(entries[activeIndex]);
    }
  }

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  let lastSection = "";

  return (
    <DialogPrimitive.Root onOpenChange={handleOpenChange} open={open}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#07110b]/50 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed top-[12vh] left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-[var(--a-shadow-pop)] outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98]"
          dir="rtl"
          onKeyDown={onKeyDown}
        >
          <DialogPrimitive.Title className="sr-only">جستجو و پرش سریع</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            نام صفحه، نام کاربر یا شماره موبایل را بنویسید.
          </DialogPrimitive.Description>
          <div className="flex items-center gap-3 border-b border-line px-4">
            {loading ? (
              <LoaderCircle className="size-[18px] shrink-0 animate-spin text-muted-foreground" />
            ) : (
              <Search className="size-[18px] shrink-0 text-muted-foreground" />
            )}
            <input
              aria-activedescendant={entries[activeIndex]?.id}
              aria-controls="admin-command-list"
              aria-expanded
              autoFocus
              className="h-14 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              placeholder={canSearchUsers ? "نام صفحه، نام کاربر یا شماره موبایل…" : "نام صفحه…"}
              role="combobox"
              value={query}
            />
            <kbd className="hidden rounded-md border border-border px-1.5 py-0.5 text-[10.5px] text-muted-foreground sm:inline">
              Esc
            </kbd>
          </div>
          <div className="admin-scroll max-h-[min(420px,60vh)] overflow-y-auto p-2" id="admin-command-list" ref={listRef} role="listbox">
            {entries.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
                <UserRound className="size-5" />
                {loading ? "در حال جستجو…" : "نتیجه‌ای پیدا نشد."}
              </div>
            ) : (
              entries.map((entry, index) => {
                const header = entry.section !== lastSection ? entry.section : null;
                lastSection = entry.section;
                return (
                  <div key={entry.id}>
                    {header ? (
                      <p className="px-2.5 pt-2 pb-1 text-[11px] font-semibold text-muted-foreground">{header}</p>
                    ) : null}
                    <div
                      aria-selected={index === activeIndex}
                      className={cn(
                        "flex h-12 cursor-pointer items-center gap-3 rounded-xl px-2.5",
                        index === activeIndex ? "bg-muted" : "hover:bg-muted/60",
                      )}
                      data-index={index}
                      id={entry.id}
                      onClick={() => go(entry)}
                      onMouseMove={() => setActive(index)}
                      role="option"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center text-muted-foreground">
                        {entry.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-semibold">{entry.label}</span>
                        {entry.sub ? (
                          <span className="block text-[11.5px] text-muted-foreground">
                            <Ltr>{entry.sub}</Ltr>
                          </span>
                        ) : null}
                      </span>
                      {entry.hint}
                      {index === activeIndex ? <CornerDownLeft className="size-3.5 text-muted-foreground" /> : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
