"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";

import { ProviderPublicProfile } from "@/components/consumer-panel/provider-public-profile";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { PageContainer } from "@/components/layout/page-container";

const RESULTS_PATH = "/users/search/results";

/** Same-app paths only; "//host" would be read as an external URL. */
function isInternalPath(value: string | null): value is string {
  return Boolean(value && value.startsWith("/") && !value.startsWith("//"));
}

/** Only search-result links get the "select this provider" action. */
function safeResultsHref(from: string | null): string | null {
  return isInternalPath(from) && from.startsWith(`${RESULTS_PATH}?`) ? from : null;
}

function ConsumerProviderProfileContent() {
  const params = useParams<{ providerId: string }>();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const resultsHref = safeResultsHref(from);
  const backHref = resultsHref ?? (isInternalPath(from) ? from : "/users/search");
  const selectHref = resultsHref
    ? `${resultsHref}&select=${encodeURIComponent(params.providerId)}`
    : null;

  return (
    <ProviderPublicProfile
      providerId={params.providerId}
      backHref={backHref}
      selectHref={selectHref}
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
