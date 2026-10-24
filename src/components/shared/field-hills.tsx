import { cn } from "@/lib/utils";

/** Layered hills with furrow lines; the front layer melts into the page background. */
export function FieldHills({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 430 110"
      preserveAspectRatio="none"
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[110px] w-full",
        className,
      )}
    >
      <path
        d="M0 52 C 70 26 150 30 215 48 C 285 68 360 26 430 36 V110 H0Z"
        className="fill-[#2d6a4f]"
        fillOpacity="0.6"
      />
      <path
        d="M0 74 C 90 48 190 84 280 66 C 340 54 390 58 430 66 V110 H0Z"
        className="fill-[#40916c]"
        fillOpacity="0.55"
      />
      <g fill="none" className="stroke-[#d8f3dc]" strokeOpacity="0.16" strokeWidth="1.2">
        <path d="M0 84 C 90 60 190 94 280 76 C 340 64 390 68 430 76" />
        <path d="M0 92 C 90 70 190 102 280 86 C 340 75 390 78 430 85" />
        <path d="M0 100 C 90 80 190 108 280 94 C 340 85 390 87 430 93" />
      </g>
      <path
        d="M0 96 C 110 80 230 112 330 94 C 375 86 405 88 430 92 V110 H0Z"
        className="fill-background"
      />
    </svg>
  );
}
