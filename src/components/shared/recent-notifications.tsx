"use client";

import { Bell, BellOff, CheckCheck } from "lucide-react";

import type { AppNotification } from "@/lib/api/app-notifications";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils/date";

interface RecentNotificationsProps {
  notifications: AppNotification[];
  markingAll: boolean;
  onMarkAllRead: () => void;
  onOpen: (notification: AppNotification) => void;
}

export function RecentNotifications({
  notifications,
  markingAll,
  onMarkAllRead,
  onOpen,
}: RecentNotificationsProps) {
  const hasUnread = notifications.some((item) => !item.readAt);

  return (
    <section id="recent-notifications" aria-labelledby="notifications-title" className="scroll-mt-4">
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 id="notifications-title" className="text-[15px] font-black text-foreground">
          اعلان‌های اخیر
        </h2>
        {hasUnread ? (
          <button
            type="button"
            disabled={markingAll}
            onClick={onMarkAllRead}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-bold text-primary transition-colors hover:bg-primary/15 disabled:opacity-60"
          >
            <CheckCheck className="size-3.5" />
            خواندن همه
          </button>
        ) : null}
      </div>

      {notifications.length === 0 ? (
        <div className="flex items-center gap-3 rounded-[24px] bg-surface p-4 ring-1 ring-border/60">
          <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <BellOff className="size-5" strokeWidth={1.75} />
          </span>
          <p className="text-[12.5px] text-muted-foreground">اعلان جدیدی ندارید</p>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-[24px] bg-surface shadow-[0_14px_30px_-22px_rgba(45,106,79,0.5)] ring-1 ring-border/60">
          {notifications.map((notification, index) => {
            const unread = !notification.readAt;
            return (
              <li key={notification.notificationId} className={cn(index > 0 && "border-t border-border/50")}>
                <button
                  type="button"
                  onClick={() => onOpen(notification)}
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-3.5 text-right transition-colors hover:bg-muted/40",
                    unread && "bg-[#fffaf0]",
                  )}
                >
                  <span
                    className={cn(
                      "relative mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl",
                      unread ? "bg-[#fdefd6] text-[#b4661a]" : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Bell className="size-[18px]" strokeWidth={1.9} />
                    {unread ? (
                      <span className="absolute -left-0.5 -top-0.5 size-2.5 rounded-full bg-destructive ring-2 ring-surface" />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className={cn("truncate text-[13px]", unread ? "font-black" : "font-bold text-foreground/80")}>
                        {notification.title}
                      </span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-[11.5px] leading-5 text-muted-foreground">
                      {notification.body}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
