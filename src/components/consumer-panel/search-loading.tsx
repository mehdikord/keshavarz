"use client";

import { motion } from "framer-motion";
import { LandPlot, Tractor, UserCheck, Wallet } from "lucide-react";

const STEPS = [
  { icon: LandPlot, text: "بررسی موقعیت زمین شما" },
  { icon: UserCheck, text: "یافتن خدمات‌دهندگان در محدوده" },
  { icon: Wallet, text: "مقایسه قیمت و فاصله" },
];

/** Radar-style "searching" state shown while results load. */
export function SearchLoading() {
  return (
    <div className="flex flex-col items-center py-10">
      <div className="relative flex size-44 items-center justify-center">
        {[0, 1, 2].map((ring) => (
          <motion.span
            key={ring}
            className="absolute inset-0 rounded-full border-2 border-[#e8954a]/50"
            initial={{ scale: 0.35, opacity: 0.9 }}
            animate={{ scale: 1, opacity: 0 }}
            transition={{ duration: 2.4, repeat: Infinity, delay: ring * 0.8, ease: "easeOut" }}
          />
        ))}
        <span className="absolute inset-8 rounded-full bg-[radial-gradient(circle,#fff1df_0%,transparent_70%)]" />
        <motion.span
          className="relative flex size-20 items-center justify-center rounded-[26px] bg-gradient-to-br from-[#ffb85c] to-[#c9611f] text-white shadow-[0_18px_36px_-12px_rgba(185,83,31,0.8)]"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Tractor className="size-10" strokeWidth={1.5} />
        </motion.span>
      </div>

      <h2 className="mt-6 text-[17px] font-black text-[#3b2410]">در حال جستجوی خدمات‌دهندگان…</h2>
      <p className="mt-1 text-[12px] text-[#8a6a48]">چند لحظه صبر کنید</p>

      <ol className="mt-7 w-full max-w-72 space-y-2.5">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <motion.li
              key={step.text}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.7, duration: 0.4 }}
              className="flex items-center gap-3 rounded-2xl bg-white/80 px-3 py-2.5 ring-1 ring-[#efe0c8]"
            >
              <span className="flex size-8 items-center justify-center rounded-xl bg-[#fdebd3] text-[#b9531f]">
                <Icon className="size-4" />
              </span>
              <span className="text-[12.5px] font-bold text-[#5c4120]">{step.text}</span>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
