import { cn } from "@/lib/utils";

/** The console's one container: a white sheet on the sage canvas. */
export function Panel({
  children,
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      className={cn("rounded-2xl border border-border bg-card text-card-foreground shadow-[var(--a-shadow-raise)]", className)}
      {...props}
    >
      {children}
    </section>
  );
}

export function PanelHeader({
  action,
  className,
  description,
  title,
}: {
  action?: React.ReactNode;
  className?: string;
  description?: React.ReactNode;
  title: React.ReactNode;
}) {
  return (
    <header className={cn("flex items-start justify-between gap-3 px-5 pt-4 pb-3", className)}>
      <div className="min-w-0">
        <h2 className="text-[15px] font-bold text-foreground">{title}</h2>
        {description ? <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </header>
  );
}

export function EmptyState({
  action,
  className,
  description,
  icon,
  title,
}: {
  action?: React.ReactNode;
  className?: string;
  description?: string;
  icon?: React.ReactNode;
  title: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 px-6 py-12 text-center", className)}>
      {icon ? (
        <div className="mb-1 flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-5">
          {icon}
        </div>
      ) : null}
      <p className="text-sm font-bold text-foreground">{title}</p>
      {description ? <p className="max-w-sm text-xs leading-5 text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

/** Label/value pairs, e.g. account details. */
export function DescriptionList({
  className,
  items,
}: {
  className?: string;
  items: Array<{ label: string; value: React.ReactNode; wide?: boolean }>;
}) {
  return (
    <dl className={cn("grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2", className)}>
      {items.map((item) => (
        <div className={cn("min-w-0", item.wide && "sm:col-span-2")} key={item.label}>
          <dt className="text-[11.5px] font-medium text-muted-foreground">{item.label}</dt>
          <dd className="mt-1 text-[13.5px] font-medium break-words text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
