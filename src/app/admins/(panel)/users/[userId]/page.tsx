import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminForbidden } from "@/components/admin/shell/forbidden";
import { Breadcrumbs } from "@/components/admin/shell/page-header";
import { UserProfileHeader, UserTabsNav } from "@/components/admin/users/user-profile";
import {
  HistoryTab,
  LandsTab,
  NotificationsTab,
  OverviewTab,
  PaymentsTab,
  ProviderTab,
  RequestsTab,
  SessionsTab,
} from "@/components/admin/users/user-tabs";
import { ADMIN_PERMISSIONS, can } from "@/lib/admin/permissions";
import { getAdminPageSession } from "@/server/modules/admin/auth/admin-viewer";
import {
  USER_DETAIL_TABS,
  type UserDetailTab,
  UserParamsSchema,
  UserRequestsQuerySchema,
} from "@/server/modules/admin/users/users.schemas";
import {
  getAdminUserHeader,
  getProvinceOptions,
  getUserHistoryTab,
  getUserLandsTab,
  getUserNotificationsTab,
  getUserOverviewTab,
  getUserPaymentsTab,
  getUserProviderTab,
  getUserRequestsTab,
  getUserSessionsTab,
} from "@/server/modules/admin/users/users.service";

type Params = Promise<{ userId: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const parsed = UserParamsSchema.safeParse(await params);
  if (!parsed.success) return { title: "کاربر" };
  const result = await getAdminUserHeader(parsed.data.userId);
  return { title: result ? result.header.name : "کاربر پیدا نشد" };
}

export default async function AdminUserDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const session = await getAdminPageSession();
  if (!session || !can(session.viewer.access, ADMIN_PERMISSIONS.usersView)) {
    return <AdminForbidden section="کاربران" />;
  }

  const parsed = UserParamsSchema.safeParse(await params);
  if (!parsed.success) notFound();

  const [result, provinces] = await Promise.all([getAdminUserHeader(parsed.data.userId), getProvinceOptions()]);
  if (!result) notFound();

  const { header, internalId, phone } = result;
  const query = await searchParams;
  const requestedTab = first(query.tab) as UserDetailTab | undefined;
  let tab: UserDetailTab = requestedTab && USER_DETAIL_TABS.includes(requestedTab) ? requestedTab : "overview";
  if (tab === "provider" && !header.provider) tab = "overview";
  const now = new Date();

  let content: React.ReactNode;
  switch (tab) {
    case "lands":
      content = <LandsTab lands={await getUserLandsTab(internalId)} now={now} />;
      break;
    case "requests": {
      const requestQuery = UserRequestsQuerySchema.parse({ page: first(query.rpage), status: first(query.rstatus) });
      content = <RequestsTab data={await getUserRequestsTab(internalId, requestQuery)} header={header} />;
      break;
    }
    case "provider": {
      const provider = await getUserProviderTab(internalId);
      content = provider ? <ProviderTab now={now} provider={provider} userId={header.id} /> : null;
      break;
    }
    case "payments":
      content = <PaymentsTab payments={await getUserPaymentsTab(internalId)} />;
      break;
    case "sessions":
      content = <SessionsTab data={await getUserSessionsTab(internalId, phone)} now={now} userId={header.id} />;
      break;
    case "notifications":
      content = <NotificationsTab notifications={await getUserNotificationsTab(internalId)} now={now} phone={header.phone} />;
      break;
    case "history":
      content = <HistoryTab history={await getUserHistoryTab(internalId)} now={now} />;
      break;
    default: {
      const overview = await getUserOverviewTab(internalId);
      content = <OverviewTab activity={overview.activity} header={header} notes={overview.notes} now={now} />;
    }
  }

  return (
    <>
      <Breadcrumbs className="mb-4" items={[{ href: "/admins/users", label: "کاربران" }, { label: header.name }]} />
      <div className="grid gap-5">
        <UserProfileHeader
          header={header}
          now={now}
          provinces={provinces}
        />
        <UserTabsNav active={tab} header={header} />
        <div>{content}</div>
      </div>
    </>
  );
}
