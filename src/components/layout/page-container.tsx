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
        "flex h-0 min-h-0 flex-1 touch-pan-y flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain px-4 pt-[calc(env(safe-area-inset-top,0px)+1rem)] [&>*]:shrink-0",
        withDock ? "pb-32" : "pb-4",
        className,
      )}
    >
      {children}
    </main>
  );
}
