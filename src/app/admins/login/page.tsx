import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminLoginScreen } from "@/components/admin/auth/login-screen";
import { safeAdminNext } from "@/lib/admin/next-path";
import { getAdminPageSession } from "@/server/modules/admin/auth/admin-viewer";

export const metadata: Metadata = { title: "ورود" };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = safeAdminNext(typeof params.next === "string" ? params.next : null);

  if (await getAdminPageSession()) {
    redirect(next);
  }

  return <AdminLoginScreen expired={params.expired === "1"} next={next} />;
}
