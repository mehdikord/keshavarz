"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Wrench,
} from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { MapPicker } from "@/components/shared/map-picker";
import { PriceDisplay } from "@/components/shared/price-display";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { SERVICE_CATEGORIES } from "@/lib/mock/catalog";
import { DEFAULT_MAP_CENTER } from "@/lib/mock/constants";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { toLatinDigits, toPersianDigits } from "@/lib/utils/format";
import { useProviderStore } from "@/stores/provider-store";

export default function ProviderServicesPage() {
  const workCenter = useProviderStore((state) => state.workCenter);
  const workRadiusKm = useProviderStore((state) => state.workRadiusKm);
  const offeredServices = useProviderStore((state) => state.offeredServices);
  const setWorkArea = useProviderStore((state) => state.setWorkArea);
  const addService = useProviderStore((state) => state.addService);
  const updateServicePrice = useProviderStore(
    (state) => state.updateServicePrice,
  );
  const removeService = useProviderStore((state) => state.removeService);

  const [workAreaOpen, setWorkAreaOpen] = useState(true);
  const [categoryId, setCategoryId] = useState<string>("");
  const [serviceId, setServiceId] = useState<string>("");
  const [priceInput, setPriceInput] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");

  const selectedCategory = SERVICE_CATEGORIES.find(
    (category) => category.id === categoryId,
  );

  const serviceRows = useMemo(() => {
    return offeredServices.map((offered) => {
      const service = SERVICE_CATEGORIES.flatMap((category) =>
        category.services.map((item) => ({ ...item, categoryName: category.name })),
      ).find((item) => item.id === offered.serviceId);

      return {
        ...offered,
        name: service?.name ?? "خدمت",
        categoryName: service?.categoryName ?? "دسته‌بندی",
      };
    });
  }, [offeredServices]);

  const handleSaveWorkArea = () => {
    setWorkArea(workCenter ?? DEFAULT_MAP_CENTER, workRadiusKm);
    toast.success("محدوده کاری ذخیره شد");
  };

  const handleAddService = () => {
    const price = Number(toLatinDigits(priceInput.replace(/[^\d]/g, "")));

    if (!serviceId) {
      toast.error("خدمت را انتخاب کنید");
      return;
    }

    if (!price || price < 1000) {
      toast.error("قیمت معتبر وارد کنید");
      return;
    }

    if (offeredServices.some((item) => item.serviceId === serviceId)) {
      toast.error("این خدمت قبلاً ثبت شده است");
      return;
    }

    addService({ serviceId, price });
    setServiceId("");
    setCategoryId("");
    setPriceInput("");
    toast.success("خدمت اضافه شد");
  };

  const handleUpdatePrice = () => {
    if (!editTarget) return;

    const price = Number(toLatinDigits(editPrice.replace(/[^\d]/g, "")));
    if (!price || price < 1000) {
      toast.error("قیمت معتبر وارد کنید");
      return;
    }

    updateServicePrice(editTarget, price);
    setEditTarget(null);
    setEditPrice("");
    toast.success("قیمت به‌روزرسانی شد");
  };

  return (
    <PageContainer withDock>
      <PageHeader
        title="ارائه خدمات"
        description="محدوده کاری و خدمات قابل ارائه"
      />

      <Card className="card-elevated mb-4 overflow-hidden border-border/70">
        <button
          type="button"
          onClick={() => setWorkAreaOpen((value) => !value)}
          className="flex w-full items-center justify-between px-4 py-4 text-right"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MapPin className="size-5" />
            </div>
            <div>
              <p className="font-semibold">محدوده کاری</p>
              <p className="text-xs text-muted-foreground">
                شعاع {toPersianDigits(workRadiusKm)} کیلومتر
              </p>
            </div>
          </div>
          <ChevronDown
            className={cn(
              "size-5 text-muted-foreground transition-transform",
              workAreaOpen && "rotate-180",
            )}
          />
        </button>

        {workAreaOpen ? (
          <CardContent className="space-y-4 border-t border-border/60 pt-4">
            <MapPicker
              value={workCenter}
              onChange={(location) =>
                setWorkArea(location, workRadiusKm)
              }
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <Label>شعاع پوشش</Label>
                <span className="font-semibold text-primary">
                  {toPersianDigits(workRadiusKm)} km
                </span>
              </div>
              <Slider
                min={20}
                max={100}
                step={5}
                value={[workRadiusKm]}
                onValueChange={(value) =>
                  setWorkArea(workCenter ?? DEFAULT_MAP_CENTER, value[0] ?? 50)
                }
              />
            </div>

            <Button
              type="button"
              className="h-11 w-full rounded-xl"
              onClick={handleSaveWorkArea}
            >
              ذخیره محدوده
            </Button>
          </CardContent>
        ) : null}
      </Card>

      <Separator className="my-5" />

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-success/10 text-success">
            <Wrench className="size-5" />
          </div>
          <div>
            <h2 className="font-semibold">خدمات قابل ارائه</h2>
            <p className="text-xs text-muted-foreground">
              خدمات خود را با قیمت ثبت کنید
            </p>
          </div>
        </div>

        <Card className="border-border/70">
          <CardContent className="space-y-4 pt-5">
            <div className="space-y-2">
              <Label>دسته‌بندی</Label>
              <Select
                value={categoryId}
                onValueChange={(value) => {
                  setCategoryId(value);
                  setServiceId("");
                }}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="انتخاب دسته" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_CATEGORIES.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>خدمت</Label>
              <Select
                value={serviceId}
                onValueChange={setServiceId}
                disabled={!selectedCategory}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="انتخاب خدمت" />
                </SelectTrigger>
                <SelectContent>
                  {selectedCategory?.services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">قیمت (تومان)</Label>
              <Input
                id="price"
                inputMode="numeric"
                value={priceInput}
                onChange={(event) => setPriceInput(event.target.value)}
                className="h-11 rounded-xl"
                placeholder="مثلاً ۵۰۰۰۰۰۰"
              />
            </div>

            <Button
              type="button"
              className="h-11 w-full rounded-xl"
              onClick={handleAddService}
            >
              <Plus className="size-4" />
              ثبت خدمت
            </Button>
          </CardContent>
        </Card>

        {serviceRows.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="هنوز خدمتی ثبت نشده"
            description="اولین خدمت خود را اضافه کنید تا در جستجو دیده شوید"
          />
        ) : (
          <div className="space-y-3">
            {serviceRows.map((service) => (
              <Card key={service.serviceId} className="border-border/70">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{service.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {service.categoryName}
                      </p>
                      {editTarget === service.serviceId ? null : (
                        <PriceDisplay amount={service.price} size="sm" />
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="rounded-xl"
                        onClick={() => {
                          setEditTarget(service.serviceId);
                          setEditPrice(String(service.price));
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="rounded-xl text-destructive"
                        onClick={() => setDeleteTarget(service.serviceId)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>

                  {editTarget === service.serviceId ? (
                    <div className="flex gap-2">
                      <Input
                        inputMode="numeric"
                        value={editPrice}
                        onChange={(event) => setEditPrice(event.target.value)}
                        className="h-10 rounded-xl"
                      />
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-xl"
                        onClick={handleUpdatePrice}
                      >
                        ذخیره
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="حذف خدمت"
        description="آیا از حذف این خدمت مطمئن هستید؟"
        confirmLabel="حذف"
        variant="destructive"
        onConfirm={() => {
          if (deleteTarget) removeService(deleteTarget);
          setDeleteTarget(null);
          toast.success("خدمت حذف شد");
        }}
      />
    </PageContainer>
  );
}
