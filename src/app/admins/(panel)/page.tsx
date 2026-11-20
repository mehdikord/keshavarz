import type { Metadata } from "next";

import {
  AttentionList,
  ProvinceSpread,
  RecentRequests,
  RecentUsers,
  RequestPipeline,
  RevenueNote,
  TopServices,
  KpiStrip,
} from "@/components/admin/dashboard/dashboard-sections";
import { FieldHero } from "@/components/admin/dashboard/field-hero";
import { AdminForbidden } from "@/components/admin/shell/forbidden";
import { PageHeader } from "@/components/admin/shell/page-header";
import { ADMIN_PERMISSIONS, can } from "@/lib/admin/permissions";
import { getDashboardOverview } from "@/server/modules/admin/dashboard/dashboard.service";
import { getAdminPageSession } from "@/server/modules/admin/auth/admin-viewer";

export const metadata: Metadata = { title: "داشبورد" };

function greeting(now: Date): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Asia/Tehran" }).format(now),
  );
  if (hour >= 5 && hour < 12) return "صبح بخیر";
  if (hour >= 12 && hour < 17) return "روز بخیر";
  if (hour >= 17 && hour < 21) return "عصر بخیر";
  return "شب بخیر";
}

export default async function AdminDashboardPage() {
  const session = await getAdminPageSession();
  if (!session || !can(session.viewer.access, ADMIN_PERMISSIONS.dashboardView)) {
    return <AdminForbidden section="داشبورد" />;
  }

  const overview = await getDashboardOverview();
  const now = new Date(overview.generatedAt);
  const firstName = session.viewer.name.split(" ")[0];

  return (
    <>
      <PageHeader
        description={<RevenueNote overview={overview} />}
        title={`${greeting(now)}، ${firstName}`}
      />
      <FieldHero overview={overview} />
      <div className="mt-5">
        <KpiStrip overview={overview} />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <RequestPipeline overview={overview} />
        <AttentionList overview={overview} />
        <ProvinceSpread overview={overview} />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <RecentUsers now={now} overview={overview} />
        <RecentRequests now={now} overview={overview} />
        <TopServices overview={overview} />
      </div>
    </>
  );
}
