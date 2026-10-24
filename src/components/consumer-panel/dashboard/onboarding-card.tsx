"use client";

import Link from "next/link";
import { ArrowLeft, HandHelping, LandPlot, Search } from "lucide-react";

import { toPersianDigits } from "@/lib/utils/format";

const STEPS = [
  { icon: LandPlot, title: "ثبت زمین", text: "موقعیت و مساحت زمین را روی نقشه مشخص کنید." },
  { icon: Search, title: "جستجوی خدمت", text: "خدمات‌دهندگان نزدیک زمینتان را پیدا کنید." },
  { icon: HandHelping, title: "دریافت خدمت", text: "درخواست بفرستید و کار را پیگیری کنید." },
];

/** First-run guide shown until the farmer registers a land. */
export function OnboardingCard() {
  return (
    <section className="overflow-hidden rounded-[28px] bg-white shadow-[0_18px_40px_-24px_rgba(160,86,26,0.55)] ring-1 ring-[#efe0c8]">
      <div className="bg-[linear-gradient(160deg,#fff1d6_0%,#ffffff_80%)] px-5 pb-4 pt-5">
        <h2 className="text-[16px] font-black text-[#3b2410]">به کشاورز خوش آمدید</h2>
        <p className="mt-1 text-[12px] leading-6 text-[#8a6a48]">
          در سه قدم ساده، خدمات کشاورزی را برای زمین خود درخواست کنید.
        </p>
      </div>
      <ol className="space-y-3 px-5 pb-2">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <li key={step.title} className="flex items-start gap-3">
              <span className="relative flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#fdebd3] text-[#b9531f]">
                <Icon className="size-5" />
                <span className="absolute -left-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-[#b9531f] text-[10px] font-black text-white ring-2 ring-white">
                  {toPersianDigits(index + 1)}
                </span>
              </span>
              <span className="min-w-0 pt-0.5">
                <span className="block text-[13px] font-black text-[#3b2410]">{step.title}</span>
                <span className="block text-[11.5px] leading-5 text-[#8a6a48]">{step.text}</span>
              </span>
            </li>
          );
        })}
      </ol>
      <div className="p-4">
        <Link
          href="/users/lands/new"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#b9531f] text-[14px] font-black text-white shadow-[0_14px_28px_-14px_rgba(185,83,31,0.9)] transition active:scale-[0.98]"
        >
          ثبت اولین زمین
          <ArrowLeft className="size-4" />
        </Link>
      </div>
    </section>
  );
}
