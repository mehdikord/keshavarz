"use client";

import Link from "next/link";
import {
  MapPin,
  Pencil,
  Plus,
  Ruler,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  deleteAppLand,
  fetchAppLands,
  mapAppLandToUi,
} from "@/lib/api/app-lands";
import { isApiClientError } from "@/lib/api/envelope";
import { toast } from "@/lib/toast";
import { useAuthStore } from "@/stores/auth-store";
import type { Land } from "@/types";

export default function ConsumerLandsPage() {
  const user = useAuthStore((state) => state.user);
  const [lands, setLands] = useState<Land[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadLands = useCallback(
    (signal: AbortSignal) => {
      if (!user) return;

      void fetchAppLands({ limit: 50, signal })
        .then((result) => {
          if (signal.aborted) return;
          setLands(result.items.map((land) => mapAppLandToUi(land, user.id)));
        })
        .catch((cause: unknown) => {
          if (signal.aborted) return;
          setLands([]);
          toast.error(
            isApiClientError(cause) ? cause.message : "بارگذاری زمین‌ها ناموفق بود",
          );
        })
        .finally(() => {
          if (!signal.aborted) setLoading(false);
        });
    },
    [user],
  );

  useEffect(() => {
    if (!user) return;

    const controller = new AbortController();
    loadLands(controller.signal);
    return () => controller.abort();
  }, [user, loadLands]);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await deleteAppLand(deleteTarget);
      setLands((current) => current.filter((land) => land.id !== deleteTarget));
      setDeleteTarget(null);
      toast.success("زمین حذف شد");
    } catch (cause: unknown) {
      toast.error(
        isApiClientError(cause) ? cause.message : "حذف زمین ناموفق بود",
      );
    } finally {
      setDeleting(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <PageContainer withDock>
        <PageHeader title="زمین‌های من" />
        <LoadingSpinner className="py-16" />
      </PageContainer>
    );
  }

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

      {lands.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="هنوز زمینی ثبت نکرده‌اید"
          description="برای جستجوی خدمات، ابتدا زمین خود را اضافه کنید"
          action={{ label: "افزودن زمین", href: "/users/lands/new" }}
        />
      ) : (
        <div className="space-y-3">
          {lands.map((land) => {
            const formattedArea = new Intl.NumberFormat("fa-IR").format(
              land.areaSqm,
            );

            return (
              <Card
                key={land.id}
                className="group overflow-hidden border-primary/15 bg-surface shadow-[0_6px_20px_rgba(45,106,79,0.07)] transition-all duration-200 hover:border-primary/25 hover:shadow-[0_10px_26px_rgba(45,106,79,0.11)]"
              >
                <CardContent className="p-0">
                  <div className="p-1">
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

                      <Badge className="shrink-0 border-primary/15 bg-primary/5 px-2 py-0.5 text-[10px] text-primary">
                        آماده
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
                    </div>

                    <div className="mt-2 flex items-center gap-2 border-t border-border/60 pt-2">
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-lg text-primary hover:bg-primary/10 hover:text-primary"
                      >
                        <Link
                          href={`/users/lands/${land.id}/edit`}
                          aria-label={`ویرایش ${land.title}`}
                        >
                          <Pencil className="size-3.5" />
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
        description="آیا از حذف این زمین مطمئن هستید؟"
        confirmLabel="حذف"
        variant="destructive"
        loading={deleting}
        onConfirm={() => void handleDelete()}
      />
    </PageContainer>
  );
}
