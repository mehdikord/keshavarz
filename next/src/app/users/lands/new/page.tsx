"use client";

import { useRouter } from "next/navigation";

import { LandForm } from "@/components/consumer-panel/land-form";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/lib/toast";
import { useAuthStore } from "@/stores/auth-store";
import { useConsumerStore } from "@/stores/consumer-store";

export default function NewLandPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const addLand = useConsumerStore((state) => state.addLand);

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
            onSubmit={(values) => {
              addLand(user.id, values);
              toast.success("زمین با موفقیت ثبت شد");
              router.push("/users/lands");
            }}
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
