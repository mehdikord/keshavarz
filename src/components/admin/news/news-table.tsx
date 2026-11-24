"use client";

import { ExternalLink, Newspaper, Pencil, SearchX, Star, Trash2 } from "lucide-react";
import { useState } from "react";

import { useCan } from "@/components/admin/shell/admin-context";
import { Badge } from "@/components/admin/ui/badge";
import { Button } from "@/components/admin/ui/button";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { EmptyState } from "@/components/admin/ui/panel";
import { Tooltip } from "@/components/admin/ui/tooltip";
import { useAdminAction } from "@/components/admin/ui/use-admin-action";
import { NewsImage } from "@/components/shared/news-image";
import { adminApi } from "@/lib/admin/api";
import { formatDateTime } from "@/lib/admin/format";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { cn } from "@/lib/utils";
import type { AdminNewsItem } from "@/server/modules/admin/news/news-admin.service";

import { type NewsDialogMode, NewsFormDialog } from "./news-form-dialog";

export function NewsTable({ filtered, items }: { filtered: boolean; items: AdminNewsItem[] }) {
  const canManage = useCan(ADMIN_PERMISSIONS.newsManage);
  const mutation = useAdminAction();
  const [dialog, setDialog] = useState<NewsDialogMode | null>(null);
  const [deleting, setDeleting] = useState<AdminNewsItem | null>(null);

  async function toggleImportant(item: AdminNewsItem) {
    await mutation.run(
      () => adminApi.patch(`/news/${item.id}`, { isImportant: !item.isImportant }),
      item.isImportant ? "خبر از حالت مهم خارج شد." : "خبر مهم شد.",
    );
  }

  async function confirmDelete() {
    if (!deleting) return;
    const done = await mutation.run(() => adminApi.delete(`/news/${deleting.id}`), "خبر حذف شد.");
    if (done) setDeleting(null);
  }

  return (
    <>
      {items.length === 0 ? (
        filtered ? (
          <EmptyState
            description="عبارت جستجو، فیلتر یا شماره صفحه را تغییر دهید."
            icon={<SearchX />}
            title="خبری برای نمایش پیدا نشد"
          />
        ) : (
          <EmptyState
            description="با «افزودن خبر» عنوان، تصویر و لینک اولین خبر را ثبت کنید."
            icon={<Newspaper />}
            title="هنوز خبری ثبت نشده است"
          />
        )
      ) : (
        <ul aria-label="فهرست اخبار" className="divide-y divide-line">
          {items.map((item) => (
            <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 hover:bg-raised/70 sm:px-5" key={item.id}>
              <NewsImage
                className="h-14 w-[76px] rounded-xl border border-line bg-card text-muted-foreground"
                src={item.image}
              />
              <div className="min-w-0 flex-1 basis-40">
                <p className="line-clamp-2 text-[13.5px] leading-6 font-bold break-words text-foreground">{item.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground">
                  {item.isImportant ? <Badge tone="wheat">مهم</Badge> : null}
                  <a
                    className="inline-flex min-w-0 items-center gap-1 rounded font-semibold text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    href={item.link}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <span className="truncate" dir="ltr">
                      {item.source}
                    </span>
                    <ExternalLink className="size-3 shrink-0" />
                  </a>
                  <span>{formatDateTime(item.createdAt)}</span>
                  {item.createdBy ? <span>ثبت: {item.createdBy}</span> : null}
                </div>
              </div>
              {canManage ? (
                <div className="ms-auto flex items-center gap-1">
                  <Tooltip content={item.isImportant ? "خارج کردن از مهم" : "مهم کردن"}>
                    <Button
                      aria-label={`مهم بودن «${item.title}»`}
                      aria-pressed={item.isImportant}
                      disabled={mutation.pending}
                      onClick={() => void toggleImportant(item)}
                      size="icon-sm"
                      variant="ghost"
                    >
                      <Star className={cn(item.isImportant && "fill-current text-wheat")} />
                    </Button>
                  </Tooltip>
                  <Tooltip content="ویرایش">
                    <Button
                      aria-label={`ویرایش «${item.title}»`}
                      onClick={() => setDialog({ item, kind: "edit" })}
                      size="icon-sm"
                      variant="ghost"
                    >
                      <Pencil />
                    </Button>
                  </Tooltip>
                  <Tooltip content="حذف">
                    <Button
                      aria-label={`حذف «${item.title}»`}
                      className="hover:text-danger"
                      onClick={() => setDeleting(item)}
                      size="icon-sm"
                      variant="ghost"
                    >
                      <Trash2 />
                    </Button>
                  </Tooltip>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <NewsFormDialog mode={dialog} onOpenChange={(open) => !open && setDialog(null)} />
      <ConfirmDialog
        confirm="حذف خبر"
        description={`«${deleting?.title ?? ""}» برای همیشه از پنل و اپلیکیشن حذف می‌شود.`}
        onConfirm={() => void confirmDelete()}
        onOpenChange={(open) => !open && setDeleting(null)}
        open={deleting !== null}
        pending={mutation.pending}
        title="حذف خبر"
      />
    </>
  );
}
