"use client";

import { motion } from "framer-motion";

import { SproutMark } from "@/components/shared/sprout-mark";

const POLLEN = [
  { left: "12%", size: 4, delay: 0.4, duration: 6 },
  { left: "28%", size: 3, delay: 1.6, duration: 5 },
  { left: "46%", size: 5, delay: 0.9, duration: 7 },
  { left: "63%", size: 3, delay: 2.2, duration: 5.5 },
  { left: "80%", size: 4, delay: 1.2, duration: 6.5 },
  { left: "90%", size: 3, delay: 2.8, duration: 5 },
];

/** Launch screen shown while the session bootstraps; sized like the mobile shell. */
export function AppSplash({ onIntroDone }: { onIntroDone?: () => void }) {
  return (
    <motion.div
      role="status"
      aria-live="polite"
      aria-label="در حال آماده‌سازی کشاورز"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--outer-bg)] sm:p-4"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.45, ease: "easeOut" } }}
    >
      <motion.div
        className="relative isolate flex h-dvh w-full max-w-[430px] flex-col items-center justify-center overflow-hidden bg-[radial-gradient(120%_80%_at_50%_30%,#1f5a40_0%,#0f3324_55%,#071d14_100%)] text-white sm:h-[calc(100dvh-2rem)] sm:rounded-[2rem]"
        exit={{ scale: 1.04, transition: { duration: 0.45, ease: "easeOut" } }}
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="bg-grain absolute inset-0 opacity-[0.09] mix-blend-overlay" />
          <motion.div
            className="absolute left-1/2 top-[38%] size-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,214,140,0.35)_0%,rgba(149,213,178,0.12)_40%,transparent_70%)]"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: [0.4, 1.05, 1], opacity: 1 }}
            transition={{ duration: 1.6, ease: "easeOut" }}
          />
          {POLLEN.map((p) => (
            <motion.span
              key={p.left}
              className="absolute bottom-24 rounded-full bg-[#d8f3dc]"
              style={{ left: p.left, width: p.size, height: p.size }}
              initial={{ y: 0, opacity: 0 }}
              animate={{ y: -320, x: [0, 14, -6, 10], opacity: [0, 0.8, 0.6, 0] }}
              transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "linear" }}
            />
          ))}
          <svg viewBox="0 0 430 160" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-40 w-full">
            <motion.path
              d="M0 70 C 80 40 160 46 230 64 C 300 82 370 40 430 52 V160 H0Z"
              fill="#1b5038"
              initial={{ y: 60 }}
              animate={{ y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            />
            <motion.path
              d="M0 100 C 100 74 210 112 300 94 C 360 82 400 86 430 92 V160 H0Z"
              fill="#24603f"
              initial={{ y: 60 }}
              animate={{ y: 0 }}
              transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            />
            <g fill="none" stroke="#95d5b2" strokeOpacity="0.14" strokeWidth="1.5">
              <path d="M0 116 C 100 92 210 126 300 110 C 360 99 400 102 430 108" />
              <path d="M0 132 C 100 110 210 140 300 126 C 360 116 400 118 430 124" />
            </g>
          </svg>
        </div>

        <motion.div
          className="relative flex size-36 items-center justify-center rounded-[40px] bg-white/[0.06] ring-1 ring-white/10 backdrop-blur-sm"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <svg viewBox="0 0 144 144" className="absolute inset-0 size-full -rotate-90" aria-hidden>
            <motion.circle
              cx="72"
              cy="72"
              r="70"
              fill="none"
              stroke="#95d5b2"
              strokeOpacity="0.5"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="1 1"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.8, ease: "easeInOut" }}
            />
          </svg>
          <SproutMark className="size-28" />
        </motion.div>

        <motion.h1
          className="mt-7 text-[40px] font-black leading-none tracking-tight"
          initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, delay: 1.3, ease: "easeOut" }}
        >
          کشاورز
        </motion.h1>
        <motion.p
          className="mt-3 text-[13px] font-medium text-[#b7e4c7]"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.6 }}
          onAnimationComplete={onIntroDone}
        >
          همراه کشاورزان، از کاشت تا برداشت
        </motion.p>

        <motion.div
          className="absolute bottom-[calc(env(safe-area-inset-bottom,0px)+3.5rem)] flex flex-col items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="relative h-1.5 w-36 overflow-hidden rounded-full bg-white/10">
            <motion.span
              className="absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-l from-[#ffd27f] to-[#95d5b2]"
              initial={{ right: "-35%" }}
              animate={{ right: "105%" }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          <p className="text-[11.5px] text-white/60">در حال آماده‌سازی مزرعه…</p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
