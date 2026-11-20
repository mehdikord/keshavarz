"use client";

import { Sprout } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

/**
 * A catalog service's picture, shown wherever the service is named. Without an
 * image (or if it fails to load) the caller's own icon tile is shown instead,
 * so each screen keeps its look until the admin uploads a picture.
 */
export function ServiceThumb({
  className,
  fallback,
  image,
  name,
}: {
  className?: string;
  /** Rendered when there is no usable image (`null`: nothing); defaults to a small sprout tile. */
  fallback?: React.ReactNode;
  image: string | null | undefined;
  /** Used as alt text; pass "" when the name is already next to the image. */
  name?: string;
}) {
  const [failed, setFailed] = useState<string | null>(null);

  if (!image || failed === image) {
    if (fallback !== undefined) return fallback;
    return (
      <span
        aria-hidden
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#e7f1e2] text-[#3f7d45]",
          className,
        )}
      >
        <Sprout className="size-[55%] text-current" strokeWidth={1.9} />
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- admin uploads served from /storage or the object gateway
    <img
      alt={name ?? ""}
      className={cn(
        "size-7 shrink-0 rounded-lg bg-[#f3ece1] object-cover ring-1 ring-black/5",
        className,
      )}
      decoding="async"
      loading="lazy"
      onError={() => setFailed(image)}
      src={image}
    />
  );
}
