import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  AuditPanel,
  CandidatesPanel,
  InvitationsPanel,
  RequestAside,
  RequestHeader,
  TimelinePanel,
} from "@/components/admin/requests/request-detail";
import { AdminForbidden } from "@/components/admin/shell/forbidden";
import { Breadcrumbs } from "@/components/admin/shell/page-header";
import { ADMIN_PERMISSIONS, can } from "@/lib/admin/permissions";
import { getAdminPageSession } from "@/server/modules/admin/auth/admin-viewer";
import { RequestParamsSchema } from "@/server/modules/admin/requests/requests-admin.schemas";
import { getAdminRequestDetail } from "@/server/modules/admin/requests/requests-admin.service";

type Params = Promise<{ requestId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const parsed = RequestParamsSchema.safeParse(await params);
  if (!parsed.success) return { title: "درخواست" };
  const detail = await getAdminRequestDetail(parsed.data.requestId);
  return { title: detail ? `درخواست ${detail.service.name}` : "درخواست پیدا نشد" };
}

export default async function AdminRequestDetailPage({ params }: { params: Params }) {
  const session = await getAdminPageSession();
  if (!session || !can(session.viewer.access, ADMIN_PERMISSIONS.requestsView)) {
    return <AdminForbidden section="درخواست‌های خدمت" />;
  }

  const parsed = RequestParamsSchema.safeParse(await params);
  if (!parsed.success) notFound();
  const detail = await getAdminRequestDetail(parsed.data.requestId);
  if (!detail) notFound();
  const now = new Date();

  return (
    <>
      <Breadcrumbs
        className="mb-4"
        items={[{ href: "/admins/requests", label: "درخواست‌های خدمت" }, { label: detail.service.name }]}
      />
      <div className="grid gap-5">
        <RequestHeader detail={detail} now={now} />
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid min-w-0 gap-5">
            <InvitationsPanel detail={detail} now={now} />
            <TimelinePanel detail={detail} now={now} />
            <CandidatesPanel detail={detail} />
            <AuditPanel detail={detail} now={now} />
          </div>
          {/* On narrow screens who/where/when comes before the history panels. */}
          <div className="order-first xl:order-none">
            <RequestAside detail={detail} />
          </div>
        </div>
      </div>
    </>
  );
}
