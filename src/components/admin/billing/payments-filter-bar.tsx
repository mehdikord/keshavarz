"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useQueryUpdater } from "@/components/admin/users/users-list-controls";
import { buttonVariants } from "@/components/admin/ui/button";
import { NativeSelect } from "@/components/admin/ui/input";

import { PAYMENT_PERIOD_LABELS } from "./billing-labels";
import { BillingSearchInput } from "./search-input";

export function PaymentsFilterBar({ query }: { query: { period: string; q?: string } }) {
  const update = useQueryUpdater();
  const pathname = usePathname();
  const hasFilters = Boolean(query.q || query.period !== "all");
  return (
    <div className="grid grid-cols-2 items-center gap-2 lg:flex lg:flex-wrap">
      <BillingSearchInput
        initial={query.q}
        key={query.q ? "q" : "empty"}
        label="جستجوی پرداخت"
        placeholder="نام یا موبایل کاربر، شناسه پرداخت، authority یا کد پیگیری"
      />
      <NativeSelect
        aria-label="بازه زمانی"
        className="col-span-2 w-full sm:col-span-1 lg:w-44 [&_select]:h-10"
        onChange={(event) => update({ period: event.target.value === "all" ? null : event.target.value })}
        value={query.period}
      >
        {Object.entries(PAYMENT_PERIOD_LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </NativeSelect>
      {hasFilters ? (
        <Link className={buttonVariants({ variant: "ghost" })} href={pathname} scroll={false}>
          <X />
          پاک کردن فیلترها
        </Link>
      ) : null}
    </div>
  );
}
