import { FolderTree, Sprout } from "lucide-react";

import { cn } from "@/lib/utils";

/** Square thumbnail of a service or category image, with an icon tile when there is none. */
export function CatalogThumb({
  className,
  image,
  kind = "service",
  name,
  size = 44,
}: {
  className?: string;
  image: string | null;
  kind?: "category" | "service";
  name: string;
  size?: number;
}) {
  const Icon = kind === "category" ? FolderTree : Sprout;
  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-wheat-soft text-wheat-ink",
        className,
      )}
      style={{ height: size, width: size }}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- uploaded files are served from /storage or the object gateway
        <img alt={name} className="size-full object-cover" decoding="async" loading="lazy" src={image} />
      ) : (
        <Icon aria-hidden className="size-[45%]" />
      )}
    </span>
  );
}
