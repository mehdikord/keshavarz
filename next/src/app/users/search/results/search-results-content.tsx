"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowDownUp,
  ArrowRightFromLine,
  MapPin,
  SearchX,
  Users,
} from "lucide-react";

import {
  ProviderResultCard,
  type ProviderResultState,
} from "@/components/consumer-panel/provider-result-card";
import { SearchLoading } from "@/components/consumer-panel/search-loading";
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
import {
  addAppRequestProviders,
  createAppServiceRequest,
  fetchConsumerRequest,
  type AppConsumerRequestDetail,
} from "@/lib/api/app-requests";
import {
  fetchAppSearchProviders,
  uiSortToApiSort,
  type AppSearchContext,
  type AppSearchProvider,
} from "@/lib/api/app-search";
import { isApiClientError } from "@/lib/api/envelope";
import { toast } from "@/lib/toast";
import { toPersianDigits } from "@/lib/utils/format";
import { useAuthStore } from "@/stores/auth-store";

type SearchSortOption =
  | "price-asc"
  | "price-desc"
  | "distance-asc"
  | "distance-desc";

const SORT_OPTIONS: Array<{ value: SearchSortOption; label: string }> = [
  { value: "price-asc", label: "کمترین قیمت" },
  { value: "price-desc", label: "بیشترین قیمت" },
  { value: "distance-asc", label: "کمترین فاصله" },
  { value: "distance-desc", label: "بیشترین فاصله" },
];

function getApiProviderResultState(
  provider: AppSearchProvider,
  sentLocally: ReadonlySet<string>,
  requestDetail: AppConsumerRequestDetail | null,
): ProviderResultState {
  if (requestDetail) {
    if (
      requestDetail.status === "in_progress" ||
      requestDetail.status === "completed"
    ) {
      return requestDetail.assignedProviderId === provider.providerId
        ? "accepted"
        : "removed";
    }

    if (requestDetail.status === "cancelled") {
      return "removed";
    }

    const link = requestDetail.providers.find(
      (item) => item.providerId === provider.providerId,
    );

    if (link) {
      if (link.status === "sent") return "sent";
      if (link.status === "rejected") return "rejected";
      if (link.status === "removed") return "removed";
      if (link.status === "accepted") return "accepted";
    }
  }

  if (sentLocally.has(provider.providerId)) return "sent";
  if (provider.previousStatus === "sent") return "sent";
  if (provider.previousStatus === "rejected") return "rejected";

  return "idle";
}

export default function SearchResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchId = searchParams.get("searchId") ?? "";
  const initialRequestId = searchParams.get("requestId");
  const user = useAuthStore((state) => state.user);

  const [searchContext, setSearchContext] = useState<AppSearchContext | null>(
    null,
  );
  const [providers, setProviders] = useState<AppSearchProvider[]>([]);
  const [requestId, setRequestId] = useState<string | null>(initialRequestId);
  const [requestDetail, setRequestDetail] =
    useState<AppConsumerRequestDetail | null>(null);
  const [sentLocally, setSentLocally] = useState<Set<string>>(() => new Set());
  const [sort, setSort] = useState<SearchSortOption>("price-asc");
  const [loading, setLoading] = useState(() => Boolean(searchId));
  const [reloadKey, setReloadKey] = useState(0);

  const loadProviders = useCallback(
    (signal: AbortSignal) => {
      if (!searchId) return;

      void fetchAppSearchProviders({
        searchId,
        sort: uiSortToApiSort(sort),
        limit: 50,
        signal,
      })
        .then((result) => {
          if (signal.aborted) return;
          setSearchContext(result.search);
          setProviders(result.items);
        })
        .catch((cause: unknown) => {
          if (signal.aborted) return;
          setSearchContext(null);
          setProviders([]);
          toast.error(
            isApiClientError(cause)
              ? cause.message
              : "بارگذاری نتایج جستجو ناموفق بود",
          );
        })
        .finally(() => {
          if (!signal.aborted) setLoading(false);
        });
    },
    [searchId, sort],
  );

  useEffect(() => {
    if (!searchId) return;

    const controller = new AbortController();
    loadProviders(controller.signal);
    return () => controller.abort();
  }, [loadProviders, searchId, sort, reloadKey]);

  useEffect(() => {
    if (!requestId) return;

    const controller = new AbortController();

    void fetchConsumerRequest(requestId, controller.signal)
      .then((detail) => {
        if (controller.signal.aborted) return;
        setRequestDetail(detail);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setRequestDetail(null);
      });

    return () => controller.abort();
  }, [requestId, reloadKey]);

  const activeRequestDetail = requestId ? requestDetail : null;

  const visibleResults = useMemo(() => {
    return providers
      .map((provider) => ({
        provider,
        state: getApiProviderResultState(
          provider,
          sentLocally,
          activeRequestDetail,
        ),
      }))
      .filter((item) => item.state !== "removed");
  }, [providers, activeRequestDetail, sentLocally]);

  const handleSend = async (providerId: string) => {
    if (!searchId) return;

    try {
      if (!requestId) {
        const created = await createAppServiceRequest({
          searchId,
          providerIds: [providerId],
        });
        setRequestId(created.requestId);
      } else {
        await addAppRequestProviders({
          requestId,
          providerIds: [providerId],
        });
      }

      setSentLocally((current) => new Set(current).add(providerId));
      setReloadKey((key) => key + 1);
      toast.success("درخواست ارسال شد", "منتظر تأیید خدماتدهنده باشید");
    } catch (cause: unknown) {
      toast.error(
        isApiClientError(cause) ? cause.message : "ارسال درخواست ناموفق بود",
      );
    }
  };

  if (!user) return null;

  if (!searchId) {
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

  if (loading) {
    return (
      <PageContainer withDock>
        <PageHeader
          title="جستجوی خدمات"
          description="در حال پیدا کردن بهترین گزینهها برای شما"
          backHref="/users/search"
        />
        <SearchLoading />
      </PageContainer>
    );
  }

  if (!searchContext) {
    return (
      <PageContainer withDock>
        <PageHeader title="نتایج جستجو" backHref="/users/search" />
        <EmptyState
          icon={SearchX}
          title="خدماتدهندهای در محدوده یافت نشد"
          description="ممکن است خدمت دیگری انتخاب کنید یا بعداً دوباره جستجو کنید"
          action={{ label: "جستجوی مجدد", href: "/users/search" }}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer withDock>
      <PageHeader
        title="نتایج جستجو"
        description={`${searchContext.serviceName} · ${searchContext.landTitle}`}
        backHref="/users/search"
      />

      <Card className="mb-4 overflow-hidden border-primary/15 bg-gradient-to-l from-primary/[0.06] to-transparent animate-slide-up">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                <Users className="size-5" />
              </span>
              <div>
                <p className="text-lg font-black leading-5">
                  {toPersianDigits(visibleResults.length)} نتیجه
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  خدماتدهندگان در محدوده زمین شما
                </p>
              </div>
            </div>

            <Select
              value={sort}
              onValueChange={(value) => {
                setSort(value as SearchSortOption);
                setLoading(true);
                setReloadKey((key) => key + 1);
              }}
            >
              <SelectTrigger
                className="h-11 w-[180px] rounded-xl border-border/80 bg-surface shadow-sm"
                aria-label="مرتبسازی نتایج"
              >
                <ArrowDownUp className="size-4 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl text-right" dir="rtl">
                {SORT_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="justify-start rounded-lg text-right"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {searchContext.dates.length > 0 ? (
            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-primary">
              <MapPin className="size-3.5" />
              محدوده جستجو بر اساس «{searchContext.landTitle}» تنظیم شد
            </div>
          ) : null}
        </CardContent>
      </Card>

      {visibleResults.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="خدماتدهندهای در محدوده یافت نشد"
          description="ممکن است خدمت دیگری انتخاب کنید یا بعداً دوباره جستجو کنید"
          action={{ label: "جستجوی مجدد", href: "/users/search" }}
        />
      ) : (
        <div className="space-y-3">
          {visibleResults.map(({ provider, state }) => (
            <ProviderResultCard
              key={provider.providerId}
              providerId={provider.providerId}
              displayName={provider.name ?? "خدماتدهنده"}
              image={provider.image}
              distanceKm={provider.distanceKm}
              price={provider.priceToman}
              state={state}
              onSend={() => void handleSend(provider.providerId)}
            />
          ))}
        </div>
      )}

      {requestDetail?.status === "in_progress" && requestId ? (
        <Button
          className="mt-4 h-11 w-full rounded-xl"
          onClick={() => router.push(`/users/requests/${requestId}`)}
        >
          <ArrowRightFromLine className="size-4" />
          مشاهده درخواست تأییدشده
        </Button>
      ) : (
        <Button
          asChild
          variant="outline"
          className="mt-4 h-11 w-full rounded-xl"
        >
          <Link href="/users/requests">رفتن به درخواستها</Link>
        </Button>
      )}
    </PageContainer>
  );
}
