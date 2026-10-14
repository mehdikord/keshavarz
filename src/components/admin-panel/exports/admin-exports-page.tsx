"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, FileDown, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";

import {
  AdminForbidden,
  AdminPageHeader,
  AdminSectionCard,
  AdminStatusBadge,
} from "@/components/admin-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminPermissions } from "@/hooks/admin/use-admin-permissions";
import { formatAdminDateTime } from "@/lib/admin/format";
import {
  createAdminExport,
  fetchAdminExport,
  type AdminExportDomain,
  type AdminExportJob,
} from "@/lib/api/admin-exports";
import { PAYMENT_STATUSES } from "@/lib/api/admin-payments";
import { isApiClientError } from "@/lib/api/envelope";
import { toPersianDigits } from "@/lib/utils/format";

const RECENT_KEY = "admin-export-recent-ids";

function readRecentIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

function pushRecentId(exportId: string) {
  const next = [exportId, ...readRecentIds().filter((id) => id !== exportId)].slice(
    0,
    8,
  );
  sessionStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

export function AdminExportsPage() {
  const { canAny } = useAdminPermissions();
  const searchParams = useSearchParams();
  const canExportPayments = canAny(["payments.export"]);
  const canExportReports = canAny(["reports.export"]);
  const canAccess = canExportPayments || canExportReports;

  const initialDomain =
    searchParams.get("domain") === "reports" ? "reports" : "payments";

  const [domain, setDomain] = useState<AdminExportDomain>(
    initialDomain === "reports" && canExportReports
      ? "reports"
      : canExportPayments
        ? "payments"
        : "reports",
  );
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [lookupId, setLookupId] = useState("");
  const [creating, setCreating] = useState(false);
  const [active, setActive] = useState<AdminExportJob | null>(null);
  const [recent, setRecent] = useState<string[]>(() =>
    typeof window === "undefined" ? [] : readRecentIds(),
  );

  useEffect(() => {
    if (!active?.exportId) return;
    if (active.status === "ready" || active.status === "failed") return;

    const timer = window.setInterval(() => {
      void fetchAdminExport(active.exportId)
        .then((job) => {
          setActive(job);
        })
        .catch((cause: unknown) => {
          toast.error(
            isApiClientError(cause)
              ? cause.message
              : "پیگیری وضعیت خروجی ناموفق بود.",
          );
        });
    }, 2000);

    return () => {
      window.clearInterval(timer);
    };
  }, [active?.exportId, active?.status]);

  const polling =
    Boolean(active?.exportId) &&
    active?.status !== "ready" &&
    active?.status !== "failed";

  const domainOptions = useMemo(() => {
    const options: AdminExportDomain[] = [];
    if (canExportPayments) options.push("payments");
    if (canExportReports) options.push("reports");
    return options;
  }, [canExportPayments, canExportReports]);

  async function onCreate() {
    setCreating(true);
    try {
      const job = await createAdminExport({
        domain,
        filters: {
          from: from.trim() || undefined,
          status:
            domain === "payments" && status !== "all"
              ? (status as (typeof PAYMENT_STATUSES)[number])
              : undefined,
          to: to.trim() || undefined,
        },
      });
      pushRecentId(job.exportId);
      setRecent(readRecentIds());
      setActive(job);
      toast.success("درخواست خروجی ثبت شد.");
    } catch (cause: unknown) {
      toast.error(
        isApiClientError(cause) ? cause.message : "ایجاد خروجی ناموفق بود.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function onLookup(exportId: string) {
    const id = exportId.trim();
    if (!id) return;
    try {
      const job = await fetchAdminExport(id);
      pushRecentId(job.exportId);
      setRecent(readRecentIds());
      setActive(job);
    } catch (cause: unknown) {
      toast.error(
        isApiClientError(cause) ? cause.message : "خروجی یافت نشد.",
      );
    }
  }

  if (!canAccess) return <AdminForbidden />;

  return (
    <div className="space-y-4 animate-fade-in">
      <AdminPageHeader
        title="خروجی‌ها"
        description="ایجاد CSV دامنه‌ای، پیگیری وضعیت و دانلود تا زمان انقضای فایل."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminSectionCard>
          <h2 className="mb-3 text-sm font-semibold">درخواست خروجی جدید</h2>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>دامنه</Label>
              <Select
                value={domain}
                onValueChange={(value) => setDomain(value as AdminExportDomain)}
              >
                <SelectTrigger className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {domainOptions.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item === "payments" ? "پرداخت‌ها" : "گزارش‌ها"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>از (ISO UTC)</Label>
                <Input
                  className="rounded-lg font-mono text-xs"
                  value={from}
                  onChange={(event) => setFrom(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>تا (ISO UTC)</Label>
                <Input
                  className="rounded-lg font-mono text-xs"
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                />
              </div>
            </div>

            {domain === "payments" ? (
              <div className="space-y-1.5">
                <Label>وضعیت پرداخت</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه</SelectItem>
                    {PAYMENT_STATUSES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <Button
              type="button"
              className="rounded-lg"
              disabled={creating}
              onClick={() => void onCreate()}
            >
              <FileDown className="size-4" />
              ایجاد خروجی
            </Button>
          </div>
        </AdminSectionCard>

        <AdminSectionCard>
          <h2 className="mb-3 text-sm font-semibold">پیگیری با شناسه</h2>
          <div className="flex gap-2">
            <Input
              className="rounded-lg font-mono text-xs"
              placeholder="exportId"
              value={lookupId}
              onChange={(event) => setLookupId(event.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              onClick={() => void onLookup(lookupId)}
            >
              <Search className="size-4" />
              جستجو
            </Button>
          </div>

          {recent.length > 0 ? (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-muted-foreground">اخیر در این نشست</p>
              <div className="flex flex-wrap gap-2">
                {recent.map((id) => (
                  <Button
                    key={id}
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="rounded-lg font-mono text-[11px]"
                    onClick={() => void onLookup(id)}
                  >
                    {id.slice(0, 10)}…
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
        </AdminSectionCard>
      </div>

      {active ? (
        <AdminSectionCard>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">وضعیت خروجی</h2>
            {polling ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <RefreshCw className="size-3.5 animate-spin" />
                در حال پیگیری…
              </span>
            ) : null}
          </div>

          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-xs text-muted-foreground">شناسه</dt>
              <dd className="font-mono text-xs">{active.exportId}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">دامنه</dt>
              <dd className="text-sm">{active.domain}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">وضعیت</dt>
              <dd>
                <AdminStatusBadge status={active.status} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">انقضا</dt>
              <dd className="text-sm">{formatAdminDateTime(active.expiresAt)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">تعداد ردیف</dt>
              <dd className="text-sm">
                {active.rowCount == null
                  ? "—"
                  : toPersianDigits(active.rowCount)}
                {active.truncated ? " (truncated)" : ""}
              </dd>
            </div>
            {active.errorMessage ? (
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted-foreground">خطا</dt>
                <dd className="text-sm text-destructive">{active.errorMessage}</dd>
              </div>
            ) : null}
          </dl>

          {active.status === "ready" && active.downloadUrl ? (
            <div className="mt-4">
              <Button asChild className="rounded-lg">
                <a href={active.downloadUrl}>
                  <Download className="size-4" />
                  دانلود CSV
                </a>
              </Button>
              {active.downloadExpiresAt ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  لینک دانلود تا{" "}
                  {formatAdminDateTime(active.downloadExpiresAt)} معتبر است.
                </p>
              ) : null}
            </div>
          ) : null}
        </AdminSectionCard>
      ) : null}
    </div>
  );
}
