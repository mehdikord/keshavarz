"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, LoaderCircle, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";

import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/** Output size; a square JPEG this size stays far below the 5 MB server cap. */
const OUTPUT_SIZE = 640;
const MAX_ZOOM = 4;
const JPEG_QUALITY = 0.9;

interface ImageCropperSheetProps {
  /** Object URL of the picked file; null closes the sheet. */
  src: string | null;
  saving: boolean;
  onCancel: () => void;
  onConfirm: (file: File) => void;
}

interface View {
  zoom: number;
  /** Offset of the image centre from the frame centre, in frame pixels. */
  x: number;
  y: number;
}

const INITIAL_VIEW: View = { zoom: 1, x: 0, y: 0 };

/**
 * Square (1:1, locked) cropper: drag to move, pinch or slider to zoom. The image
 * always covers the frame, so the crop never contains empty corners.
 */
export function ImageCropperSheet({ src, saving, onCancel, onConfirm }: ImageCropperSheetProps) {
  return (
    <Sheet open={src !== null} onOpenChange={(open) => !open && !saving && onCancel()}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="inset-x-0 mx-auto flex max-h-[96dvh] max-w-[430px] flex-col gap-0 rounded-t-[30px] border-0 bg-[#0b1f16] p-0 text-white"
      >
        <div className="flex items-center justify-between px-5 pb-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            aria-label="انصراف"
            className="flex size-10 items-center justify-center rounded-full bg-white/10 transition active:scale-90 disabled:opacity-50"
          >
            <X className="size-5" />
          </button>
          <div className="text-center">
            <SheetTitle className="text-[15px] font-black text-white">برش تصویر پروفایل</SheetTitle>
            <SheetDescription className="text-[11px] text-white/60">بکشید و بزرگ‌نمایی کنید</SheetDescription>
          </div>
          <span className="size-10" aria-hidden />
        </div>
        {src ? <CropArea key={src} src={src} saving={saving} onConfirm={onConfirm} /> : null}
      </SheetContent>
    </Sheet>
  );
}

function CropArea({ src, saving, onConfirm }: { src: string; saving: boolean; onConfirm: (file: File) => void }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ view: View; distance: number; mid: { x: number; y: number } } | null>(null);

  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [frameSize, setFrameSize] = useState(300);
  const [view, setView] = useState<View>(INITIAL_VIEW);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      imageRef.current = image;
      setNatural({ w: image.naturalWidth, h: image.naturalHeight });
    };
    image.src = src;
  }, [src]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setFrameSize(entry.contentRect.width);
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  // Scale at zoom 1: the shorter side exactly fills the frame.
  const baseScale = natural ? frameSize / Math.min(natural.w, natural.h) : 1;

  const clamp = useCallback(
    (next: View): View => {
      if (!natural) return next;
      const zoom = Math.min(MAX_ZOOM, Math.max(1, next.zoom));
      const w = natural.w * baseScale * zoom;
      const h = natural.h * baseScale * zoom;
      const maxX = (w - frameSize) / 2;
      const maxY = (h - frameSize) / 2;
      return {
        zoom,
        x: Math.min(maxX, Math.max(-maxX, next.x)),
        y: Math.min(maxY, Math.max(-maxY, next.y)),
      };
    },
    [natural, baseScale, frameSize],
  );

  const zoomTo = (zoom: number) => {
    // Keep the frame centre fixed while zooming.
    setView((current) => {
      const ratio = Math.min(MAX_ZOOM, Math.max(1, zoom)) / current.zoom;
      return clamp({ zoom, x: current.x * ratio, y: current.y * ratio });
    });
  };

  const onPointerDown = (event: React.PointerEvent) => {
    (event.target as Element).setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = [...pointers.current.values()];
    const [a, b] = points;
    gesture.current = {
      view,
      distance: a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0,
      mid: a && b ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } : { x: event.clientX, y: event.clientY },
    };
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (!pointers.current.has(event.pointerId) || !gesture.current) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = [...pointers.current.values()];
    const start = gesture.current;
    const [a, b] = points;

    if (a && b && start.distance > 0) {
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const zoom = start.view.zoom * (Math.hypot(a.x - b.x, a.y - b.y) / start.distance);
      const ratio = Math.min(MAX_ZOOM, Math.max(1, zoom)) / start.view.zoom;
      setView(
        clamp({
          zoom,
          x: start.view.x * ratio + (mid.x - start.mid.x),
          y: start.view.y * ratio + (mid.y - start.mid.y),
        }),
      );
    } else if (a) {
      setView(clamp({ ...start.view, x: start.view.x + (a.x - start.mid.x), y: start.view.y + (a.y - start.mid.y) }));
    }
  };

  const onPointerUp = (event: React.PointerEvent) => {
    pointers.current.delete(event.pointerId);
    const [remaining] = [...pointers.current.values()];
    gesture.current = remaining ? { view, distance: 0, mid: remaining } : null;
  };

  const onWheel = (event: React.WheelEvent) => zoomTo(view.zoom * (event.deltaY < 0 ? 1.08 : 1 / 1.08));

  const handleConfirm = async () => {
    const image = imageRef.current;
    if (!image || !natural) return;
    setExporting(true);

    const scale = baseScale * view.zoom;
    // Frame's top-left corner in source-image pixels.
    const sx = (natural.w * scale) / 2 - view.x - frameSize / 2;
    const sy = (natural.h * scale) / 2 - view.y - frameSize / 2;
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const context = canvas.getContext("2d");
    if (!context) {
      setExporting(false);
      return;
    }
    context.imageSmoothingQuality = "high";
    context.drawImage(image, sx / scale, sy / scale, frameSize / scale, frameSize / scale, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    canvas.toBlob(
      (blob) => {
        setExporting(false);
        if (blob) onConfirm(new File([blob], "avatar.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      JPEG_QUALITY,
    );
  };

  const busy = saving || exporting;
  const displayW = natural ? natural.w * baseScale * view.zoom : 0;
  const displayH = natural ? natural.h * baseScale * view.zoom : 0;

  return (
    <>
      <div className="px-6 pb-2">
        <div
          ref={frameRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
          className="relative mx-auto aspect-square w-full max-w-[340px] cursor-grab touch-none select-none overflow-hidden rounded-[28px] bg-black active:cursor-grabbing"
        >
          {natural ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt=""
              draggable={false}
              className="pointer-events-none absolute left-1/2 top-1/2 max-w-none"
              style={{
                width: displayW,
                height: displayH,
                transform: `translate(calc(-50% + ${view.x}px), calc(-50% + ${view.y}px))`,
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <LoaderCircle className="size-7 animate-spin text-white/60" />
            </div>
          )}
          {/* Circle preview of how the avatar will look; the saved image is the full square. */}
          <div aria-hidden className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_999px_rgba(11,31,22,0.55)]" />
          <div aria-hidden className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-white/80" />
          <div aria-hidden className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
            {Array.from({ length: 9 }, (_, i) => (
              <span key={i} className="border-[0.5px] border-white/15" />
            ))}
          </div>
        </div>
        <p className="mt-2 text-center text-[11px] text-white/55">نسبت ۱:۱ (مربع) · دایره پیش‌نمایش تصویر پروفایل است</p>
      </div>

      {/* LTR so "zoom out" sits at the slider's minimum end and "zoom in" at its maximum. */}
      <div dir="ltr" className="flex items-center gap-3 px-6 py-3">
        <button
          type="button"
          onClick={() => zoomTo(view.zoom / 1.25)}
          aria-label="کوچک‌نمایی"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10"
        >
          <ZoomOut className="size-5" />
        </button>
        <input
          type="range"
          min={1}
          max={MAX_ZOOM}
          step={0.01}
          value={view.zoom}
          onChange={(event) => zoomTo(Number(event.target.value))}
          aria-label="میزان بزرگ‌نمایی"
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/15 accent-[#95d5b2]"
        />
        <button
          type="button"
          onClick={() => zoomTo(view.zoom * 1.25)}
          aria-label="بزرگ‌نمایی"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10"
        >
          <ZoomIn className="size-5" />
        </button>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-2 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2">
        <button
          type="button"
          onClick={() => setView(INITIAL_VIEW)}
          disabled={busy}
          className="flex h-13 items-center gap-1.5 rounded-2xl bg-white/10 px-4 py-3.5 text-[13px] font-bold disabled:opacity-50"
        >
          <RotateCcw className="size-4" />
          بازنشانی
        </button>
        <button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={busy || !natural}
          className={cn(
            "flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#52b788_0%,#2d6a4f_100%)] py-3.5 text-[14px] font-black shadow-[0_14px_28px_-12px_rgba(82,183,136,0.7)] transition active:scale-[0.98] disabled:opacity-60",
          )}
        >
          {busy ? <LoaderCircle className="size-5 animate-spin" /> : <Check className="size-5" strokeWidth={2.75} />}
          {busy ? "در حال بارگذاری…" : "تأیید و ذخیره"}
        </button>
      </div>
    </>
  );
}
