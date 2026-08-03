import { cn } from "@/lib/utils";

interface MobileShellProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileShell({ children, className }: MobileShellProps) {
  return (
    <div className="flex h-dvh items-center justify-center overflow-hidden bg-[var(--outer-bg)] p-0 sm:p-4">
      <div
        className={cn(
          "relative flex h-dvh min-h-0 w-full max-w-[430px] flex-col overflow-hidden bg-background shadow-shell",
          "sm:h-[calc(100dvh-2rem)] sm:rounded-[2rem] sm:border sm:border-border/60",
          className,
        )}
      >
        <StatusBarMock />
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}

function StatusBarMock() {
  const now = new Date();
  const time = new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);

  return (
    <div className="hidden shrink-0 items-center justify-between px-6 pt-3 pb-1 text-[11px] font-medium text-muted-foreground sm:flex">
      <span>{time}</span>
      <div className="flex items-center gap-1">
        <span className="size-1 rounded-full bg-muted-foreground/60" />
        <span className="size-1 rounded-full bg-muted-foreground/60" />
        <span className="size-1 rounded-full bg-muted-foreground/60" />
        <span className="mr-1 h-2.5 w-5 rounded-sm border border-muted-foreground/40" />
      </div>
    </div>
  );
}
