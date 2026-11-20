"use client";

import { ChevronLeft, Headset } from "lucide-react";
import { useEffect, useState } from "react";

import { fetchPublicSettings } from "@/lib/api/app-settings";
import { toPersianDigits } from "@/lib/utils/format";

interface SupportInfo {
  hours: string;
  phone: string;
}

// One fetch per page load; the public settings endpoint is cached for a minute anyway.
let pending: Promise<SupportInfo | null> | null = null;

function loadSupportInfo(): Promise<SupportInfo | null> {
  pending ??= fetchPublicSettings()
    .then((settings) => {
      const value = (key: string) => {
        const found = settings.find((setting) => setting.group === "app" && setting.key === key)?.settingValue;
        return typeof found === "string" ? found.trim() : "";
      };
      const phone = value("support_phone");
      return phone ? { hours: value("support_hours"), phone } : null;
    })
    .catch(() => {
      pending = null;
      return null;
    });
  return pending;
}

/** «تماس با پشتیبانی» in the app menu; hidden until an admin sets a support phone. */
export function SupportContact() {
  const [info, setInfo] = useState<SupportInfo | null>(null);

  useEffect(() => {
    let alive = true;
    void loadSupportInfo().then((result) => {
      if (alive) setInfo(result);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!info) return null;

  return (
    <a
      href={`tel:${info.phone}`}
      className="flex items-center gap-3 rounded-[22px] bg-white px-3.5 py-3 ring-1 ring-[#e3ebe3] transition-colors hover:bg-[#f6f8f4]"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#f1f5f0] text-[#4a5d4a]">
        <Headset className="size-[18px]" strokeWidth={1.9} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-bold text-[#334433]">تماس با پشتیبانی</span>
        <span className="block truncate text-[11px] text-[#7a887a]">
          <span dir="ltr">{toPersianDigits(info.phone)}</span>
          {info.hours ? ` · ${info.hours}` : ""}
        </span>
      </span>
      <ChevronLeft className="size-4 text-[#a8b5a8]" />
    </a>
  );
}
