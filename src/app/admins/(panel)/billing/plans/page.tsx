import type { Metadata } from "next";

import { AddPlanButton } from "@/components/admin/billing/plan-form-dialog";
import { PlansTable } from "@/components/admin/billing/plans-table";
import { AdminForbidden } from "@/components/admin/shell/forbidden";
import { PageHeader } from "@/components/admin/shell/page-header";
import { Panel } from "@/components/admin/ui/panel";
import { faNumber } from "@/lib/admin/format";
import { ADMIN_PERMISSIONS, can } from "@/lib/admin/permissions";
import { getAdminPageSession } from "@/server/modules/admin/auth/admin-viewer";
import { listAdminPlans } from "@/server/modules/admin/billing/billing.service";

export const metadata: Metadata = { title: "پلن‌های اشتراک" };

export default async function AdminPlansPage() {
  const session = await getAdminPageSession();
  if (!session || !can(session.viewer.access, ADMIN_PERMISSIONS.subscriptionsView)) {
    return <AdminForbidden section="پلن‌های اشتراک" />;
  }
  const plans = await listAdminPlans();
  const purchasable = plans.filter((plan) => plan.isActive).length;

  return (
    <>
      <PageHeader
        actions={<AddPlanButton />}
        breadcrumbs={[{ label: "اشتراک و پرداخت" }, { label: "پلن‌های اشتراک" }]}
        description={`${faNumber(purchasable)} پلن قابل خرید از ${faNumber(plans.length)}. ترتیب این فهرست همان ترتیب نمایش در صفحه خرید اشتراک خدمات‌دهندگان است.`}
        title="پلن‌های اشتراک"
      />
      <Panel className="overflow-hidden">
        <PlansTable items={plans} />
      </Panel>
    </>
  );
}
