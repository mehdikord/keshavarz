import { ConsumerDock } from "@/components/consumer-panel/consumer-dock";
import { AuthGuard } from "@/components/shared/auth-guard";

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-0 flex-1 flex-col">
        {children}
        <ConsumerDock />
      </div>
    </AuthGuard>
  );
}
