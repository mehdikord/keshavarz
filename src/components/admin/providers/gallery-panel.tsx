"use client";

import { ImageOff, Trash2 } from "lucide-react";
import { useState } from "react";

import { useCan } from "@/components/admin/shell/admin-context";
import { Button } from "@/components/admin/ui/button";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { EmptyState, Panel, PanelHeader } from "@/components/admin/ui/panel";
import { useAdminAction } from "@/components/admin/ui/use-admin-action";
import { adminApi } from "@/lib/admin/api";
import { faNumber, formatDate } from "@/lib/admin/format";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";

interface GalleryImage {
  caption: string | null;
  createdAt: string;
  id: string;
  url: string;
}

export function GalleryPanel({ images, providerId }: { images: GalleryImage[]; providerId: string }) {
  const canUpdate = useCan(ADMIN_PERMISSIONS.providersUpdate);
  const [deleting, setDeleting] = useState<GalleryImage | null>(null);
  const action = useAdminAction();

  return (
    <Panel className="overflow-hidden">
      <PanelHeader
        description="تصاویری که خدمات‌دهنده از ادوات و کارهایش در پروفایل عمومی گذاشته است. تصویر نامناسب را حذف کنید."
        title={`نمونه‌کارها (${faNumber(images.length)})`}
      />
      {images.length === 0 ? (
        <EmptyState className="border-t border-line" icon={<ImageOff />} title="تصویری بارگذاری نکرده است" />
      ) : (
        <ul className="grid grid-cols-2 gap-3 border-t border-line p-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image) => (
            <li className="group relative overflow-hidden rounded-xl border border-line bg-raised" key={image.id}>
              <a className="block aspect-square" href={image.url} rel="noopener noreferrer" target="_blank">
                {/* eslint-disable-next-line @next/next/no-img-element -- uploads served from /storage or the object gateway */}
                <img alt={image.caption ?? "نمونه‌کار"} className="size-full object-cover" loading="lazy" src={image.url} />
              </a>
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <p className="min-w-0 truncate text-[11.5px] text-muted-foreground">{image.caption || formatDate(image.createdAt)}</p>
                {canUpdate ? (
                  <Button aria-label="حذف تصویر" onClick={() => setDeleting(image)} size="icon-sm" variant="ghost">
                    <Trash2 className="text-danger" />
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        confirm="حذف تصویر"
        description="تصویر از پروفایل عمومی خدمات‌دهنده حذف می‌شود و قابل بازگشت نیست."
        onConfirm={() => {
          if (!deleting) return;
          void action
            .run(() => adminApi.delete(`/providers/${providerId}/gallery/${deleting.id}`), "تصویر حذف شد.")
            .then((ok) => ok && setDeleting(null));
        }}
        onOpenChange={(open) => !open && setDeleting(null)}
        open={deleting !== null}
        pending={action.pending}
        title="حذف تصویر نمونه‌کار"
      />
    </Panel>
  );
}
