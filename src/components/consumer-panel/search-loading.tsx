"use client";

import { Search, UserCheck, MapPin, Star } from "lucide-react";

export function SearchLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      <div className="relative mb-8">
        <div className="search-loading-ring" />
        <div className="search-loading-ring-inner" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
            <Search className="size-7 text-primary animate-search-pulse" />
          </div>
        </div>
      </div>

      <div className="space-y-2 text-center">
        <h3 className="text-lg font-bold text-foreground">
          در حال جستجوی خدمات‌دهندگان
        </h3>
        <p className="text-sm text-muted-foreground">
          نزدیک‌ترین افراد واجد شرایط برای شما یافت می‌شوند...
        </p>
      </div>

      <div className="mt-8 flex flex-col items-center gap-4">
        <div className="flex items-center gap-3 text-sm text-muted-foreground animate-search-step-1">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MapPin className="size-4" />
          </span>
          <span>بررسی موقعیت زمین شما</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground animate-search-step-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <UserCheck className="size-4" />
          </span>
          <span>شناسایی خدمات‌دهندگان نزدیک</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground animate-search-step-3">
          <span className="flex size-8 items-center justify-center rounded-lg bg-success/10 text-success">
            <Star className="size-4" />
          </span>
          <span>بررسی قیمت و امتیاز</span>
        </div>
      </div>
    </div>
  );
}
