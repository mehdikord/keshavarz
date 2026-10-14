import { Sprout } from "lucide-react";

import { AdminLoginForm } from "@/components/admin-panel/auth/admin-login-form";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--admin-canvas)] px-4 py-10">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <Sprout className="size-6" />
          </span>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">ورود مدیران</h1>
            <p className="text-sm text-muted-foreground">
              با شماره موبایل و رمز عبور وارد پنل مدیریت شوید.
            </p>
          </div>
        </div>

        <AdminLoginForm nextPath={params.next ?? "/admins"} />
      </div>
    </div>
  );
}
