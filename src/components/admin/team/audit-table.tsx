import Link from "next/link";
import { ChevronLeft, ScrollText, SearchX } from "lucide-react";

import { Badge } from "@/components/admin/ui/badge";
import { Ltr } from "@/components/admin/ui/ltr";
import { EmptyState } from "@/components/admin/ui/panel";
import { formatDateTime, formatRelative } from "@/lib/admin/format";
import type { AuditEntry } from "@/server/modules/admin/team/audit-viewer.service";

import { AuditActor, AuditSubjectLink } from "./audit-entries";
import { auditActionLabel, auditModuleLabel } from "./team-labels";

export function AuditTable({ filtered, items, now }: { filtered: boolean; items: AuditEntry[]; now: Date }) {
  if (items.length === 0) {
    return filtered ? (
      <EmptyState description="فیلترها را تغییر دهید." icon={<SearchX />} title="رویدادی با این مشخصات نیست" />
    ) : (
      <EmptyState icon={<ScrollText />} title="هنوز رویدادی ثبت نشده" />
    );
  }
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[920px] text-[13px]">
          <thead>
            <tr className="border-b border-line text-right text-[11.5px] font-semibold text-muted-foreground">
              <th className="py-3 pr-5 pl-3 font-semibold" scope="col">زمان</th>
              <th className="px-3 font-semibold" scope="col">مدیر</th>
              <th className="px-3 font-semibold" scope="col">عملیات</th>
              <th className="px-3 font-semibold" scope="col">موضوع</th>
              <th className="px-3 font-semibold" scope="col">آی‌پی</th>
              <th className="w-10 pl-4" scope="col">
                <span className="sr-only">جزئیات</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((entry) => (
              <tr className="border-b border-line align-top last:border-0 hover:bg-raised/70" key={entry.id}>
                <td className="py-3 pr-5 pl-3 text-[12px] whitespace-nowrap" title={formatDateTime(entry.createdAt)}>
                  <span className="block">{formatRelative(entry.createdAt, now)}</span>
                  <span className="text-[11px] text-muted-foreground">{formatDateTime(entry.createdAt)}</span>
                </td>
                <td className="px-3 py-3">
                  <AuditActor actor={entry.actor} />
                </td>
                <td className="px-3 py-3">
                  <Link className="font-semibold hover:underline" href={`/admins/team/audit/${entry.id}`}>
                    {auditActionLabel(entry.action)}
                  </Link>
                  <span className="mt-1 flex items-center gap-1.5">
                    <Badge dot={false} tone="neutral">{auditModuleLabel(entry.module)}</Badge>
                    <Ltr className="font-mono text-[10.5px] text-muted-foreground">{entry.action}</Ltr>
                  </span>
                </td>
                <td className="max-w-64 px-3 py-3">
                  <AuditSubjectLink subject={entry.subject} />
                </td>
                <td className="px-3 py-3 text-[12px]">{entry.ipAddress ? <Ltr>{entry.ipAddress}</Ltr> : "—"}</td>
                <td className="pl-4 pt-3">
                  <Link aria-label="جزئیات رویداد" className="text-muted-foreground hover:text-foreground" href={`/admins/team/audit/${entry.id}`}>
                    <ChevronLeft className="size-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="divide-y divide-line md:hidden">
        {items.map((entry) => (
          <li className="px-4 py-3" key={entry.id}>
            <div className="flex items-start justify-between gap-2">
              <Link className="font-semibold" href={`/admins/team/audit/${entry.id}`}>
                {auditActionLabel(entry.action)}
              </Link>
              <span className="shrink-0 text-[11px] text-muted-foreground">{formatRelative(entry.createdAt, now)}</span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
              <AuditActor actor={entry.actor} />
              <AuditSubjectLink subject={entry.subject} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
