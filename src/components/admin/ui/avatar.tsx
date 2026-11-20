import { initials } from "@/lib/admin/format";
import { cn } from "@/lib/utils";

/** Hue picked from the name so the same person always gets the same colour. */
function hueFor(seed: string): number {
  let hash = 0;
  for (const character of seed) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  const hues = [140, 158, 96, 42, 28, 188, 205];
  return hues[hash % hues.length]!;
}

export function Avatar({
  className,
  image,
  name,
  seed,
  size = 36,
}: {
  className?: string;
  image?: string | null;
  name: string;
  seed?: string;
  size?: number;
}) {
  const hue = hueFor(seed ?? name);
  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold select-none",
        className,
      )}
      style={{
        background: `oklch(var(--a-avatar-bg-l, 0.9) 0.05 ${hue})`,
        color: `oklch(var(--a-avatar-fg-l, 0.36) 0.08 ${hue})`,
        fontSize: Math.max(10, Math.round(size * 0.36)),
        height: size,
        width: size,
      }}
    >
      {initials(name)}
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- user uploads are served from /storage, not the image optimizer
        <img alt="" className="absolute inset-0 size-full object-cover" src={image} />
      ) : null}
    </span>
  );
}
