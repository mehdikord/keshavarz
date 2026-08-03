"use client";

import Link from "next/link";
import {
  ClipboardClock,
  LocateFixed,
  MapPin,
  Pencil,
  Plus,
  Ruler,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/lib/toast";
import { toPersianDigits } from "@/lib/utils/format";
import { useAuthStore } from "@/stores/auth-store";
import { useConsumerStore } from "@/stores/consumer-store";
import { useRequestStore } from "@/stores/request-store";

export default function ConsumerLandsPage() {
  const user = useAuthStore((state) => state.user);
  const lands = useConsumerStore((state) => state.lands);
  const deleteLand = useConsumerStore((state) => state.deleteLand);
  const requests = useRequestStore((state) => state.requests);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const userLands = useMemo(
    () => (user ? lands.filter((land) => land.userId === user.id) : []),
    [lands, user],
  );

  const activeRequestForLand = deleteTarget
    ? requests.some(
        (request) =>
          request.landId === deleteTarget &&
          (request.status === "pending_provider" ||
            request.status === "in_progress"),
      )
    : false;

  const handleDelete = () => {
    if (!deleteTarget) return;

    if (activeRequestForLand) {
      toast.error("این زمین در درخواست فعال استفاده شده و قابل حذف نیست");
      setDeleteTarget(null);
      return;
    }

    deleteLand(deleteTarget);
    setDeleteTarget(null);
    toast.success("زمین حذف شد");
  };

  return (
    <PageContainer withDock>
      <PageHeader
        title="زمین‌های من"
        description="مدیریت زمین‌های کشاورزی شما"
        action={
          <Button asChild size="sm" className="rounded-xl">
            <Link href="/users/lands/new">
              <Plus className="size-4" />
              افزودن
            </Link>
          </Button>
        }
      />

      {userLands.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="هنوز زمینی ثبت نکرده‌اید"
          description="برای جستجوی خدمات، ابتدا زمین خود را اضافه کنید"
          action={{ label: "افزودن زمین", href: "/users/lands/new" }}
        />
      ) : (
        <div className="space-y-3">
          {userLands.map((land) => {
            const activeRequests = requests.filter(
              (request) =>
                request.landId === land.id &&
                (request.status === "pending_provider" ||
                  request.status === "in_progress"),
            );
            const hasActiveRequest = activeRequests.length > 0;
            const formattedArea = new Intl.NumberFormat("fa-IR").format(
              land.areaSqm,
            );

            return (
              <Card
                key={land.id}
                className="group overflow-hidden border-primary/15 bg-surface shadow-[0_6px_20px_rgba(45,106,79,0.07)] transition-all duration-200 hover:border-primary/25 hover:shadow-[0_10px_26px_rgba(45,106,79,0.11)]"
              >
                <CardContent className="p-0">
                  <div className="p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h2 className="truncate text-sm font-bold text-foreground">
                            {land.title}
                          </h2>
                          {land.description ? (
                            <p className="mt-1 truncate text-[11px] text-muted-foreground">
                              {land.description}
                            </p>
                          ) : null}
                        </div>

                        <Badge
                          className={
                            hasActiveRequest
                              ? "shrink-0 border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] text-amber-800"
                              : "shrink-0 border-primary/15 bg-primary/5 px-2 py-0.5 text-[10px] text-primary"
                          }
                        >
                          {hasActiveRequest ? "فعال" : "آماده"}
                        </Badge>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Ruler className="size-3.5 text-primary" />
                          <strong className="font-semibold text-foreground">
                            {formattedArea}
                          </strong>
                          متر مربع
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <ClipboardClock className="size-3.5 text-accent" />
                          {toPersianDigits(activeRequests.length)} درخواست
                        </span>
                        <span className="inline-flex min-w-0 items-center gap-1.5" dir="ltr">
                          <LocateFixed className="size-3.5 shrink-0 text-primary" />
                          <span className="max-w-32 truncate">
                            {toPersianDigits(land.location.lat)}, {" "}
                            {toPersianDigits(land.location.lng)}
                          </span>
                        </span>
                      </div>

                      <div className="mt-3 flex items-center gap-2 border-t border-border/60 pt-3">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-8 flex-1 justify-center rounded-lg bg-primary/7 text-xs text-primary hover:bg-primary/12 hover:text-primary"
                        >
                          <Link href={`/users/lands/${land.id}/edit`}>
                            <Pencil className="size-3.5" />
                            ویرایش
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-lg text-destructive hover:bg-destructive/5 hover:text-destructive"
                          onClick={() => setDeleteTarget(land.id)}
                          aria-label={`حذف ${land.title}`}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="حذف زمین"
        description={
          activeRequestForLand
            ? "این زمین در درخواست فعال استفاده شده. ابتدا درخواست را لغو کنید."
            : "آیا از حذف این زمین مطمئن هستید؟"
        }
        confirmLabel="حذف"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </PageContainer>
  );
}
