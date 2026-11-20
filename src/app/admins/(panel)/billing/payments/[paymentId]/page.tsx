import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { GATEWAY_LABELS } from "@/components/admin/billing/billing-labels";
import { JsonDetails } from "@/components/admin/billing/json-details";
import { PaymentStatusBadge } from "@/components/admin/billing/payments-table";
import { RefundButton } from "@/components/admin/billing/refund-button";
import { SubscriptionStatusBadge } from "@/components/admin/billing/subscriptions-table";
import { AdminForbidden } from "@/components/admin/shell/forbidden";
import { PageHeader } from "@/components/admin/shell/page-header";
import { Avatar } from "@/components/admin/ui/avatar";
import { Badge } from "@/components/admin/ui/badge";
import { CopyButton } from "@/components/admin/ui/copy-button";
import { Ltr, PhoneText } from "@/components/admin/ui/ltr";
import { DescriptionList, EmptyState, Panel, PanelHeader } from "@/components/admin/ui/panel";
import { formatDate, formatDateTime, formatToman } from "@/lib/admin/format";
import { REFUND_STATUS, SUBSCRIPTION_SOURCE } from "@/lib/admin/labels";
import { ADMIN_PERMISSIONS, can } from "@/lib/admin/permissions";
import { getAdminPageSession } from "@/server/modules/admin/auth/admin-viewer";
import { PaymentParamsSchema } from "@/server/modules/admin/billing/billing.schemas";
import { getAdminPayment } from "@/server/modules/admin/billing/billing.service";

export const metadata: Metadata = { title: "جزئیات پرداخت" };

function Code({ value }: { value: string | null }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="inline-flex max-w-full items-center gap-1">
      <Ltr className="truncate font-mono text-[12px]">{value}</Ltr>
      <CopyButton value={value} />
    </span>
  );
}

export default async function AdminPaymentPage({ params }: { params: Promise<{ paymentId: string }> }) {
  const session = await getAdminPageSession();
  if (!session || !can(session.viewer.access, ADMIN_PERMISSIONS.paymentsView)) {
    return <AdminForbidden section="پرداخت‌ها" />;
  }
  const parsed = PaymentParamsSchema.safeParse(await params);
  if (!parsed.success) notFound();
  const payment = await getAdminPayment(parsed.data.paymentId);
  if (!payment) notFound();

  return (
    <>
      <PageHeader
        actions={
          <RefundButton
            paymentId={payment.id}
            refundableToman={payment.refundableToman}
            subscription={payment.subscription ? { planName: payment.subscription.planName, status: payment.subscription.status } : null}
          />
        }
        breadcrumbs={[{ label: "اشتراک و پرداخت" }, { href: "/admins/billing/payments", label: "پرداخت‌ها" }, { label: "جزئیات" }]}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <PaymentStatusBadge status={payment.status} />
            {payment.subscription ? `بابت «${payment.subscription.planName}»` : null}
          </span>
        }
        title={formatToman(payment.amountToman)}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="grid content-start gap-4">
          <Panel>
            <PanelHeader title="اطلاعات پرداخت" />
            <div className="px-5 pb-5">
              <DescriptionList
                items={[
                  { label: "مبلغ", value: formatToman(payment.amountToman) },
                  { label: "بازپرداخت‌شده", value: payment.refundedToman > 0 ? formatToman(payment.refundedToman) : "—" },
                  { label: "شروع پرداخت", value: formatDateTime(payment.initiatedAt) },
                  { label: "پرداخت موفق", value: formatDateTime(payment.paidAt) },
                  { label: "درگاه", value: GATEWAY_LABELS[payment.gateway] ?? payment.gateway },
                  { label: "شناسه پرداخت", value: <Code value={payment.id} /> },
                  { label: "Authority", value: <Code value={payment.authority} /> },
                  { label: "کد پیگیری درگاه", value: <Code value={payment.transactionReference} /> },
                  ...(payment.failedAt || payment.failureMessage
                    ? [
                        { label: "زمان شکست", value: formatDateTime(payment.failedAt) },
                        {
                          label: "علت شکست",
                          value: (
                            <span className="text-danger">
                              {payment.failureMessage ?? "—"}
                              {payment.failureCode ? <Ltr className="ms-1 font-mono text-[11.5px] text-muted-foreground">({payment.failureCode})</Ltr> : null}
                            </span>
                          ),
                          wide: true,
                        },
                      ]
                    : []),
                  ...(payment.cancelledAt ? [{ label: "لغو", value: formatDateTime(payment.cancelledAt) }] : []),
                ]}
              />
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              description="درگاه فعلی بازگشت خودکار وجه ندارد؛ بازپرداخت‌ها دستی ثبت می‌شوند و مبلغ خارج از سامانه به کاربر برگردانده می‌شود."
              title="بازپرداخت‌ها"
            />
            {payment.refunds.length === 0 ? (
              <EmptyState className="py-8" title="بازپرداختی ثبت نشده است" />
            ) : (
              <ul className="divide-y divide-line border-t border-line">
                {payment.refunds.map((refund) => {
                  const meta = REFUND_STATUS[refund.status] ?? { label: refund.status, tone: "neutral" as const };
                  return (
                    <li className="flex flex-wrap items-start justify-between gap-3 px-5 py-3" key={refund.id}>
                      <div className="min-w-0">
                        <p className="font-bold tabular-nums">{formatToman(refund.amountToman)}</p>
                        <p className="mt-0.5 text-[12.5px] text-foreground/80">{refund.reason}</p>
                        <p className="mt-1 text-[11.5px] text-muted-foreground">
                          {formatDateTime(refund.createdAt)}
                          {refund.by ? ` · ${refund.by}` : ""}
                        </p>
                      </div>
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <JsonDetails label="پاسخ خام درگاه (gateway payload)" value={payment.gatewayPayload} />
        </div>

        <div className="grid content-start gap-4">
          <Panel>
            <PanelHeader title="پرداخت‌کننده" />
            <Link
              className="mx-5 mb-5 flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 hover:bg-raised focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              href={`/admins/users/${payment.user.id}`}
            >
              <Avatar image={payment.user.image} name={payment.user.name} seed={payment.user.id} size={38} />
              <span className="min-w-0">
                <span className="block truncate font-bold">{payment.user.name}</span>
                <PhoneText className="text-xs text-muted-foreground" phone={payment.user.phone} />
              </span>
            </Link>
          </Panel>
          {payment.subscription ? (
            <Panel>
              <PanelHeader
                action={<SubscriptionStatusBadge status={payment.subscription.status} />}
                title="اشتراک مرتبط"
              />
              <div className="px-5 pb-5">
                <DescriptionList
                  className="sm:grid-cols-1"
                  items={[
                    { label: "پلن", value: payment.subscription.planName },
                    { label: "منبع", value: SUBSCRIPTION_SOURCE[payment.subscription.source] ?? payment.subscription.source },
                    {
                      label: "دوره",
                      value: payment.subscription.startsAt
                        ? `${formatDate(payment.subscription.startsAt)} تا ${formatDate(payment.subscription.endsAt)}`
                        : "پس از پرداخت فعال می‌شود",
                    },
                  ]}
                />
                <Link
                  className="mt-4 inline-block text-[12.5px] font-semibold text-primary underline-offset-4 hover:underline"
                  href={`/admins/billing/subscriptions?q=${payment.subscription.id}`}
                >
                  مشاهده در فهرست اشتراک‌ها
                </Link>
              </div>
            </Panel>
          ) : null}
        </div>
      </div>
    </>
  );
}
