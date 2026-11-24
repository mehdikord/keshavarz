"use client";

import { Newspaper } from "lucide-react";
import { useCallback, useState } from "react";

import { cn } from "@/lib/utils";

type Fit = "contain" | "cover";
type State = { status: "failed" } | { status: "loading" } | { fit: Fit; status: "ready" };

/**
 * A news picture is either a photo or a logo, and nothing says which: landscape
 * photos fill the frame, everything else (square, very wide, small, vector) is
 * shown whole so logos are never cropped.
 */
function fitFor(image: HTMLImageElement, src: string): Fit {
  const { naturalHeight: height, naturalWidth: width } = image;
  const extension = /\.([a-z]+)(?:[?#]|$)/i.exec(src)?.[1]?.toLowerCase() ?? "";
  if (extension === "svg" || !height || width < 480) return "contain";
  // Wide PNG/GIF files are mostly wordmarks; 1.91:1 share images are JPEG/WebP.
  const widest = extension === "png" || extension === "gif" ? 1.8 : 2.1;
  const ratio = width / height;
  return ratio >= 1.2 && ratio <= widest ? "cover" : "contain";
}

export function NewsImage({
  className,
  onFail,
  src,
}: {
  className?: string;
  onFail?: () => void;
  src: string | null;
}) {
  return (
    <span className={cn("relative block shrink-0 overflow-hidden", className)}>
      {/* Keyed, so a new address starts from a clean loading state. */}
      {src ? <Picture key={src} onFail={onFail} src={src} /> : <Placeholder />}
    </span>
  );
}

function Placeholder() {
  return (
    <span aria-hidden className="absolute inset-0 flex items-center justify-center opacity-45">
      <Newspaper className="size-[38%] max-h-14 max-w-14" strokeWidth={1.4} />
    </span>
  );
}

function Picture({ onFail, src }: { onFail?: () => void; src: string }) {
  const [state, setState] = useState<State>({ status: "loading" });

  // An image in server-rendered HTML may finish before React attaches onLoad.
  const inspect = useCallback(
    (image: HTMLImageElement | null) => {
      if (image?.complete && image.naturalWidth > 0) setState({ fit: fitFor(image, src), status: "ready" });
      // An SVG without intrinsic size also reports zero width; leave it to onLoad/onError.
      else if (image?.complete && !/\.svg(?:[?#]|$)/i.test(src)) setState({ status: "failed" });
    },
    [src],
  );

  if (state.status === "failed") return <Placeholder />;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- uploads and admin-entered addresses on any host
    <img
      alt=""
      className={cn(
        "absolute inset-0 size-full transition-opacity duration-300 motion-reduce:transition-none",
        state.status === "loading" ? "opacity-0" : "opacity-100",
        state.status === "ready" && state.fit === "cover" ? "object-cover" : "object-contain p-[9%]",
      )}
      decoding="async"
      loading="lazy"
      onError={() => {
        setState({ status: "failed" });
        onFail?.();
      }}
      onLoad={(event) => setState({ fit: fitFor(event.currentTarget, src), status: "ready" })}
      ref={inspect}
      // Many news sites refuse images requested with a foreign referrer.
      referrerPolicy="no-referrer"
      src={src}
    />
  );
}
