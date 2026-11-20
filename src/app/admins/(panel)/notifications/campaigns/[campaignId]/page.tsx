import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CampaignOverview, RecipientsTable } from "@/components/admin/notifications/campaigns";
import { SimplePager } from "@/components/admin/notifications/simple-pager";
import { AdminForbidden } from "@/components/admin/shell/forbidden";
import { PageHeader } from "@/components/admin/shell/page-header";
import { Panel, PanelHeader } from "@/components/admin/ui/panel";
import { faNumber } from "@/lib/admin/format";
import { ADMIN_PERMISSIONS, can } from "@/lib/admin/permissions";
import { cn } from "@/lib/utils";
import { getAdminPageSession } from "@/server/modules/admin/auth/admin-viewer";
import {
  CampaignParamsSchema,
  CampaignRecipientsQuerySchema,
} from "@/server/modules/admin/notifications/notifications-admin.schemas";
import { getCampaign } from "@/server/modules/admin/notifications/notifications-admin.service";

export const metadata: Metadata = { title: "جزئیات ارسال اعلان" };

const READ_FILTERS = [
  { key: "all", label: "همه" },
  { key: "unread", label: "نخوانده" },
  { key: "read", label: "خوانده‌شده" },
] as const;

export default async function AdminCampaignPage({
  params,
  searchParams,
}: {
  params: Promise<{ campaignId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getAdminPageSession();
  if (!session || !can(session.viewer.access, ADMIN_PERMISSIONS.notificationsView)) {
    return <AdminForbidden section="اعلان‌ها" />;
  }
  const parsed = CampaignParamsSchema.safeParse(await params);
  if (!parsed.success) notFound();
  const raw = await searchParams;
  const query = CampaignRecipientsQuerySchema.parse({
    page: Array.isArray(raw.page) ? raw.page[0] : raw.page,
    read: Array.isArray(raw.read) ? raw.read[0] : raw.read,
  });
  const campaign = await getCampaign(parsed.data.campaignId, query);
  if (!campaign) notFound();
  const base = `/admins/notifications/campaigns/${parsed.data.campaignId}`;

  return (
    <>
      <PageHeader
        breadcrumbs={[{ href: "/admins/notifications", label: "اعلان‌ها" }, { label: campaign.summary.title }]}
        title={campaign.summary.title}
      />
      <div className="grid gap-5">
        <CampaignOverview summary={campaign.summary} />
        <Panel className="overflow-hidden">
          <PanelHeader
            action={
              <div className="flex gap-1">
                {READ_FILTERS.map((filter) => (
                  <Link
                    aria-current={filter.key === query.read ? "page" : undefined}
                    className={cn(
                      "inline-flex h-8 items-center rounded-lg px-2.5 text-[12.5px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      filter.key === query.read ? "bg-soil text-soil-foreground" : "text-muted-foreground hover:bg-muted",
                    )}
                    href={filter.key === "all" ? base : `${base}?read=${filter.key}`}
                    key={filter.key}
                    scroll={false}
                  >
                    {filter.label}
                  </Link>
                ))}
              </div>
            }
            description={`${faNumber(campaign.recipients.total)} نفر در این فهرست`}
            title="گیرندگان"
          />
          <RecipientsTable now={new Date()} recipients={campaign.recipients} />
          <SimplePager page={campaign.recipients.page} pageCount={campaign.recipients.pageCount} total={campaign.recipients.total} />
        </Panel>
      </div>
    </>
  );
}
