"use client";

import {
  Images,
  LoaderCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <section className="mb-8">
      <div className="mb-3 flex items-end justify-between gap-3 px-0.5">
        <div>
          <h2 className="text-base font-bold text-foreground">گالری پروفایل عمومی</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            تصاویر نمونه‌کار برای نمایش در پروفایل عمومی شما
          </p>
        </div>
        <span className="rounded-full bg-primary/8 px-2.5 py-1 text-[10px] font-semibold text-primary tabular-nums">
          {toPersianDigits(gallery.length)}/{toPersianDigits(maxImages)}
        </span>
      </div>

      <Card className="card-elevated overflow-hidden rounded-2xl border-border/70">
        <CardContent className="space-y-4 p-4">
          {loading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              در حال بارگذاری…
            </p>
          ) : gallery.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/30 px-4 py-8 text-center">
              <Images className="mb-2 size-8 text-primary/60" strokeWidth={1.5} />
              <p className="text-sm font-semibold text-foreground">گالری خالی است</p>
              <p className="mt-1 text-xs text-muted-foreground">
                با افزودن تصویر، پروفایل عمومی شما جذاب‌تر می‌شود
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {gallery.map((item) => (
                <div
                  key={item.imageId}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-border/60 bg-muted/40"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.caption || ""}
                    className="size-full object-cover"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute end-1.5 top-1.5 size-8 rounded-lg opacity-90 shadow-sm"
                    disabled={busyId === item.imageId}
                    onClick={() => void handleDelete(item.imageId)}
                    aria-label="حذف تصویر"
                  >
                    {busyId === item.imageId ? (
                      <LoaderCircle className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            className="h-11 w-full rounded-xl border-primary/20"
            disabled={!canUpload || uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            {canUpload ? "افزودن تصویر به گالری" : "ظرفیت گالری تکمیل است"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => void handleUpload(event)}
          />
        </CardContent>
      </Card>
    </section>
  );
}
