"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";

import { ProviderPublicProfile } from "@/components/consumer-panel/provider-public-profile";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { PageContainer } from "@/components/layout/page-container";

function ConsumerProviderProfileContent() {
  const params = useParams<{ providerId: string }>();
  const searchParams = useSearchParams();
  const backHref = searchParams.get("from") || "/users/search";

  return (
    <ProviderPublicProfile
      providerId={params.providerId}
      backHref={backHref}
    />
  );
}

export default function ConsumerProviderProfilePage() {
  return (
    <Suspense
      fallback={
        <PageContainer withDock>
          <LoadingSpinner fullPage label="در حال بارگذاری پروفایل…" />
        </PageContainer>
      }
    >
      <ConsumerProviderProfileContent />
    </Suspense>
  );
}
