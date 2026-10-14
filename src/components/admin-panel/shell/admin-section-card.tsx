import { cn } from "@/lib/utils";

interface AdminSectionCardProps {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}

/** Use only when a bordered panel improves interaction/structure (lists, forms). */
export function AdminSectionCard({
  children,
  className,
  padded = true,
}: AdminSectionCardProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-[var(--admin-border)] bg-[var(--admin-panel)] shadow-sm",
        padded && "p-4 sm:p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}
