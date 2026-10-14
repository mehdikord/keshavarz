"use client";

import Link from "next/link";
import { MotionConfig } from "framer-motion";
import { MapPin, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { LandCard } from "@/components/consumer-panel/land-card";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Button } from "@/components/ui/button";
import {
  deleteAppLand,
  fetchAppLands,
  mapAppLandToUi,
} from "@/lib/api/app-lands";
import { isApiClientError } from "@/lib/api/envelope";
import { toast } from "@/lib/toast";
import { formatAreaSqm, toPersianDigits } from "@/lib/utils/format";
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

  const totals = useMemo(() => {
    const totalArea = lands.reduce((sum, land) => sum + land.areaSqm, 0);
    return {
      count: lands.length,
      area: formatAreaSqm(totalArea),
    };
  }, [lands]);

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
              <Plus className="size-4" aria-hidden="true" />
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
        <MotionConfig reducedMotion="user">
          <div className="space-y-2.5 animate-fade-in">
            <p className="px-0.5 text-xs text-muted-foreground">
              {toPersianDigits(totals.count)} زمین · مجموع{" "}
              <span className="font-semibold text-foreground">
                {totals.area.primary} {totals.area.primaryUnit}
              </span>
            </p>

            {lands.map((land, index) => (
              <LandCard
                key={land.id}
                land={land}
                index={index}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        </MotionConfig>
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
