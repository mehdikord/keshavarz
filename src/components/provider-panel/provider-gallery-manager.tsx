"use client";

import {
  Images,
  LoaderCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  deleteAppProviderGalleryImage,
  fetchAppProviderGallery,
  uploadAppProviderGalleryImage,
  type AppProviderGalleryImage,
} from "@/lib/api/app-provider";
import { isApiClientError } from "@/lib/api/envelope";
import { toast } from "@/lib/toast";
import { toPersianDigits } from "@/lib/utils/format";

export function ProviderGalleryManager() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [gallery, setGallery] = useState<AppProviderGalleryImage[]>([]);
  const [maxImages, setMaxImages] = useState(12);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    void fetchAppProviderGallery(controller.signal)
      .then((result) => {
        if (cancelled) return;
        setGallery(result.gallery);
        setMaxImages(result.maxImages);
      })
      .catch((cause: unknown) => {
        if (cancelled || controller.signal.aborted) return;
        if (isApiClientError(cause) && cause.status === 404) return;
        toast.error(
          isApiClientError(cause)
            ? cause.message
            : "بارگذاری گالری ناموفق بود.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    try {
      const created = await uploadAppProviderGalleryImage({ file });
      setGallery((prev) => [...prev, created]);
      toast.success("تصویر به گالری اضافه شد");
    } catch (cause: unknown) {
      toast.error(
        isApiClientError(cause)
          ? cause.message
          : "بارگذاری تصویر ناموفق بود.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    setBusyId(imageId);
    try {
      await deleteAppProviderGalleryImage(imageId);
      setGallery((prev) => prev.filter((item) => item.imageId !== imageId));
      toast.success("تصویر حذف شد");
    } catch (cause: unknown) {
      toast.error(
        isApiClientError(cause) ? cause.message : "حذف تصویر ناموفق بود.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const canUpload = gallery.length < maxImages;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3 rounded-[22px] bg-surface px-4 py-3 ring-1 ring-border/60">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#fdefd6] text-[#b4661a]">
          <Images className="size-5" strokeWidth={1.9} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[14px] font-black text-foreground">نمونه‌کارها</h2>
          <p className="mt-0.5 text-[11.5px] leading-5 text-muted-foreground">
            عکس ادوات و کارهای انجام‌شده در پروفایل عمومی شما نمایش داده می‌شود.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-black tabular-nums text-primary">
          {toPersianDigits(gallery.length)}/{toPersianDigits(maxImages)}
        </span>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            disabled={!canUpload || uploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/[0.04] text-primary transition-colors hover:bg-primary/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? (
              <LoaderCircle className="size-6 animate-spin" />
            ) : (
              <Plus className="size-6" strokeWidth={2.25} />
            )}
            <span className="px-1 text-center text-[11px] font-bold leading-4">
              {uploading ? "در حال ارسال" : canUpload ? "افزودن عکس" : "ظرفیت تکمیل"}
            </span>
          </button>

          {gallery.map((item) => (
            <div
              key={item.imageId}
              className="group relative aspect-square overflow-hidden rounded-2xl bg-muted/40 ring-1 ring-border/60"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.caption || ""}
                className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/35 to-transparent" />
              <button
                type="button"
                className="absolute end-1.5 top-1.5 flex size-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-destructive disabled:opacity-60"
                disabled={busyId === item.imageId}
                onClick={() => void handleDelete(item.imageId)}
                aria-label="حذف تصویر"
              >
                {busyId === item.imageId ? (
                  <LoaderCircle className="size-3.5 animate-spin" />
                ) : (
                  <Trash2 className="size-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {!loading && gallery.length === 0 ? (
        <p className="text-center text-[11.5px] leading-5 text-muted-foreground">
          پروفایل‌های دارای نمونه‌کار اعتماد بیشتری از کشاورزان جلب می‌کنند.
        </p>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => void handleUpload(event)}
      />
    </section>
  );
}
