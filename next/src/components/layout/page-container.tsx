import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  withDock?: boolean;
}

export function PageContainer({
  children,
  className,
  withDock = false,
}: PageContainerProps) {
  return (
    <main
      className={cn(
        "flex h-0 min-h-0 flex-1 touch-pan-y flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain px-4 pt-4 [&>*]:shrink-0",
        withDock ? "pb-32" : "pb-4",
        className,
      )}
    >
      {children}
    </main>
  );
}
