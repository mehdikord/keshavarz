import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminForbidden } from "@/components/admin/shell/forbidden";
import { PageHeader } from "@/components/admin/shell/page-header";
import { AuditActor, AuditSubjectLink } from "@/components/admin/team/audit-entries";
import { AuditDiff } from "@/components/admin/team/audit-diff";
import { AUDIT_SUBJECT_LABELS, auditActionLabel, auditModuleLabel, describeAgent } from "@/components/admin/team/team-labels";
import { Badge } from "@/components/admin/ui/badge";
import { buttonVariants } from "@/components/admin/ui/button";
import { Ltr } from "@/components/admin/ui/ltr";
import { DescriptionList, Panel, PanelHeader } from "@/components/admin/ui/panel";
import { formatDateTime } from "@/lib/admin/format";
import { ADMIN_PERMISSIONS, can } from "@/lib/admin/permissions";
import { getAdminPageSession } from "@/server/modules/admin/auth/admin-viewer";
import { getAuditEntry } from "@/server/modules/admin/team/audit-viewer.service";
import { AuditParamsSchema } from "@/server/modules/admin/team/team.schemas";

export const metadata: Metadata = { title: "رویداد ممیزی" };

export default async function AuditEntryPage({ params }: { params: Promise<{ auditId: string }> }) {
  const session = await getAdminPageSession();
  if (!session || !can(session.viewer.access, ADMIN_PERMISSIONS.auditLogsView)) {
    return <AdminForbidden section="گزارش ممیزی" />;
  }
  const parsed = AuditParamsSchema.safeParse(await params);
  if (!parsed.success) notFound();
  const entry = await getAuditEntry(parsed.data.auditId);
  if (!entry) notFound();

  const metadata = entry.metadata && typeof entry.metadata === "object" ? entry.metadata : null;

  return (
    <>
      <PageHeader
        actions={
          entry.subject ? (
            <Link
              className={buttonVariants({ variant: "outline" })}
              href={`/admins/team/audit?subjectType=${entry.subject.type}&subjectId=${entry.subject.id}`}
            >
              همه رویدادهای این موضوع
            </Link>
          ) : null
        }
        breadcrumbs={[{ label: "مدیران و دسترسی‌ها" }, { href: "/admins/team/audit", label: "گزارش ممیزی" }, { label: `رویداد #${entry.id}` }]}
        title={
          <span className="flex flex-wrap items-center gap-2">
            {auditActionLabel(entry.action)}
            <Badge dot={false} tone="neutral">{auditModuleLabel(entry.module)}</Badge>
          </span>
        }
      />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-5">
          <Panel className="overflow-hidden">
            <PanelHeader description="ردیف‌های تغییرکرده رنگی شده‌اند." title="مقدار قبل و بعد" />
            <AuditDiff newValues={entry.newValues} oldValues={entry.oldValues} />
          </Panel>
          {metadata ? (
            <Panel className="overflow-hidden">
              <PanelHeader title="اطلاعات تکمیلی" />
              <pre className="mx-5 mb-5 overflow-x-auto rounded-xl bg-raised p-4 text-left font-mono text-[12px] leading-6" dir="ltr">
                {JSON.stringify(metadata, null, 2)}
              </pre>
            </Panel>
          ) : null}
        </div>
        <Panel className="p-5">
          <DescriptionList
            className="sm:grid-cols-1"
            items={[
              { label: "زمان", value: formatDateTime(entry.createdAt) },
              { label: "انجام‌دهنده", value: <AuditActor actor={entry.actor} /> },
              {
                label: "موضوع",
                value: entry.subject ? (
                  <>
                    <AuditSubjectLink subject={entry.subject} />
                    <span className="mt-0.5 block text-[11.5px] text-muted-foreground">
                      {AUDIT_SUBJECT_LABELS[entry.subject.type] ?? entry.subject.type} · شناسه داخلی <Ltr>{entry.subject.id}</Ltr>
                    </span>
                  </>
                ) : (
                  "—"
                ),
              },
              { label: "کد عملیات", value: <Ltr className="font-mono text-[12px]">{entry.action}</Ltr> },
              { label: "آی‌پی", value: entry.ipAddress ? <Ltr>{entry.ipAddress}</Ltr> : "—" },
              { label: "دستگاه", value: describeAgent(entry.userAgent) },
              {
                label: "درخواست",
                value: entry.route ? (
                  <Ltr className="font-mono text-[11.5px] break-all">
                    {entry.httpMethod} {entry.route}
                  </Ltr>
                ) : (
                  "—"
                ),
              },
            ]}
          />
        </Panel>
      </div>
    </>
  );
}
