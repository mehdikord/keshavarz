"use client";

import { useId } from "react";
import { LayoutGrid, Sprout } from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AppCategory, AppService } from "@/lib/api/app-catalog";
import { cn } from "@/lib/utils";

export type CatalogTree = Array<AppCategory & { services: AppService[] }>;

interface ServicePickerProps {
  catalog: CatalogTree;
  categoryId: string;
  serviceId: string;
  onCategoryChange: (categoryId: string) => void;
  onServiceChange: (serviceId: string) => void;
}

const TRIGGER =
  "h-12 w-full rounded-2xl border-0 bg-[#fcf7ee] pe-3 ps-3.5 text-[13px] font-bold text-[#3b2410] shadow-none ring-1 ring-[#efe0c8] transition focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[#e3b97f] data-[state=open]:bg-white data-[state=open]:ring-2 data-[state=open]:ring-[#e3b97f] data-[placeholder]:font-medium data-[placeholder]:text-[#b8a189] disabled:opacity-60 [&>svg]:text-[#a08463] [&>svg]:opacity-100";
const CONTENT = "max-h-72 rounded-2xl border-[#efe0c8] bg-white p-1 shadow-[0_20px_40px_-20px_rgba(160,86,26,0.55)]";
const ITEM =
  "rounded-xl py-2.5 pe-2 ps-8 text-[13px] font-bold text-[#3b2410] focus:bg-[#fff1df] focus:text-[#3b2410] data-[state=checked]:text-[#b9531f] [&_[data-slot=select-item-indicator]_svg]:text-[#b9531f]";

/** Two linked selects: the category narrows the second select to its services. */
export function ServicePicker({ catalog, categoryId, serviceId, onCategoryChange, onServiceChange }: ServicePickerProps) {
  const categoryLabelId = useId();
  const serviceLabelId = useId();

  const categories = catalog.filter((category) => category.services.length > 0);
  const services = categories.find((category) => category.categoryId === categoryId)?.services ?? [];
  const selectedService = services.find((service) => service.serviceId === serviceId);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label id={categoryLabelId} className="flex items-center gap-1.5 px-1 text-[12px] font-bold text-[#6b4a26]">
          <LayoutGrid className="size-3.5 text-[#a08463]" />
          دسته‌بندی خدمت
        </label>
        <Select dir="rtl" value={categoryId} onValueChange={onCategoryChange}>
          <SelectTrigger aria-labelledby={categoryLabelId} className={TRIGGER}>
            <SelectValue placeholder="یک دسته‌بندی انتخاب کنید" />
          </SelectTrigger>
          <SelectContent position="popper" className={CONTENT}>
            {categories.map((category) => (
              <SelectItem key={category.categoryId} value={category.categoryId} className={ITEM}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label
          id={serviceLabelId}
          className={cn(
            "flex items-center gap-1.5 px-1 text-[12px] font-bold text-[#6b4a26] transition-opacity",
            !categoryId && "opacity-60",
          )}
        >
          <Sprout className="size-3.5 text-[#3f7d45]" />
          خدمت مورد نظر
        </label>
        <Select
          dir="rtl"
          value={serviceId}
          onValueChange={onServiceChange}
          disabled={!categoryId}
        >
          <SelectTrigger aria-labelledby={serviceLabelId} className={TRIGGER}>
            <SelectValue placeholder={categoryId ? "یک خدمت انتخاب کنید" : "ابتدا دسته‌بندی را انتخاب کنید"} />
          </SelectTrigger>
          <SelectContent position="popper" className={CONTENT}>
            {services.map((service) => (
              <SelectItem key={service.serviceId} value={service.serviceId} className={ITEM}>
                {service.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedService?.description ? (
          <p className="px-1 text-[11.5px] leading-relaxed text-[#8a6a48]">{selectedService.description}</p>
        ) : null}
      </div>
    </div>
  );
}
