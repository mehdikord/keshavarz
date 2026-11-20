import { cn } from "@/lib/utils";

/** The Keshavarz sprout on its soil tile (static, for the console chrome). */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={cn("shrink-0", className)} viewBox="0 0 120 120">
      <rect fill="#1f5a40" height="120" rx="28" width="120" />
      <ellipse cx="60" cy="94" fill="rgba(216,243,220,0.25)" rx="30" ry="5" />
      <path d="M60 92 C 60 78 59 66 60 48" fill="none" stroke="#d8f3dc" strokeLinecap="round" strokeWidth="5" />
      <path d="M59.5 68 C 46 67 37 57 38 44 C 51 45 59.5 54 59.5 68Z" fill="#74c69d" />
      <path d="M60.5 58 C 74 57 83 46 82 32 C 69 34 60.5 43 60.5 58Z" fill="#e8b64a" />
    </svg>
  );
}
