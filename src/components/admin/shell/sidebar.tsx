"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import { ChevronDown, LogOut, PanelRightClose, PanelRightOpen, UserRound } from "lucide-react";

import { Avatar } from "@/components/admin/ui/avatar";
import { PhoneText } from "@/components/admin/ui/ltr";
import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from "@/components/admin/ui/menu";
import { Tooltip } from "@/components/admin/ui/tooltip";
import { can } from "@/lib/admin/permissions";
import { cn } from "@/lib/utils";

import { useAdminViewer } from "./admin-context";
import { BrandMark } from "./brand-mark";
import { ADMIN_NAV, type AdminNavItem, isNavActive } from "./nav";
import { useSignOut } from "./use-sign-out";

export function SidebarContent({
  collapsed = false,
  onNavigate,
  onToggleCollapsed,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
  onToggleCollapsed?: () => void;
}) {
  const pathname = usePathname();
  const viewer = useAdminViewer();
  const { pending, signOut } = useSignOut();
  const roleLabel = viewer.isSuperAdmin ? "مدیر ارشد" : (viewer.roles[0] ?? "مدیر");

  return (
    <div className="flex h-full flex-col bg-soil text-soil-foreground">
      <div className={cn("flex h-16 shrink-0 items-center gap-3 px-5", collapsed && "justify-center px-0")}>
        <BrandMark className="size-9" />
        {collapsed ? null : (
          <div className="min-w-0 leading-tight">
            <p className="text-[15px] font-extrabold tracking-tight">کشاورز</p>
            <p className="text-[11px] text-soil-muted">کنسول مدیریت</p>
          </div>
        )}
      </div>

      <nav aria-label="بخش‌های پنل" className="admin-soil-scroll flex-1 overflow-y-auto px-3 pt-2 pb-4">
        {ADMIN_NAV.map((group) => {
          // A parent shows when the admin may open at least one of its sub-pages.
          const items = group.items.filter((item) =>
            item.children
              ? item.children.some((child) => can(viewer.access, child.permission))
              : can(viewer.access, item.permission),
          );
          if (items.length === 0) return null;
          return (
            <div className="mb-5" key={group.label}>
              {collapsed ? (
                <div aria-hidden className="mx-auto mb-2 h-px w-6 bg-soil-line" />
              ) : (
                <p className="mb-1.5 px-3 text-[11px] font-semibold text-soil-muted">{group.label}</p>
              )}
              <ul className="grid gap-0.5">
                {items.map((item) => {
                  const children = item.children?.filter((child) => can(viewer.access, child.permission)) ?? [];
                  if (item.children && children.length === 0) return null;
                  if (children.length === 0) {
                    return (
                      <li key={item.href}>
                        <NavLink collapsed={collapsed} item={item} onNavigate={onNavigate} pathname={pathname} />
                      </li>
                    );
                  }
                  // A collapsed rail has no room for a submenu: show the sub-pages as icons.
                  if (collapsed) {
                    return children.map((child) => (
                      <li key={child.href}>
                        <NavLink collapsed item={child} onNavigate={onNavigate} pathname={pathname} />
                      </li>
                    ));
                  }
                  return (
                    <li key={item.href}>
                      <NavParent items={children} onNavigate={onNavigate} parent={item} pathname={pathname} />
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-soil-line p-3">
        <Menu>
          <MenuTrigger asChild>
            <button
              className={cn(
                "flex w-full items-center gap-3 rounded-xl p-2 text-start transition-colors outline-none hover:bg-white/[0.05] focus-visible:ring-2 focus-visible:ring-wheat/70",
                collapsed && "justify-center",
              )}
              type="button"
            >
              <Avatar name={viewer.name} seed={viewer.id} size={34} image={viewer.image} />
              {collapsed ? null : (
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold">{viewer.name}</span>
                  <span className="block truncate text-[11px] text-soil-muted">{roleLabel}</span>
                </span>
              )}
            </button>
          </MenuTrigger>
          <MenuContent align="start" className="w-60" side="top">
            <MenuLabel>
              <span className="block text-[13px] font-bold text-foreground">{viewer.name}</span>
              <span className="mt-0.5 block font-normal">
                <PhoneText phone={viewer.phone} />
              </span>
            </MenuLabel>
            <MenuSeparator />
            <MenuItem asChild>
              <Link href="/admins/account" onClick={onNavigate}>
                <UserRound />
                حساب من، رمز عبور و نشست‌ها
              </Link>
            </MenuItem>
            <MenuSeparator />
            <MenuItem disabled={pending} onSelect={() => void signOut()} tone="danger">
              <LogOut />
              خروج از حساب
            </MenuItem>
          </MenuContent>
        </Menu>
        {onToggleCollapsed ? (
          <button
            aria-label={collapsed ? "باز کردن منو" : "جمع کردن منو"}
            className="mt-2 flex h-8 w-full items-center justify-center gap-2 rounded-lg text-[11.5px] text-soil-muted transition-colors outline-none hover:bg-white/[0.05] hover:text-soil-foreground focus-visible:ring-2 focus-visible:ring-wheat/70"
            onClick={onToggleCollapsed}
            type="button"
          >
            {collapsed ? <PanelRightOpen className="size-4" /> : <PanelRightClose className="size-4" />}
            {collapsed ? null : "جمع کردن منو"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

const itemClasses = (active: boolean, collapsed: boolean, upcoming?: boolean) =>
  cn(
    "relative flex h-10 w-full items-center gap-3 rounded-[10px] px-3 text-[13.5px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-wheat/70",
    collapsed && "justify-center px-0",
    active ? "bg-white/[0.08] text-white" : "text-soil-foreground/80",
    upcoming ? "cursor-default opacity-55" : "hover:bg-white/[0.05] hover:text-white",
  );

function NavLink({
  collapsed,
  item,
  nested = false,
  onNavigate,
  pathname,
}: {
  collapsed: boolean;
  item: AdminNavItem;
  nested?: boolean;
  onNavigate?: () => void;
  pathname: string;
}) {
  const Icon = item.icon;
  const active = !item.upcoming && isNavActive(pathname, item.href);
  const body = (
    <>
      {active ? <span aria-hidden className="absolute inset-y-2 right-0 w-[3px] rounded-l-full bg-wheat" /> : null}
      <Icon className={cn("shrink-0", nested ? "size-4" : "size-[18px]", active ? "text-wheat" : "text-soil-muted")} />
      {collapsed ? null : <span className="min-w-0 flex-1 truncate">{item.label}</span>}
      {!collapsed && item.upcoming ? (
        <span className="rounded-full border border-soil-line px-1.5 py-px text-[10px] text-soil-muted">به‌زودی</span>
      ) : null}
    </>
  );
  const classes = cn(itemClasses(active, collapsed, item.upcoming), nested && "h-9 text-[13px]");
  const node = item.upcoming ? (
    <span aria-disabled="true" className={classes}>
      {body}
    </span>
  ) : (
    <Link aria-current={active ? "page" : undefined} className={classes} href={item.href} onClick={onNavigate}>
      {body}
    </Link>
  );
  return collapsed ? (
    <Tooltip content={item.upcoming ? `${item.label} (به‌زودی)` : item.label} side="left">
      {node}
    </Tooltip>
  ) : (
    node
  );
}

function NavParent({
  items,
  onNavigate,
  parent,
  pathname,
}: {
  items: AdminNavItem[];
  onNavigate?: () => void;
  parent: AdminNavItem;
  pathname: string;
}) {
  const sectionActive = isNavActive(pathname, parent.href);
  // Starts open on the section's own pages; afterwards it is the admin's choice.
  const [open, setOpen] = useState(sectionActive);
  const panelId = useId();
  const Icon = parent.icon;
  const expanded = open || sectionActive;

  return (
    <>
      <button
        aria-controls={panelId}
        aria-expanded={expanded}
        className={cn(itemClasses(false, false), sectionActive && "text-white")}
        onClick={() => setOpen(!expanded)}
        type="button"
      >
        <Icon className={cn("size-[18px] shrink-0", sectionActive ? "text-wheat" : "text-soil-muted")} />
        <span className="min-w-0 flex-1 truncate text-start">{parent.label}</span>
        <ChevronDown
          aria-hidden
          className={cn(
            "size-4 shrink-0 text-soil-muted transition-transform duration-200 ease-out motion-reduce:transition-none",
            expanded && "rotate-180",
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none",
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
        id={panelId}
        inert={!expanded}
      >
        <ul className="min-h-0 overflow-hidden">
          <li aria-hidden className="h-0.5" />
          {items.map((child) => (
            <li className="relative pr-5" key={child.href}>
              <span aria-hidden className="absolute inset-y-0 right-[21px] w-px bg-soil-line" />
              <NavLink collapsed={false} item={child} nested onNavigate={onNavigate} pathname={pathname} />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
