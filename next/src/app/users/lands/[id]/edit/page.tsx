"use client";

import { useParams, useRouter } from "next/navigation";

import { LandForm } from "@/components/consumer-panel/land-form";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/lib/toast";
import { useAuthStore } from "@/stores/auth-store";
import { useConsumerStore } from "@/stores/consumer-store";

export default function EditLandPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const lands = useConsumerStore((state) => state.lands);
  const updateLand = useConsumerStore((state) => state.updateLand);

  const land = lands.find((item) => item.id === params.id);

  if (!user) return null;

  if (!land || land.userId !== user.id) {
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
            onSubmit={(values) => {
              updateLand(land.id, values);
              toast.success("زمین به‌روزرسانی شد");
              router.push("/users/lands");
            }}
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
