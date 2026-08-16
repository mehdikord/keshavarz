import { AdminAuthGate } from "@/components/admin-panel/auth/admin-auth-gate";
import { AdminShell } from "@/components/admin-panel";
import { AdminSessionProvider } from "@/hooks/admin/use-admin-session";

export default function AdminConsoleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AdminSessionProvider>
      <AdminAuthGate>
        <AdminShell>{children}</AdminShell>
      </AdminAuthGate>
    </AdminSessionProvider>
  );
}
