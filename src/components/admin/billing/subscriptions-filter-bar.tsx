"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useQueryUpdater } from "@/components/admin/users/users-list-controls";
import { buttonVariants } from "@/components/admin/ui/button";
import { NativeSelect } from "@/components/admin/ui/input";
import { SUBSCRIPTION_SOURCE } from "@/lib/admin/labels";

import { BillingSearchInput } from "./search-input";

export function SubscriptionsFilterBar({
  plans,
  query,
}: {
  plans: Array<{ id: string; name: string }>;
  query: { plan?: string; q?: string; source: string };
}) {
  const update = useQueryUpdater();
  const pathname = usePathname();
  const hasFilters = Boolean(query.q || query.plan || query.source !== "all");
  return (
    <div className="grid grid-cols-2 items-center gap-2 lg:flex lg:flex-wrap">
      <BillingSearchInput
        initial={query.q}
        key={query.q ? "q" : "empty"}
        label="جستجوی اشتراک"
        placeholder="نام یا موبایل خدمات‌دهنده، یا شناسه اشتراک"
      />
      <NativeSelect
        aria-label="پلن"
        className="w-full lg:w-44 [&_select]:h-10"
        onChange={(event) => update({ plan: event.target.value || null })}
        value={query.plan ?? ""}
      >
        <option value="">همه پلن‌ها</option>
        {plans.map((plan) => (
          <option key={plan.id} value={plan.id}>
            {plan.name}
          </option>
        ))}
      </NativeSelect>
      <NativeSelect
        aria-label="منبع"
        className="w-full lg:w-40 [&_select]:h-10"
        onChange={(event) => update({ source: event.target.value === "all" ? null : event.target.value })}
        value={query.source}
      >
        <option value="all">همه منابع</option>
        {Object.entries(SUBSCRIPTION_SOURCE).map(([key, label]) => (
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
