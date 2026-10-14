import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { AppMenuTrigger } from "@/components/layout/app-menu-trigger";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  action?: React.ReactNode;
  showMenu?: boolean;
  className?: string;
}

export function PageHeader({
  title,
  description,
  backHref,
  action,
  showMenu = true,
  className,
}: PageHeaderProps) {
  const headerAction = action ?? (showMenu ? <AppMenuTrigger /> : null);

  return (
    <header className={cn("mb-5 animate-fade-in", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          {backHref ? (
            <Link
              href={backHref}
              className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="بازگشت"
            >
              <ChevronRight className="size-5" strokeWidth={1.75} />
            </Link>
          ) : null}
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold leading-tight text-foreground">
              {title}
            </h1>
            {description ? (
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
      </div>
    </header>
  );
}
