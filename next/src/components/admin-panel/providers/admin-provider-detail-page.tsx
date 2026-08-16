"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Copy, Gift } from "lucide-react";
import { toast } from "sonner";

import {
  AdminConfirmDialog,
  AdminDataTable,
  AdminForbidden,
  AdminPageHeader,
  AdminSectionCard,
  AdminStatusBadge,
  type AdminDataTableColumn,
} from "@/components/admin-panel";
import { AdminGrantSubscriptionDialog } from "@/components/admin-panel/subscriptions/admin-grant-subscription-dialog";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAdminPermissions } from "@/hooks/admin/use-admin-permissions";
import {
  copyPublicId,
  formatAdminDateTime,
} from "@/lib/admin/format";
import {
  approveAdminProvider,
  fetchAdminProvider,
  fetchAdminProviderServices,
  patchAdminProvider,
  patchAdminProviderService,
  updateAdminProviderAvailability,
  type AdminProviderDetail,
  type AdminProviderService,
} from "@/lib/api/admin-providers";
import { isApiClientError } from "@/lib/api/envelope";
import { formatPrice, toPersianDigits } from "@/lib/utils/format";

const PRICING_UNITS = [
  { value: "fixed", label: "ثابت" },
  { value: "per_hectare", label: "هر هکتار" },
  { value: "per_square_meter", label: "هر متر مربع" },
  { value: "per_hour", label: "هر ساعت" },
  { value: "per_day", label: "هر روز" },
] as const;

interface AdminProviderDetailPageProps {
  providerId: string;
}

export function AdminProviderDetailPage({
  providerId,
}: AdminProviderDetailPageProps) {
  const { can } = useAdminPermissions();
  const canView = can("providers.view");
  const canUpdate = can("providers.update");
  const canChangeStatus = can("providers.change_status");
  const canGrant = can("subscriptions.grant");

  const [provider, setProvider] = useState<AdminProviderDetail | null>(null);
  const [services, setServices] = useState<AdminProviderService[]>([]);
  const [loading, setLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [servicesReloadKey, setServicesReloadKey] = useState(0);

  const [bio, setBio] = useState("");
  const [workLatitude, setWorkLatitude] = useState("");
  const [workLongitude, setWorkLongitude] = useState("");
  const [workRadiusKm, setWorkRadiusKm] = useState("20");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingWorkArea, setSavingWorkArea] = useState(false);

  const [approveOpen, setApproveOpen] = useState(false);
  const [grantOpen, setGrantOpen] = useState(false);
  const [availabilityTarget, setAvailabilityTarget] = useState<{
    isActive?: boolean;
    isAvailable?: boolean;
    label: string;
  } | null>(null);

  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [servicePrice, setServicePrice] = useState("");
  const [serviceUnit, setServiceUnit] = useState<string>("fixed");
  const [serviceActive, setServiceActive] = useState(true);
  const [savingService, setSavingService] = useState(false);

  useEffect(() => {
    if (!canView) return;
    const controller = new AbortController();

    void fetchAdminProvider(providerId, controller.signal)
      .then((detail) => {
        if (controller.signal.aborted) return;
        setProvider(detail);
        setBio(detail.bio ?? "");
        setWorkLatitude(detail.workArea.workLatitude ?? "");
        setWorkLongitude(detail.workArea.workLongitude ?? "");
        setWorkRadiusKm(String(detail.workArea.workRadiusKm));
        setError(null);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          isApiClientError(cause)
            ? cause.message
            : "بارگذاری Provider ناموفق بود.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [canView, providerId, reloadKey]);

  useEffect(() => {
    if (!canView) return;
    const controller = new AbortController();

    void fetchAdminProviderServices({
      limit: 50,
      providerId,
      signal: controller.signal,
    })
      .then((result) => {
        if (controller.signal.aborted) return;
        setServices(result.items);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        toast.error(
          isApiClientError(cause)
            ? cause.message
            : "بارگذاری خدمات Provider ناموفق بود.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setServicesLoading(false);
      });

    return () => controller.abort();
  }, [canView, providerId, servicesReloadKey]);

  if (!canView) return <AdminForbidden />;

  if (loading && !provider) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !provider) {
    return (
      <AdminSectionCard className="text-center text-sm text-destructive">
        {error ?? "Provider یافت نشد."}
      </AdminSectionCard>
    );
  }

  const serviceColumns: AdminDataTableColumn<AdminProviderService>[] = [
    {
      id: "name",
      header: "خدمت",
      cell: (row) => (
        <div>
          <p className="font-medium">{row.serviceName}</p>
          <p className="font-mono text-[11px] text-muted-foreground" dir="ltr">
            {row.serviceId}
          </p>
        </div>
      ),
    },
    {
      id: "price",
      header: "قیمت",
      cell: (row) =>
        editingServiceId === row.providerServiceId ? (
          <Input
            value={servicePrice}
            onChange={(event) => setServicePrice(event.target.value)}
            className="h-8 w-28 font-mono text-xs"
            dir="ltr"
            disabled={savingService}
          />
        ) : (
          <span className="text-xs">{formatPrice(row.priceToman)}</span>
        ),
    },
    {
      id: "unit",
      header: "واحد",
      cell: (row) =>
        editingServiceId === row.providerServiceId ? (
          <Select
            value={serviceUnit}
            onValueChange={setServiceUnit}
            disabled={savingService}
          >
            <SelectTrigger className="h-8 w-36 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRICING_UNITS.map((unit) => (
                <SelectItem key={unit.value} value={unit.value}>
                  {unit.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="text-xs">
            {PRICING_UNITS.find((unit) => unit.value === row.pricingUnit)
              ?.label ?? row.pricingUnit}
          </span>
        ),
    },
    {
      id: "active",
      header: "وضعیت",
      cell: (row) =>
        editingServiceId === row.providerServiceId ? (
          <Select
            value={serviceActive ? "1" : "0"}
            onValueChange={(value) => setServiceActive(value === "1")}
            disabled={savingService}
          >
            <SelectTrigger className="h-8 w-28 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">فعال</SelectItem>
              <SelectItem value="0">غیرفعال</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <AdminStatusBadge
            status={row.isActive ? "active" : "inactive"}
            label={row.isActive ? "فعال" : "غیرفعال"}
          />
        ),
    },
    {
      id: "actions",
      header: "عملیات",
      stickyActions: true,
      cell: (row) =>
        editingServiceId === row.providerServiceId ? (
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              className="h-8"
              disabled={!canUpdate || savingService}
              onClick={async () => {
                const price = Number(servicePrice);
                if (!Number.isFinite(price) || price < 1000) {
                  toast.error("قیمت باید حداقل ۱۰۰۰ تومان باشد.");
                  return;
                }
                setSavingService(true);
                try {
                  await patchAdminProviderService(row.providerServiceId, {
                    isActive: serviceActive,
                    priceToman: price,
                    pricingUnit: serviceUnit,
                  });
                  toast.success("خدمت به‌روزرسانی شد");
                  setEditingServiceId(null);
                  setServicesLoading(true);
                  setServicesReloadKey((value) => value + 1);
                } catch (cause) {
                  toast.error(
                    isApiClientError(cause)
                      ? cause.message
                      : "ذخیره خدمت ناموفق بود.",
                  );
                } finally {
                  setSavingService(false);
                }
              }}
            >
              ذخیره
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8"
              disabled={savingService}
              onClick={() => setEditingServiceId(null)}
            >
              انصراف
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8"
            disabled={!canUpdate}
            onClick={() => {
              setEditingServiceId(row.providerServiceId);
              setServicePrice(String(row.priceToman));
              setServiceUnit(row.pricingUnit);
              setServiceActive(row.isActive);
            }}
          >
            ویرایش
          </Button>
        ),
    },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <AdminPageHeader
        title={provider.name}
        description="جزئیات Provider، work area، خدمات و اشتراک."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/admins/providers">بازگشت به فهرست</Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <AdminStatusBadge
          status={provider.approved ? "approved" : "pending"}
          label={provider.approved ? "تأییدشده" : "در انتظار تأیید"}
        />
        <AdminStatusBadge
          status={provider.isActive ? "active" : "inactive"}
          label={provider.isActive ? "فعال" : "غیرفعال"}
        />
        <AdminStatusBadge
          status={provider.isAvailable ? "active" : "inactive"}
          label={provider.isAvailable ? "در دسترس" : "غیردردسترس"}
        />
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 gap-1 px-2 font-mono text-xs"
          dir="ltr"
          onClick={() => void copyPublicId(provider.providerId)}
        >
          <Copy className="size-3.5" />
          {provider.providerId}
        </Button>
      </div>

      <Tabs defaultValue="summary" className="gap-4">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="summary">خلاصه</TabsTrigger>
          <TabsTrigger value="work-area">محدوده کار</TabsTrigger>
          <TabsTrigger value="services">
            خدمات ({toPersianDigits(provider.servicesCount)})
          </TabsTrigger>
          <TabsTrigger value="subscription">اشتراک</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
            <AdminSectionCard>
              <form
                className="space-y-4"
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (!canUpdate) return;
                  setSavingProfile(true);
                  try {
                    const updated = await patchAdminProvider(providerId, {
                      bio: bio.trim() || null,
                    });
                    setProvider(updated);
                    toast.success("پروفایل به‌روزرسانی شد");
                  } catch (cause) {
                    toast.error(
                      isApiClientError(cause)
                        ? cause.message
                        : "ذخیره پروفایل ناموفق بود.",
                    );
                  } finally {
                    setSavingProfile(false);
                  }
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>موبایل</Label>
                    <Input
                      value={provider.phone}
                      readOnly
                      dir="ltr"
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>کاربر مرتبط</Label>
                    <Button asChild variant="outline" className="w-full justify-start">
                      <Link href={`/admins/users/${provider.user.userId}`}>
                        {provider.user.name}
                      </Link>
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provider-bio">بیو</Label>
                  <Textarea
                    id="provider-bio"
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                    disabled={!canUpdate || savingProfile}
                    rows={4}
                  />
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>ایجاد: {formatAdminDateTime(provider.createdAt)}</p>
                  <p>به‌روزرسانی: {formatAdminDateTime(provider.updatedAt)}</p>
                  <p>تأیید: {formatAdminDateTime(provider.approvedAt)}</p>
                </div>
                {canUpdate ? (
                  <Button type="submit" disabled={savingProfile}>
                    {savingProfile ? "در حال ذخیره..." : "ذخیره بیو"}
                  </Button>
                ) : null}
              </form>
            </AdminSectionCard>

            <AdminSectionCard>
              <h2 className="mb-3 text-sm font-semibold">اقدامات وضعیت</h2>
              {!canChangeStatus ? (
                <p className="text-sm text-muted-foreground">
                  مجوز `providers.change_status` لازم است.
                </p>
              ) : (
                <div className="space-y-2">
                  {!provider.approved ? (
                    <Button
                      type="button"
                      className="w-full"
                      onClick={() => setApproveOpen(true)}
                    >
                      تأیید Provider
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      setAvailabilityTarget({
                        isActive: !provider.isActive,
                        label: provider.isActive
                          ? "غیرفعال‌سازی حساب"
                          : "فعال‌سازی حساب",
                      })
                    }
                  >
                    {provider.isActive ? "غیرفعال کردن حساب" : "فعال کردن حساب"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      setAvailabilityTarget({
                        isAvailable: !provider.isAvailable,
                        label: provider.isAvailable
                          ? "غیرفعال کردن availability"
                          : "فعال کردن availability",
                      })
                    }
                  >
                    {provider.isAvailable
                      ? "خارج از دسترس کردن"
                      : "در دسترس کردن"}
                  </Button>
                </div>
              )}
            </AdminSectionCard>
          </div>
        </TabsContent>

        <TabsContent value="work-area">
          <AdminSectionCard>
            <form
              className="grid max-w-xl gap-4 sm:grid-cols-2"
              onSubmit={async (event) => {
                event.preventDefault();
                if (!canUpdate) return;
                const radius = Number(workRadiusKm);
                if (!Number.isInteger(radius) || radius < 20 || radius > 100) {
                  toast.error("شعاع باید عدد صحیح بین ۲۰ تا ۱۰۰ باشد.");
                  return;
                }
                const lat = workLatitude.trim();
                const lng = workLongitude.trim();
                if ((lat && !lng) || (!lat && lng)) {
                  toast.error("هر دو مختصات یا هیچ‌کدام لازم است.");
                  return;
                }
                setSavingWorkArea(true);
                try {
                  const updated = await patchAdminProvider(providerId, {
                    workLatitude: lat || null,
                    workLongitude: lng || null,
                    workRadiusKm: radius,
                  });
                  setProvider(updated);
                  toast.success("محدوده کار به‌روزرسانی شد");
                } catch (cause) {
                  toast.error(
                    isApiClientError(cause)
                      ? cause.message
                      : "ذخیره محدوده کار ناموفق بود.",
                  );
                } finally {
                  setSavingWorkArea(false);
                }
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="work-lat">عرض جغرافیایی</Label>
                <Input
                  id="work-lat"
                  value={workLatitude}
                  onChange={(event) => setWorkLatitude(event.target.value)}
                  disabled={!canUpdate || savingWorkArea}
                  dir="ltr"
                  className="font-mono"
                  placeholder="مثلاً 35.6892"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="work-lng">طول جغرافیایی</Label>
                <Input
                  id="work-lng"
                  value={workLongitude}
                  onChange={(event) => setWorkLongitude(event.target.value)}
                  disabled={!canUpdate || savingWorkArea}
                  dir="ltr"
                  className="font-mono"
                  placeholder="مثلاً 51.3890"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="work-radius">شعاع (کیلومتر)</Label>
                <Input
                  id="work-radius"
                  value={workRadiusKm}
                  onChange={(event) => setWorkRadiusKm(event.target.value)}
                  disabled={!canUpdate || savingWorkArea}
                  dir="ltr"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">بین ۲۰ تا ۱۰۰</p>
              </div>
              {canUpdate ? (
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={savingWorkArea}>
                    {savingWorkArea ? "در حال ذخیره..." : "ذخیره محدوده"}
                  </Button>
                </div>
              ) : null}
            </form>
          </AdminSectionCard>
        </TabsContent>

        <TabsContent value="services" className="space-y-3">
          <AdminDataTable
            columns={serviceColumns}
            rows={services}
            getRowId={(row) => row.providerServiceId}
            loading={servicesLoading}
            emptyTitle="خدمتی ثبت نشده"
            emptyDescription="این Provider هنوز خدمتی تعریف نکرده است."
            onRetry={() => {
              setServicesLoading(true);
              setServicesReloadKey((value) => value + 1);
            }}
          />
        </TabsContent>

        <TabsContent value="subscription">
          <AdminSectionCard>
            {provider.activeSubscription ? (
              <div className="space-y-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <AdminStatusBadge
                    status={
                      provider.activeSubscription.status === "active"
                        ? "active"
                        : "pending"
                    }
                    label={provider.activeSubscription.status}
                  />
                  <span className="font-medium">
                    {provider.activeSubscription.planName}
                  </span>
                </div>
                <p>
                  مبلغ: {formatPrice(provider.activeSubscription.amountToman)}
                </p>
                <p>منبع: {provider.activeSubscription.source}</p>
                <p>
                  شروع:{" "}
                  {formatAdminDateTime(provider.activeSubscription.startsAt)}
                </p>
                <p>
                  پایان:{" "}
                  {formatAdminDateTime(provider.activeSubscription.endsAt)}
                </p>
                <p className="font-mono text-xs text-muted-foreground" dir="ltr">
                  {provider.activeSubscription.subscriptionId}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                اشتراک فعالی وجود ندارد.
              </p>
            )}

            <div className="mt-4 rounded-lg border border-dashed border-[var(--admin-border)] bg-[var(--admin-canvas)]/40 px-3 py-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Gift className="size-4 text-primary" />
                اعطای اشتراک
              </div>
              {!canGrant ? (
                <p className="text-xs text-muted-foreground">
                  مجوز `subscriptions.grant` لازم است.
                </p>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    اعطای دستی پلن فعال با کلید Idempotency.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setGrantOpen(true)}
                  >
                    اعطای اشتراک
                  </Button>
                </>
              )}
            </div>
          </AdminSectionCard>
        </TabsContent>
      </Tabs>

      <AdminGrantSubscriptionDialog
        open={grantOpen}
        onOpenChange={setGrantOpen}
        providerId={providerId}
        onGranted={() => {
          setLoading(true);
          setReloadKey((value) => value + 1);
        }}
      />

      <AdminConfirmDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        title="تأیید Provider"
        description="پس از تأیید، Provider می‌تواند در جریان‌های مربوطه فعال شود."
        confirmLabel="تأیید"
        onConfirm={async () => {
          try {
            const updated = await approveAdminProvider(providerId, {
              isActive: true,
            });
            setProvider(updated);
            toast.success("Provider تأیید شد");
            setApproveOpen(false);
          } catch (cause) {
            toast.error(
              isApiClientError(cause)
                ? cause.message
                : "تأیید Provider ناموفق بود.",
            );
          }
        }}
      />

      <AdminConfirmDialog
        open={Boolean(availabilityTarget)}
        onOpenChange={(open) => {
          if (!open) setAvailabilityTarget(null);
        }}
        title={availabilityTarget?.label ?? "تغییر وضعیت"}
        description="این تغییر بلافاصله اعمال و در audit ثبت می‌شود."
        confirmLabel="اعمال"
        onConfirm={async () => {
          if (!availabilityTarget) return;
          try {
            const updated = await updateAdminProviderAvailability(providerId, {
              isActive: availabilityTarget.isActive,
              isAvailable: availabilityTarget.isAvailable,
            });
            setProvider(updated);
            toast.success("وضعیت به‌روزرسانی شد");
            setAvailabilityTarget(null);
            setReloadKey((value) => value + 1);
          } catch (cause) {
            toast.error(
              isApiClientError(cause)
                ? cause.message
                : "تغییر وضعیت ناموفق بود.",
            );
          }
        }}
      />
    </div>
  );
}
