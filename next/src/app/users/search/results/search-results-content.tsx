"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { SearchX } from "lucide-react";

import {
  getProviderResultState,
  ProviderResultCard,
} from "@/components/consumer-panel/provider-result-card";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getServiceById } from "@/lib/mock/catalog";
import {
  searchProviders,
  sortSearchResults,
  type SearchSortOption,
} from "@/lib/search/search-providers";
import { toast } from "@/lib/toast";
import {
  getLandTitle,
  getServiceLabel,
} from "@/lib/utils/consumer-requests";
import { toPersianDigits } from "@/lib/utils/format";
import { useAuthStore } from "@/stores/auth-store";
import { useConsumerStore } from "@/stores/consumer-store";
import { useRequestStore } from "@/stores/request-store";

export default function SearchResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get("requestId") ?? "";
  const user = useAuthStore((state) => state.user);
  const lands = useConsumerStore((state) => state.lands);
  const request = useRequestStore((state) => state.getRequestById(requestId));
  const requestProviders = useRequestStore((state) => state.requestProviders);
  const sendToProvider = useRequestStore((state) => state.sendToProvider);
  const [sort, setSort] = useState<SearchSortOption>("price-asc");

  const land = useMemo(
    () => lands.find((item) => item.id === request?.landId),
    [lands, request?.landId],
  );

  const results = useMemo(() => {
    if (!request || !land || !user) return [];

    const raw = searchProviders({
      land,
      serviceId: request.serviceId,
      consumerId: user.id,
    });

    return sortSearchResults(raw, sort);
  }, [land, request, sort, user]);

  const visibleResults = useMemo(() => {
    if (!request) return [];

    return results.filter((result) => {
      const state = getProviderResultState(
        request,
        requestProviders,
        result.providerId,
      );
      return state !== "removed";
    });
  }, [request, requestProviders, results]);

  const handleSend = (providerId: string) => {
    if (!request) return;
    const error = sendToProvider(request.id, providerId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("درخواست ارسال شد", "منتظر تأیید خدمات‌دهنده باشید");
  };

  if (!user || !request || !land) {
    return (
      <PageContainer withDock>
        <PageHeader title="نتایج جستجو" backHref="/users/search" />
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            جستجو یافت نشد. دوباره تلاش کنید.
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const service = getServiceById(request.serviceId);

  return (
    <PageContainer withDock>
      <PageHeader
        title="نتایج جستجو"
        description={`${service?.name ?? getServiceLabel(request.serviceId)} · ${getLandTitle(request.landId, lands)}`}
        backHref="/users/search"
      />

      <Card className="mb-4 border-accent/20 bg-accent/5">
        <CardContent className="flex items-center justify-between gap-3 p-4">
          <div>
            <p className="text-sm font-semibold">
              {toPersianDigits(visibleResults.length)} نتیجه
            </p>
            <p className="text-xs text-muted-foreground">
              خدمات‌دهندگان در محدوده زمین شما
            </p>
          </div>
          <Select
            value={sort}
            onValueChange={(value) => setSort(value as SearchSortOption)}
          >
            <SelectTrigger className="h-10 w-[170px] rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price-asc">کمترین قیمت</SelectItem>
              <SelectItem value="price-desc">بیشترین قیمت</SelectItem>
              <SelectItem value="distance-asc">کمترین فاصله</SelectItem>
              <SelectItem value="distance-desc">بیشترین فاصله</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {visibleResults.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="خدمات‌دهنده‌ای در محدوده یافت نشد"
          description="ممکن است خدمت دیگری انتخاب کنید یا بعداً دوباره جستجو کنید"
          action={{ label: "جستجوی مجدد", href: "/users/search" }}
        />
      ) : (
        <div className="space-y-3">
          {visibleResults.map((result) => (
            <ProviderResultCard
              key={result.providerId}
              providerId={result.providerId}
              displayName={result.displayName}
              distanceKm={result.distanceKm}
              price={result.price}
              state={getProviderResultState(
                request,
                requestProviders,
                result.providerId,
              )}
              onSend={() => handleSend(result.providerId)}
            />
          ))}
        </div>
      )}

      {request.status === "in_progress" ? (
        <Button
          className="mt-4 h-11 w-full rounded-xl"
          onClick={() => router.push(`/users/requests/${request.id}`)}
        >
          مشاهده درخواست تأییدشده
        </Button>
      ) : (
        <Button asChild variant="outline" className="mt-4 h-11 w-full rounded-xl">
          <Link href="/users/requests">رفتن به درخواست‌ها</Link>
        </Button>
      )}
    </PageContainer>
  );
}
