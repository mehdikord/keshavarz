import Link from "next/link";
import { ArrowUpLeft, Bot } from "lucide-react";

import { Avatar } from "@/components/admin/ui/avatar";
import { Badge } from "@/components/admin/ui/badge";
import { Ltr } from "@/components/admin/ui/ltr";
import { EmptyState } from "@/components/admin/ui/panel";
import { formatDateTime, formatRelative } from "@/lib/admin/format";
import type { AuditEntry } from "@/server/modules/admin/team/audit-viewer.service";

import { AUDIT_SUBJECT_LABELS, auditActionLabel, auditModuleLabel } from "./team-labels";

export function AuditSubjectLink({ subject }: { subject: AuditEntry["subject"] }) {
  if (!subject) return <span className="text-muted-foreground">—</span>;
  const type = AUDIT_SUBJECT_LABELS[subject.type] ?? subject.type;
  const text = subject.label ? `${type}: ${subject.label}` : `${type} #${subject.id}`;
  return subject.href ? (
    <Link
      className="inline-flex max-w-full items-center gap-1 truncate rounded font-medium text-info underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      href={subject.href}
    >
      <span className="truncate">{text}</span>
      <ArrowUpLeft className="size-3.5 shrink-0" />
    </Link>
  ) : (
    <span className="truncate text-foreground/80">{text}</span>
  );
}

export function AuditActor({ actor }: { actor: AuditEntry["actor"] }) {
  if (!actor) {
    return (
      <span className="inline-flex items-center gap-2 text-muted-foreground">
        <span className="flex size-7 items-center justify-center rounded-full bg-muted">
          <Bot className="size-3.5" />
        </span>
        سامانه
      </span>
    );
  }
  return (
    <Link
      className="inline-flex min-w-0 items-center gap-2 rounded font-semibold hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      href={`/admins/team/admins/${actor.id}`}
    >
      <Avatar image={actor.image} name={actor.name} seed={actor.id} size={28} />
      <span className="truncate">{actor.name}</span>
    </Link>
  );
}

/** Compact timeline of audit entries, each linking to its detail page when the viewer may open it. */
export function AuditTimeline({
  emptyTitle,
  entries,
  linkEntries,
  now,
  showActor = true,
}: {
  emptyTitle: string;
  entries: AuditEntry[];
  linkEntries: boolean;
  now: Date;
  showActor?: boolean;
}) {
  if (entries.length === 0) return <EmptyState className="py-8" title={emptyTitle} />;
  return (
    <ul className="divide-y divide-line">
      {entries.map((entry) => (
        <li className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 px-5 py-3" key={entry.id}>
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 text-[13px] font-semibold">
              {linkEntries ? (
                <Link className="rounded hover:underline" href={`/admins/team/audit/${entry.id}`}>
                  {auditActionLabel(entry.action)}
                </Link>
              ) : (
                auditActionLabel(entry.action)
              )}
              <Badge dot={false} tone="neutral">
                {auditModuleLabel(entry.module)}
              </Badge>
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
              {showActor ? <AuditActor actor={entry.actor} /> : null}
              {entry.subject ? <AuditSubjectLink subject={entry.subject} /> : null}
            </div>
          </div>
          <p className="shrink-0 text-[11.5px] text-muted-foreground" title={formatDateTime(entry.createdAt)}>
            {formatRelative(entry.createdAt, now)}
            {entry.ipAddress ? (
              <>
                {" · "}
                <Ltr>{entry.ipAddress}</Ltr>
              </>
            ) : null}
          </p>
        </li>
      ))}
    </ul>
  );
}
