"use client";

import { LogOut, MonitorSmartphone } from "lucide-react";

import { Badge } from "@/components/admin/ui/badge";
import { Button } from "@/components/admin/ui/button";
import { Ltr } from "@/components/admin/ui/ltr";
import { EmptyState } from "@/components/admin/ui/panel";
import { useAdminAction } from "@/components/admin/ui/use-admin-action";
import { formatDateTime, formatRelative, formatShortDate } from "@/lib/admin/format";

import { describeAgent } from "./team-labels";

export interface SessionRow {
  createdAt: string;
  current?: boolean;
  id: string | null;
  ipAddress: string | null;
  isActive: boolean;
  lastActivityAt: string;
  revokedAt: string | null;
  userAgent: string | null;
}

/** Sessions with a per-row "sign out" when `onRevoke` is given. */
export function SessionsTable({
  now,
  onRevoke,
  sessions,
}: {
  now: Date;
  onRevoke?: (sessionId: string) => Promise<unknown>;
  sessions: SessionRow[];
}) {
  const action = useAdminAction();
  if (sessions.length === 0) {
    return <EmptyState icon={<MonitorSmartphone />} title="نشستی در ۳۰ روز گذشته ثبت نشده است" />;
  }
  return (
    <ul className="divide-y divide-line">
      {sessions.map((session, index) => (
        <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3" key={session.id ?? `legacy-${index}`}>
          <MonitorSmartphone className="size-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2 text-[13px] font-semibold">
              {describeAgent(session.userAgent)}
              {session.current ? <Badge tone="info">همین دستگاه</Badge> : null}
              {session.isActive ? (
                <Badge tone="success">فعال</Badge>
              ) : session.revokedAt ? (
                <Badge tone="neutral">بسته‌شده</Badge>
              ) : (
                <Badge tone="neutral">منقضی</Badge>
              )}
            </p>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
              {session.ipAddress ? <Ltr>{session.ipAddress}</Ltr> : "آی‌پی نامشخص"}
              {" · "}
              <span title={formatDateTime(session.lastActivityAt)}>آخرین فعالیت {formatRelative(session.lastActivityAt, now)}</span>
              {" · "}
              شروع {formatShortDate(session.createdAt)}
            </p>
          </div>
          {onRevoke && session.isActive && !session.current && session.id ? (
            <Button
              loading={action.pending}
              onClick={() => action.run(() => onRevoke(session.id!), "نشست بسته شد.")}
              size="sm"
              variant="danger-soft"
            >
              <LogOut />
              خروج
            </Button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
