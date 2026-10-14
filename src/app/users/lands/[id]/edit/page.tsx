"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { LandForm } from "@/components/consumer-panel/land-form";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Card, CardContent } from "@/components/ui/card";
import {
  fetchAppLand,
  mapAppLandToUi,
  updateAppLand,
} from "@/lib/api/app-lands";
import { isApiClientError } from "@/lib/api/envelope";
import { toast } from "@/lib/toast";
import type { LandFormValues } from "@/lib/validators/land";
import { useAuthStore } from "@/stores/auth-store";
import type { Land } from "@/types";

export default function EditLandPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const [land, setLand] = useState<Land | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const controller = new AbortController();

    void fetchAppLand(params.id, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setLand(mapAppLandToUi(result, user.id));
        setNotFound(false);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setLand(null);
        setNotFound(true);
        if (!isApiClientError(cause) || cause.status !== 404) {
          toast.error(
            isApiClientError(cause)
              ? cause.message
              : "بارگذاری زمین ناموفق بود",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [params.id, user]);

  const handleSubmit = async (values: LandFormValues) => {
    if (!land) return;

    setSubmitting(true);
    try {
      await updateAppLand(land.id, {
        areaSquareMeters: String(values.areaSqm),
        latitude: String(values.location.lat),
        longitude: String(values.location.lng),
        title: values.title,
        description: values.description ?? null,
      });
      toast.success("زمین به‌روزرسانی شد");
      router.push("/users/lands");
    } catch (cause: unknown) {
      toast.error(
        isApiClientError(cause) ? cause.message : "به‌روزرسانی زمین ناموفق بود",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <PageContainer withDock>
        <PageHeader title="ویرایش زمین" backHref="/users/lands" />
        <LoadingSpinner className="py-16" />
      </PageContainer>
    );
  }

  if (notFound || !land) {
    return (
      <PageContainer withDock>
        <PageHeader title="ویرایش زمین" backHref="/users/lands" />
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            زمین یافت نشد
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer withDock>
      <PageHeader
        title="ویرایش زمین"
        description={land.title}
        backHref="/users/lands"
      />

      <Card className="card-elevated mb-4 border-border/70">
        <CardContent className="pt-6">
          <LandForm
            initialValues={land}
            submitLabel="ذخیره تغییرات"
            isSubmitting={submitting}
            onSubmit={(values) => void handleSubmit(values)}
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
