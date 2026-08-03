import { AuthGuard } from "@/components/shared/auth-guard";
import { ProviderDock } from "@/components/providers-panel/provider-dock";

export default function ProvidersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-0 flex-1 flex-col">
        {children}
        <ProviderDock />
      </div>
    </AuthGuard>
  );
}
