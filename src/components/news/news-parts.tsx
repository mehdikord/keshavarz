import { ExternalLink, Wheat } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * A story always opens on its own site, outside the app: a new tab in a
 * browser, the phone's browser from the installed app (the link is outside the
 * manifest scope). A real anchor, so popup blockers leave it alone.
 */
export function NewsLink({
  children,
  className,
  href,
}: {
  children: React.ReactNode;
  className?: string;
  href: string;
}) {
  return (
    <a
      className={cn("group outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      {children}
      <span className="sr-only">، در مرورگر باز می‌شود</span>
    </a>
  );
}

/** The «مشاهده خبر» button. A span: the whole item is already the link. */
export function ReadButton({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#e3efe4] px-3 text-[11.5px] font-extrabold whitespace-nowrap text-[#1f5c41] transition-colors group-hover:bg-[#1f5c41] group-hover:text-white group-active:bg-[#1f5c41] group-active:text-white",
        className,
      )}
    >
      مشاهده خبر
      <ExternalLink aria-hidden className="size-3.5" strokeWidth={2.2} />
    </span>
  );
}

export function ImportantBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center gap-1 rounded-full bg-[#f4a261] px-2 text-[10.5px] font-black whitespace-nowrap text-[#3d2914]",
        className,
      )}
    >
      <Wheat aria-hidden className="size-3" strokeWidth={2.2} />
      مهم
    </span>
  );
}

/** Two steady lines: the source, then importance and time (one line would wrap differently on every story). */
export function StoryMeta({ important, source, time }: { important: boolean; source: string; time: string }) {
  return (
    <span className="flex min-w-0 flex-col items-start gap-0.5 text-[11px] leading-5 text-muted-foreground">
      <span className="max-w-full truncate font-bold text-primary" dir="ltr">
        {source}
      </span>
      <span className="flex items-center gap-1.5 whitespace-nowrap">
        {important ? <ImportantBadge /> : null}
        {time}
      </span>
    </span>
  );
}

/**
 * One joint of the news stalk: a leaf for a story, a ripe ear of wheat for an
 * important one. Leaves alternate sides, like on a real stem.
 */
export function StalkNode({
  className,
  important,
  index,
}: {
  className?: string;
  important: boolean;
  index: number;
}) {
  if (important) {
    return (
      <span
        aria-hidden
        className={cn("flex size-6 items-center justify-center rounded-full bg-[#f4a261] text-[#3d2914]", className)}
      >
        <Wheat className="size-3.5" strokeWidth={2.2} />
      </span>
    );
  }
  return (
    <svg aria-hidden className={cn("size-6", index % 2 === 1 && "-scale-x-100", className)} viewBox="0 0 24 24">
      <path className="fill-[#74b892]" d="M12 17C12 10.5 15.5 6.5 22 5.5C22 12 18.5 16.5 12 17Z" />
      <path className="fill-none stroke-[#2d6a4f]" d="M12 17L18.5 9.5" strokeLinecap="round" strokeWidth="1" />
      <circle className="fill-[#2d6a4f]" cx="12" cy="17" r="2.5" />
    </svg>
  );
}
