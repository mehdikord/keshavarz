"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { LandForm } from "@/components/consumer-panel/land-form";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { createAppLand } from "@/lib/api/app-lands";
import { isApiClientError } from "@/lib/api/envelope";
import { toast } from "@/lib/toast";
import type { LandFormValues } from "@/lib/validators/land";
import { useAuthStore } from "@/stores/auth-store";

export default function NewLandPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: LandFormValues) => {
    setSubmitting(true);
    try {
      await createAppLand({
        areaSquareMeters: String(values.areaSqm),
        latitude: String(values.location.lat),
        longitude: String(values.location.lng),
        title: values.title,
        description: values.description ?? null,
      });
      toast.success("زمین با موفقیت ثبت شد");
      router.push("/users/lands");
    } catch (cause: unknown) {
      toast.error(
        isApiClientError(cause) ? cause.message : "ثبت زمین ناموفق بود",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <PageContainer withDock>
      <PageHeader
        title="افزودن زمین"
        description="اطلاعات زمین جدید را وارد کنید"
        backHref="/users/lands"
      />

      <Card className="card-elevated mb-4 border-border/70">
        <CardContent className="pt-6">
          <LandForm
            submitLabel="ثبت زمین"
            isSubmitting={submitting}
            onSubmit={(values) => void handleSubmit(values)}
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
