import type { Metadata } from "next";

import { PAYMENT_PERIOD_LABELS, PAYMENT_TABS } from "@/components/admin/billing/billing-labels";
import { PaymentsFilterBar } from "@/components/admin/billing/payments-filter-bar";
import { PaymentsTable } from "@/components/admin/billing/payments-table";
import { AdminForbidden } from "@/components/admin/shell/forbidden";
import { PageHeader } from "@/components/admin/shell/page-header";
import { Panel } from "@/components/admin/ui/panel";
import { Pagination, PendingArea, StatusTabs, UsersListFrame } from "@/components/admin/users/users-list-controls";
import { formatToman } from "@/lib/admin/format";
import { ADMIN_PERMISSIONS, can } from "@/lib/admin/permissions";
import { cn } from "@/lib/utils";
import { getAdminPageSession } from "@/server/modules/admin/auth/admin-viewer";
import { PaymentsListQuerySchema } from "@/server/modules/admin/billing/billing.schemas";
import { listAdminPayments } from "@/server/modules/admin/billing/billing.service";

export const metadata: Metadata = { title: "پرداخت‌ها" };

function Stat({ label, tone, value }: { label: string; tone?: "warn" | "ok"; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-[var(--a-shadow-raise)]">
      <p className="text-[11.5px] font-medium text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-[17px] font-extrabold tabular-nums", tone === "warn" && "text-warn", tone === "ok" && "text-ok")}>{value}</p>
    </div>
  );
}

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getAdminPageSession();
  if (!session || !can(session.viewer.access, ADMIN_PERMISSIONS.paymentsView)) {
    return <AdminForbidden section="پرداخت‌ها" />;
  }

  const raw = await searchParams;
  const query = PaymentsListQuerySchema.parse(
    Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])),
  );
  const list = await listAdminPayments(query);
  const filtered = Boolean(query.q || query.period !== "all" || query.status !== "all");
  const periodLabel = PAYMENT_PERIOD_LABELS[query.period] ?? "";

  return (
    <UsersListFrame>
      <PageHeader
        breadcrumbs={[{ label: "اشتراک و پرداخت" }, { label: "پرداخت‌ها" }]}
        description="پرداخت‌های خرید اشتراک. برای ثبت بازپرداخت، پرداخت را باز کنید."
        title="پرداخت‌ها"
      />
      <div className="grid gap-4">
        <section aria-label={`خلاصه مالی — ${periodLabel}`} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Stat label={`دریافتی موفق (${periodLabel})`} value={formatToman(list.collectedToman)} />
          <Stat label="بازپرداخت‌شده" tone={list.refundedToman > 0 ? "warn" : undefined} value={formatToman(list.refundedToman)} />
          <Stat label="خالص" tone="ok" value={formatToman(list.collectedToman - list.refundedToman)} />
        </section>
        <StatusTabs counts={list.counts} current={query.status} label="وضعیت پرداخت" tabs={PAYMENT_TABS} />
        <Panel className="overflow-hidden">
          <div className="border-b border-line p-4">
            <PaymentsFilterBar query={{ period: query.period, q: query.q }} />
          </div>
          <PendingArea>
            <PaymentsTable filtered={filtered} items={list.items} />
            {list.total > 0 ? (
              <Pagination page={query.page} pageCount={list.pageCount} perPage={query.perPage} total={list.total} />
            ) : null}
          </PendingArea>
        </Panel>
      </div>
    </UsersListFrame>
  );
}
