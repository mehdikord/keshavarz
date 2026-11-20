import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/admin/labels";

const TONES: Record<Tone, string> = {
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  neutral: "bg-muted text-muted-foreground",
  success: "bg-ok-soft text-ok",
  warning: "bg-warn-soft text-warn",
  wheat: "bg-wheat-soft text-wheat-ink",
};

const DOTS: Record<Tone, string> = {
  danger: "bg-danger",
  info: "bg-info",
  neutral: "bg-muted-foreground/60",
  success: "bg-ok",
  warning: "bg-warn",
  wheat: "bg-wheat",
};

export function Badge({
  children,
  className,
  dot = true,
  tone = "neutral",
}: {
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
  tone?: Tone;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[11.5px] font-semibold whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {dot ? <span aria-hidden className={cn("size-1.5 rounded-full", DOTS[tone])} /> : null}
      {children}
    </span>
  );
}

export function toneText(tone: Tone): string {
  return {
    danger: "text-danger",
    info: "text-info",
    neutral: "text-muted-foreground",
    success: "text-ok",
    warning: "text-warn",
    wheat: "text-wheat-ink",
  }[tone];
}

export function toneDot(tone: Tone): string {
  return DOTS[tone];
}
