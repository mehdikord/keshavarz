import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { cn } from "@/lib/utils";

export function PageHeader({
  actions,
  breadcrumbs,
  className,
  description,
  title,
}: {
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ href?: string; label: string }>;
  className?: string;
  description?: React.ReactNode;
  title: React.ReactNode;
}) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        {breadcrumbs?.length ? <Breadcrumbs className="mb-2" items={breadcrumbs} /> : null}
        <h1 className="text-[22px] leading-tight font-extrabold tracking-tight text-foreground sm:text-2xl">{title}</h1>
        {description ? <div className="mt-1.5 max-w-2xl text-[13px] leading-6 text-muted-foreground">{description}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Breadcrumbs({
  className,
  items,
}: {
  className?: string;
  items: Array<{ href?: string; label: string }>;
}) {
  return (
    <nav aria-label="مسیر" className={className}>
      <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        {items.map((crumb, index) => (
          <li className="flex items-center gap-1" key={`${crumb.label}-${index}`}>
            {crumb.href ? (
              <Link
                className="rounded hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                href={crumb.href}
              >
                {crumb.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-foreground/80">
                {crumb.label}
              </span>
            )}
            {index < items.length - 1 ? <ChevronLeft className="size-3.5 opacity-60" /> : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}
