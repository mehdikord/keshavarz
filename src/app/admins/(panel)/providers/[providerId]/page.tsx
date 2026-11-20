import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GrantSubscriptionButton } from "@/components/admin/billing/grant-subscription-dialog";
import { GalleryPanel } from "@/components/admin/providers/gallery-panel";
import {
  PROVIDER_DETAIL_TABS,
  type ProviderDetailTab,
  ProviderHeader,
  ProviderOverview,
  ProviderSubscriptions,
  ProviderTabsNav,
  RecentRequests,
} from "@/components/admin/providers/provider-detail";
import { ServicesManager } from "@/components/admin/providers/services-manager";
import { WorkAreaEditor } from "@/components/admin/providers/work-area-editor";
import { AdminForbidden } from "@/components/admin/shell/forbidden";
import { Breadcrumbs } from "@/components/admin/shell/page-header";
import { ADMIN_PERMISSIONS, can } from "@/lib/admin/permissions";
import { getAdminPageSession } from "@/server/modules/admin/auth/admin-viewer";
import { getPlanOptions } from "@/server/modules/admin/billing/billing.service";
import { ProviderParamsSchema } from "@/server/modules/admin/providers/providers-admin.schemas";
import { getAdminProviderDetail } from "@/server/modules/admin/providers/providers-admin.service";

type Params = Promise<{ providerId: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const parsed = ProviderParamsSchema.safeParse(await params);
  if (!parsed.success) return { title: "خدمات‌دهنده" };
  const detail = await getAdminProviderDetail(parsed.data.providerId);
  return { title: detail ? detail.name : "خدمات‌دهنده پیدا نشد" };
}

export default async function AdminProviderDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const session = await getAdminPageSession();
  if (!session || !can(session.viewer.access, ADMIN_PERMISSIONS.providersView)) {
    return <AdminForbidden section="خدمات‌دهندگان" />;
  }

  const parsed = ProviderParamsSchema.safeParse(await params);
  if (!parsed.success) notFound();
  const detail = await getAdminProviderDetail(parsed.data.providerId);
  if (!detail) notFound();

  const raw = (await searchParams).tab;
  const requested = (Array.isArray(raw) ? raw[0] : raw) as ProviderDetailTab | undefined;
  const tab: ProviderDetailTab = requested && PROVIDER_DETAIL_TABS.includes(requested) ? requested : "overview";
  const now = new Date();

  let content: React.ReactNode;
  switch (tab) {
    case "services":
      content = <ServicesManager catalog={detail.serviceOptions} providerId={detail.id} services={detail.services} />;
      break;
    case "area":
      content = (
        <WorkAreaEditor
          id={detail.id}
          latitude={detail.workArea.latitude}
          longitude={detail.workArea.longitude}
          radiusKm={detail.workArea.radiusKm}
        />
      );
      break;
    case "subscriptions": {
      const plans = can(session.viewer.access, ADMIN_PERMISSIONS.subscriptionsGrant) ? await getPlanOptions() : [];
      content = (
        <ProviderSubscriptions
          detail={detail}
          grant={
            plans.length ? (
              <GrantSubscriptionButton
                label={detail.subscription ? "تمدید با اعطای اشتراک" : "اعطای اشتراک"}
                plans={plans}
                provider={{
                  activePlan: detail.subscription?.planName ?? null,
                  activeUntil: detail.subscription?.endsAt ?? null,
                  id: detail.id,
                  image: detail.image,
                  name: detail.name,
                  phone: detail.phone,
                }}
              />
            ) : null
          }
        />
      );
      break;
    }
    case "requests":
      content = <RecentRequests detail={detail} now={now} />;
      break;
    case "gallery":
      content = <GalleryPanel images={detail.gallery} providerId={detail.id} />;
      break;
    default:
      content = <ProviderOverview detail={detail} now={now} />;
  }

  return (
    <>
      <Breadcrumbs className="mb-4" items={[{ href: "/admins/providers", label: "خدمات‌دهندگان" }, { label: detail.name }]} />
      <div className="grid gap-5">
        <ProviderHeader detail={detail} now={now} />
        <ProviderTabsNav active={tab} detail={detail} />
        {/* key: a saved edit refreshes the page; remount editors so they start from saved values. */}
        <div key={`${tab}-${detail.workArea.latitude}-${detail.workArea.longitude}-${detail.workArea.radiusKm}`}>{content}</div>
      </div>
    </>
  );
}
