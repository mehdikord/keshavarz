"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  ClipboardList,
  CornerDownLeft,
  CreditCard,
  Hash,
  Loader2,
  Search,
  UserCog,
  Users,
} from "lucide-react";

import {
  ADMIN_ACCOUNT_ITEMS,
  ADMIN_NAV_GROUPS,
  isAdminNavItemAllowed,
} from "@/components/admin-panel/shell/admin-nav";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAdminPermissions } from "@/hooks/admin/use-admin-permissions";
import { PUBLIC_ID_PATTERN } from "@/lib/admin/search-params";
import { fetchAdminProviders } from "@/lib/api/admin-providers";
import { fetchAdminAdmins } from "@/lib/api/admin-rbac";
import { fetchAdminUsers } from "@/lib/api/admin-users";
import { cn } from "@/lib/utils";
import { useAdminShellStore } from "@/stores/admin-shell-store";

interface PaletteItem {
  id: string;
  group: string;
  title: string;
  subtitle?: string;
  href: string;
  icon: LucideIcon;
  ltrSubtitle?: boolean;
  /** Normalized text matched against the query (pages only). */
  searchText?: string;
}

const RESULTS_PER_GROUP = 5;
const NO_ITEMS: PaletteItem[] = [];
const SEARCH_DEBOUNCE_MS = 250;

/** Fold Arabic/Persian letter variants, digits and ZWNJ so matching is forgiving. */
function normalize(value: string): string {
  return value
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[‌‏]/g, "")
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .toLowerCase()
    .trim();
}

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

export function AdminCommandPalette() {
  const router = useRouter();
  const { can } = useAdminPermissions();
  const open = useAdminShellStore((s) => s.commandPaletteOpen);
  const setOpen = useAdminShellStore((s) => s.setCommandPaletteOpen);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  // Results are tagged with the query they answer, so stale ones are ignored
  // without resetting state inside effects.
  const [remote, setRemote] = useState<{ query: string; items: PaletteItem[] }>({
    items: [],
    query: "",
  });
  const listRef = useRef<HTMLDivElement>(null);

  // Ctrl/⌘+K anywhere, or "/" when not typing, opens the palette.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isShortcut =
        (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";
      if (isShortcut) {
        event.preventDefault();
        setOpen(!useAdminShellStore.getState().commandPaletteOpen);
        return;
      }
      if (event.key === "/" && !isTypingTarget(event.target)) {
        event.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setOpen]);

  const pages = useMemo<PaletteItem[]>(() => {
    const navItems = ADMIN_NAV_GROUPS.flatMap((group) =>
      group.items
        .filter((item) => isAdminNavItemAllowed(item, can))
        .map((item) => ({ ...item, groupTitle: group.title })),
    );
    const accountItems = ADMIN_ACCOUNT_ITEMS.map((item) => ({
      ...item,
      groupTitle: "حساب کاربری",
    }));

    return [...navItems, ...accountItems].map((item) => ({
      group: "صفحات",
      href: item.href,
      icon: item.icon,
      id: `page:${item.href}`,
      subtitle: item.groupTitle,
      title: item.title,
      searchText: normalize(
        [item.title, item.groupTitle, ...(item.keywords ?? [])].join(" "),
      ),
    }));
  }, [can]);

  const normalizedQuery = normalize(query);
  const debouncedQuery = useDebounced(normalizedQuery, SEARCH_DEBOUNCE_MS);

  const matchedPages = useMemo(() => {
    if (!normalizedQuery) return pages;
    const terms = normalizedQuery.split(/\s+/);
    return pages.filter((page) => {
      return terms.every((term) => page.searchText?.includes(term));
    });
  }, [normalizedQuery, pages]);

  // Exact public IDs: offer direct jumps instead of a fuzzy search.
  const idJumps = useMemo<PaletteItem[]>(() => {
    const raw = query.trim().toUpperCase();
    if (!PUBLIC_ID_PATTERN.test(raw)) return [];
    const jumps: Array<[string, string, string, LucideIcon]> = [
      ["requests.view", "درخواست", `/admins/service-requests/${raw}`, ClipboardList],
      ["users.view", "کاربر", `/admins/users/${raw}`, Users],
      ["providers.view", "خدمات‌دهنده", `/admins/providers/${raw}`, BadgeCheck],
      ["payments.view", "پرداخت", `/admins/payments/${raw}`, CreditCard],
    ];
    return jumps
      .filter(([permission]) => can(permission))
      .map(([, label, href, icon]) => ({
        group: "رفتن به شناسه",
        href,
        icon,
        id: `id:${href}`,
        ltrSubtitle: true,
        subtitle: raw,
        title: `باز کردن ${label}`,
      }));
  }, [can, query]);

  // Live entity search across the lists that accept free-text `q`.
  const shouldSearch =
    open &&
    debouncedQuery.length >= 2 &&
    !PUBLIC_ID_PATTERN.test(debouncedQuery.toUpperCase());
  const searching = shouldSearch && remote.query !== debouncedQuery;
  const remoteItems =
    shouldSearch && remote.query === debouncedQuery ? remote.items : NO_ITEMS;

  useEffect(() => {
    if (!shouldSearch) return;

    const controller = new AbortController();
    const signal = controller.signal;
    const q = debouncedQuery;

    const tasks: Array<Promise<PaletteItem[]>> = [];
    if (can("users.view")) {
      tasks.push(
        fetchAdminUsers({ q, limit: 20, signal }).then(({ items }) =>
          items.slice(0, RESULTS_PER_GROUP).map((user) => ({
            group: "کاربران",
            href: `/admins/users/${user.userId}`,
            icon: Users,
            id: `user:${user.userId}`,
            ltrSubtitle: true,
            subtitle: user.phone,
            title: user.name,
          })),
        ),
      );
    }
    if (can("providers.view")) {
      tasks.push(
        fetchAdminProviders({ q, limit: 20, signal }).then(({ items }) =>
          items.slice(0, RESULTS_PER_GROUP).map((provider) => ({
            group: "خدمات‌دهندگان",
            href: `/admins/providers/${provider.providerId}`,
            icon: BadgeCheck,
            id: `provider:${provider.providerId}`,
            ltrSubtitle: true,
            subtitle: provider.phone,
            title: provider.name,
          })),
        ),
      );
    }
    if (can("admins.view")) {
      tasks.push(
        fetchAdminAdmins({ q, limit: 20, signal }).then(({ items }) =>
          items.slice(0, RESULTS_PER_GROUP).map((admin) => ({
            group: "مدیران",
            href: `/admins/admins/${admin.adminId}`,
            icon: UserCog,
            id: `admin:${admin.adminId}`,
            ltrSubtitle: true,
            subtitle: admin.phone,
            title: admin.name,
          })),
        ),
      );
    }

    void Promise.allSettled(tasks).then((results) => {
      if (signal.aborted) return;
      setRemote({
        items: results.flatMap((result) =>
          result.status === "fulfilled" ? result.value : [],
        ),
        query: q,
      });
    });

    return () => controller.abort();
  }, [can, debouncedQuery, shouldSearch]);

  const items = useMemo(
    () => [
      ...idJumps,
      ...matchedPages,
      ...(normalizedQuery.length >= 2 ? remoteItems : []),
    ],
    [idJumps, matchedPages, normalizedQuery.length, remoteItems],
  );

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  function close() {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }

  function select(item: PaletteItem | undefined) {
    if (!item) return;
    close();
    router.push(item.href);
  }

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (items.length === 0 ? 0 : (index + 1) % items.length));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) =>
        items.length === 0 ? 0 : (index - 1 + items.length) % items.length,
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      select(items[activeIndex]);
    }
  }

  let lastGroup: string | null = null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
        else setOpen(true);
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="top-[12vh] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl"
      >
        <DialogTitle className="sr-only">جستجوی سراسری</DialogTitle>
        <DialogDescription className="sr-only">
          جستجو در صفحات، کاربران، خدمات‌دهندگان و مدیران. با کلیدهای جهت حرکت کنید و Enter را بزنید.
        </DialogDescription>

        <div className="flex items-center gap-2 border-b border-[var(--admin-border)] px-4">
          {searching ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <Search className="size-4 shrink-0 text-muted-foreground" />
          )}
          <input
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onInputKeyDown}
            placeholder="جستجوی صفحه، نام، موبایل یا شناسه..."
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            role="combobox"
            aria-expanded="true"
            aria-controls="admin-command-palette-list"
            aria-activedescendant={items[activeIndex] ? `palette-item-${activeIndex}` : undefined}
          />
          <kbd className="hidden rounded border border-[var(--admin-border)] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
            Esc
          </kbd>
        </div>

        <div
          ref={listRef}
          id="admin-command-palette-list"
          role="listbox"
          className="max-h-[min(60vh,26rem)] overflow-y-auto p-2"
        >
          {items.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              {searching ? "در حال جستجو..." : "نتیجه‌ای یافت نشد."}
            </p>
          ) : (
            items.map((item, index) => {
              const showGroup = item.group !== lastGroup;
              lastGroup = item.group;
              const Icon = item.icon;
              const active = index === activeIndex;
              return (
                <div key={item.id}>
                  {showGroup ? (
                    <p className="px-3 pt-3 pb-1 text-[11px] font-medium text-muted-foreground first:pt-1">
                      {item.group}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    id={`palette-item-${index}`}
                    data-index={index}
                    role="option"
                    aria-selected={active}
                    onMouseMove={() => setActiveIndex(index)}
                    onClick={() => select(item)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-start text-sm",
                      active ? "bg-[var(--admin-row-hover)] text-foreground" : "text-foreground/90",
                    )}
                  >
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{item.title}</span>
                    {item.subtitle ? (
                      <span
                        className={cn(
                          "max-w-[45%] truncate text-xs text-muted-foreground",
                          item.ltrSubtitle && "font-mono",
                        )}
                        dir={item.ltrSubtitle ? "ltr" : undefined}
                      >
                        {item.subtitle}
                      </span>
                    ) : null}
                    {active ? (
                      <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground" />
                    ) : null}
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-[var(--admin-border)] px-4 py-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Hash className="size-3" />
            شناسه ۲۶ کاراکتری را برای رفتن مستقیم وارد کنید
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
