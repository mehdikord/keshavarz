import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/shell/admin-shell";
import { ADMIN_SIDEBAR_COOKIE } from "@/components/admin/shell/constants";
import { getAdminPageSession } from "@/server/modules/admin/auth/admin-viewer";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminPageSession();

  if (!session) {
    const requested = (await headers()).get("x-admin-path");
    const next = requested && requested !== "/admins" ? `&next=${encodeURIComponent(requested)}` : "";
    redirect(`/admins/login?expired=1${next}`);
  }

  const { viewer } = session;
  const collapsed = (await cookies()).get(ADMIN_SIDEBAR_COOKIE)?.value === "1";

  return (
    <AdminShell
      initialCollapsed={collapsed}
      renderedAt={new Date().toISOString()}
      viewer={{
        access: viewer.access,
        id: viewer.id,
        image: viewer.image,
        isSuperAdmin: viewer.isSuperAdmin,
        lastLoginAt: viewer.lastLoginAt,
        name: viewer.name,
        phone: viewer.phone,
        roles: viewer.roles,
      }}
    >
      {children}
    </AdminShell>
  );
}
