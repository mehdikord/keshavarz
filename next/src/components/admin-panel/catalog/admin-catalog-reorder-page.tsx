"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Save } from "lucide-react";
import { toast } from "sonner";

import {
  AdminForbidden,
  AdminPageHeader,
  AdminSectionCard,
  AdminStatusBadge,
} from "@/components/admin-panel";
import { Button } from "@/components/ui/button";
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
import { useAdminPermissions } from "@/hooks/admin/use-admin-permissions";
import {
  fetchAdminCategories,
  fetchAdminServices,
  reorderAdminCatalog,
  type AdminCategory,
  type AdminService,
} from "@/lib/api/admin-catalog";
import { isApiClientError } from "@/lib/api/envelope";

function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  const current = next[index];
  const swap = next[target];
  if (current === undefined || swap === undefined) return items;
  next[index] = swap;
  next[target] = current;
  return next;
}

export function AdminCatalogReorderPage() {
  const { can } = useAdminPermissions();
  const canManage = can("catalog.manage");

  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [allServices, setAllServices] = useState<AdminService[]>([]);
  const [orderedServices, setOrderedServices] = useState<AdminService[]>([]);
  const [serviceCategoryId, setServiceCategoryId] = useState<string>("");
  const [categorySeed, setCategorySeed] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingCategories, setSavingCategories] = useState(false);
  const [savingServices, setSavingServices] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!canManage) return;
    const controller = new AbortController();

    void Promise.all([
      fetchAdminCategories({ signal: controller.signal }),
      fetchAdminServices({ signal: controller.signal }),
    ])
      .then(([categoryRows, serviceRows]) => {
        if (controller.signal.aborted) return;
        setCategories(categoryRows);
        setAllServices(serviceRows);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        toast.error(
          isApiClientError(cause)
            ? cause.message
            : "بارگذاری کاتالوگ برای مرتب‌سازی ناموفق بود.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [canManage, reloadKey]);

  if (categories.length > 0) {
    const categoryExists = categories.some(
      (item) => item.categoryId === serviceCategoryId,
    );
    if (!categoryExists) {
      const first = categories[0];
      if (first) setServiceCategoryId(first.categoryId);
    }
  } else if (serviceCategoryId) {
    setServiceCategoryId("");
  }

  const servicesSeed = `${serviceCategoryId}:${allServices
    .map((item) => `${item.serviceId}:${item.sortOrder}`)
    .join("|")}`;
  if (servicesSeed !== categorySeed) {
    setCategorySeed(servicesSeed);
    setOrderedServices(
      allServices
        .filter((item) => item.category.categoryId === serviceCategoryId)
        .sort(
          (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
        ),
    );
  }

  if (!canManage) {
    return (
      <AdminForbidden description="برای مرتب‌سازی کاتالوگ مجوز `catalog.manage` لازم است." />
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <AdminPageHeader
        title="مرتب‌سازی کاتالوگ"
        description="ترتیب نمایش دسته‌ها و خدمات را با دکمه‌های بالا/پایین تنظیم کنید."
      />

      <Tabs defaultValue="categories" className="gap-4">
        <TabsList variant="line" className="w-full justify-start">
          <TabsTrigger value="categories">دسته‌ها</TabsTrigger>
          <TabsTrigger value="services">خدمات</TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <AdminSectionCard>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                پس از ذخیره، ترتیب جدید از API خوانده می‌شود.
              </p>
              <Button
                type="button"
                size="sm"
                disabled={savingCategories || categories.length === 0}
                onClick={async () => {
                  setSavingCategories(true);
                  try {
                    await reorderAdminCatalog({
                      categories: categories.map((item, index) => ({
                        categoryId: item.categoryId,
                        sortOrder: index,
                      })),
                    });
                    toast.success("ترتیب دسته‌ها ذخیره شد");
                    setLoading(true);
                    setReloadKey((value) => value + 1);
                  } catch (cause) {
                    toast.error(
                      isApiClientError(cause)
                        ? cause.message
                        : "ذخیره ترتیب دسته‌ها ناموفق بود.",
                    );
                  } finally {
                    setSavingCategories(false);
                  }
                }}
              >
                <Save className="size-4" />
                {savingCategories ? "در حال ذخیره..." : "ذخیره ترتیب"}
              </Button>
            </div>

            <ul className="space-y-2">
              {categories.map((item, index) => (
                <li
                  key={item.categoryId}
                  className="flex items-center gap-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-canvas)]/40 px-3 py-2"
                >
                  <span
                    className="w-8 font-mono text-xs text-muted-foreground"
                    dir="ltr"
                  >
                    {index}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p
                      className="font-mono text-[11px] text-muted-foreground"
                      dir="ltr"
                    >
                      {item.categoryId}
                    </p>
                  </div>
                  <AdminStatusBadge
                    status={item.isActive ? "active" : "inactive"}
                    label={item.isActive ? "فعال" : "غیرفعال"}
                  />
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="size-8"
                      disabled={index === 0 || savingCategories}
                      onClick={() =>
                        setCategories((rows) => moveItem(rows, index, -1))
                      }
                    >
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="size-8"
                      disabled={
                        index === categories.length - 1 || savingCategories
                      }
                      onClick={() =>
                        setCategories((rows) => moveItem(rows, index, 1))
                      }
                    >
                      <ArrowDown className="size-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </AdminSectionCard>
        </TabsContent>

        <TabsContent value="services">
          <AdminSectionCard>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2 sm:w-72">
                <Label>دسته برای مرتب‌سازی خدمات</Label>
                <Select
                  value={serviceCategoryId || undefined}
                  onValueChange={setServiceCategoryId}
                >
                  <SelectTrigger className="w-full rounded-lg">
                    <SelectValue placeholder="انتخاب دسته" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((item) => (
                      <SelectItem key={item.categoryId} value={item.categoryId}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                size="sm"
                disabled={
                  savingServices ||
                  !serviceCategoryId ||
                  orderedServices.length === 0
                }
                onClick={async () => {
                  setSavingServices(true);
                  try {
                    await reorderAdminCatalog({
                      services: orderedServices.map((item, index) => ({
                        serviceId: item.serviceId,
                        sortOrder: index,
                      })),
                    });
                    toast.success("ترتیب خدمات ذخیره شد");
                    setLoading(true);
                    setReloadKey((value) => value + 1);
                  } catch (cause) {
                    toast.error(
                      isApiClientError(cause)
                        ? cause.message
                        : "ذخیره ترتیب خدمات ناموفق بود.",
                    );
                  } finally {
                    setSavingServices(false);
                  }
                }}
              >
                <Save className="size-4" />
                {savingServices ? "در حال ذخیره..." : "ذخیره ترتیب"}
              </Button>
            </div>

            {orderedServices.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                خدمتی در این دسته نیست.
              </p>
            ) : (
              <ul className="space-y-2">
                {orderedServices.map((item, index) => (
                  <li
                    key={item.serviceId}
                    className="flex items-center gap-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-canvas)]/40 px-3 py-2"
                  >
                    <span
                      className="w-8 font-mono text-xs text-muted-foreground"
                      dir="ltr"
                    >
                      {index}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p
                        className="font-mono text-[11px] text-muted-foreground"
                        dir="ltr"
                      >
                        {item.serviceId}
                      </p>
                    </div>
                    <AdminStatusBadge
                      status={item.isActive ? "active" : "inactive"}
                      label={item.isActive ? "فعال" : "غیرفعال"}
                    />
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="size-8"
                        disabled={index === 0 || savingServices}
                        onClick={() =>
                          setOrderedServices((rows) => moveItem(rows, index, -1))
                        }
                      >
                        <ArrowUp className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="size-8"
                        disabled={
                          index === orderedServices.length - 1 || savingServices
                        }
                        onClick={() =>
                          setOrderedServices((rows) => moveItem(rows, index, 1))
                        }
                      >
                        <ArrowDown className="size-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </AdminSectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
