"use client";

import Link from "next/link";
import { MotionConfig, motion } from "framer-motion";
import { ArrowRight, ClipboardList } from "lucide-react";

import { useSplashStore } from "@/stores/splash-store";

/**
 * Shown when another provider accepted a request first. It deliberately carries
 * no request data — the API withholds it too.
 *
 * Story (≈3.4s, transforms/opacity only): the request slip waits in its slot,
 * a tractor (the other provider) drives in, the slip drops onto its trailer,
 * both drive off in a puff of dust, and a "واگذار شد" stamp lands on the empty
 * slot. With reduced motion every transform jumps straight to the end frame.
 */

/** Travel window shared by the tractor and the slip, so they move as one. */
const TRAVEL = { delay: 0.9, duration: 2.25 } as const;
/** Tractor stops so its trailer bed sits right under the slip. */
const BED_OFFSET_X = -36;
const ENTER_X = 320;
const EXIT_X = -420;
/** Slip drop onto the bed (scaled to fit) and its share of the exit. */
const DROP_Y = 80;
const DROP_SCALE = 0.5;

const DUST = [
  { x: 42, delay: 2.3, size: 18 },
  { x: 62, delay: 2.42, size: 14 },
  { x: 82, delay: 2.54, size: 11 },
];

function Tractor() {
  return (
    <svg viewBox="0 0 120 64" className="h-20 w-[150px]" aria-hidden>
      {/* trailer */}
      <rect x="58" y="40" width="8" height="3" rx="1.5" fill="#5c3a10" />
      <rect x="64" y="34" width="50" height="7" rx="2" fill="#8b5a2b" />
      <rect x="64" y="34" width="50" height="2.5" rx="1.25" fill="#a8743f" />
      <circle cx="96" cy="49" r="7" fill="#3b2410" />
      <circle cx="96" cy="49" r="2.5" fill="#f4d9b0" />
      {/* tractor, facing left (forward in RTL) */}
      <rect x="16" y="13" width="4" height="13" rx="2" fill="#5c3a10" />
      <rect x="8" y="26" width="32" height="16" rx="4" fill="#e8892c" />
      <path d="M36 12a4 4 0 0 1 4-4h14a4 4 0 0 1 4 4v30H36Z" fill="#c9611f" />
      <rect x="40" y="12" width="14" height="12" rx="2" fill="#ffe8c2" />
      <circle cx="18" cy="49" r="8" fill="#3b2410" />
      <circle cx="18" cy="49" r="3" fill="#f4d9b0" />
      <circle cx="50" cy="45" r="13" fill="#3b2410" />
      <circle cx="50" cy="45" r="5" fill="#f4d9b0" />
    </svg>
  );
}

function RequestSlip() {
  return (
    <div className="w-32 rounded-[18px] bg-white p-3 shadow-[0_14px_28px_-16px_rgba(27,67,50,0.55)] ring-1 ring-[#e3ebe3]">
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ClipboardList className="size-4" strokeWidth={2.2} />
        </span>
        <span className="h-2 flex-1 rounded-full bg-[#e3ebe3]" />
      </div>
      <span className="mt-2.5 block h-2 w-full rounded-full bg-[#eef3ee]" />
      <span className="mt-1.5 block h-2 w-2/3 rounded-full bg-[#eef3ee]" />
    </div>
  );
}

function SceneFrame({ children }: { children?: React.ReactNode }) {
  return (
    <div
      aria-hidden
      className="relative h-[220px] overflow-hidden rounded-t-[26px] bg-[linear-gradient(180deg,#f1f7f2_0%,#ffffff_100%)]"
    >
      {children}
    </div>
  );
}

function Field() {
  return (
    <svg viewBox="0 0 430 40" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[26px] w-full">
      <path d="M0 14 C 90 4 180 8 260 13 C 340 18 390 8 430 10 V40 H0Z" fill="#dcebdc" />
      <path d="M0 24 C 110 16 220 30 320 22 C 370 18 405 20 430 22 V40 H0Z" fill="#cfe3cf" />
    </svg>
  );
}

/** Same stage, before the story starts (keeps layout stable under the splash). */
function SceneBackdrop() {
  return (
    <SceneFrame>
      <Field />
    </SceneFrame>
  );
}

function LostRequestScene() {
  return (
    <SceneFrame>
      {/* empty slot left behind */}
      <div className="absolute inset-x-0 top-7 flex justify-center">
        <motion.div
          className="relative h-[76px] w-32 rounded-[18px] border-2 border-dashed border-[#c9d6c9]"
          animate={{ x: [0, -3, 3, -1, 0] }}
          transition={{ delay: 3.05, duration: 0.3 }}
        >
          <motion.span
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 1.8, rotate: -18 }}
            animate={{ opacity: 1, scale: 1, rotate: -10 }}
            transition={{ delay: 2.95, type: "spring", stiffness: 420, damping: 18 }}
          >
            <span className="rounded-lg border-2 border-[#c2402a] bg-white/80 px-2.5 py-0.5 text-[13px] font-black text-[#c2402a]">
              واگذار شد
            </span>
          </motion.span>
        </motion.div>
      </div>

      {/* the request slip: waits, is tugged, drops onto the trailer, leaves */}
      <div className="absolute inset-x-0 top-7 flex justify-center">
        <motion.div
          className="relative z-10"
          animate={{
            x: [0, 0, 0, 0, EXIT_X - BED_OFFSET_X],
            y: [0, 0, DROP_Y, DROP_Y, DROP_Y],
            scale: [1, 1, DROP_SCALE, DROP_SCALE, DROP_SCALE],
          }}
          transition={{
            ...TRAVEL,
            times: [0, 0.4, 0.556, 0.6, 1],
            ease: ["linear", "easeIn", "linear", "easeIn"],
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1, rotate: [0, -5, 5, -3, 0] }}
            transition={{
              opacity: { duration: 0.35 },
              scale: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
              rotate: { delay: 0.5, duration: 0.6, ease: "easeInOut" },
            }}
          >
            <RequestSlip />
          </motion.div>
        </motion.div>
      </div>

      {/* dust kicked up as the tractor pulls away */}
      <div className="absolute inset-x-0 bottom-5 flex justify-center">
        {DUST.map((puff) => (
          <motion.span
            key={puff.x}
            className="absolute rounded-full bg-[#d9c4a3]"
            style={{ width: puff.size, height: puff.size, left: `calc(50% + ${puff.x}px)` }}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: [0, 0.7, 0], scale: [0.4, 1.5, 1.8], x: [0, 14] }}
            transition={{ delay: puff.delay, duration: 0.8, ease: "easeOut" }}
          />
        ))}
      </div>

      {/* the other provider's tractor */}
      <div className="absolute inset-x-0 bottom-[18px] flex justify-center">
        <motion.div
          initial={{ x: ENTER_X }}
          animate={{ x: [ENTER_X, BED_OFFSET_X, BED_OFFSET_X, EXIT_X] }}
          transition={{ ...TRAVEL, times: [0, 0.4, 0.6, 1], ease: ["easeOut", "linear", "easeIn"] }}
        >
          <motion.div
            animate={{ y: [0, -1.5, 0] }}
            transition={{ delay: TRAVEL.delay, duration: 0.3, repeat: 7, ease: "easeInOut" }}
          >
            <Tractor />
          </motion.div>
        </motion.div>
      </div>

      <Field />
    </SceneFrame>
  );
}

export function RequestTakenState({ backHref = "/providers/requests" }: { backHref?: string }) {
  const splashVisible = useSplashStore((state) => state.visible);

  return (
    <MotionConfig reducedMotion="user">
      <div className="overflow-hidden rounded-[26px] bg-surface shadow-[0_18px_40px_-26px_rgba(27,67,50,0.55)] ring-1 ring-border/60">
        {/* On a cold start the launch splash covers the page; play once it lifts. */}
        {splashVisible ? <SceneBackdrop /> : <LostRequestScene />}

        <div className="px-6 pb-6 pt-5 text-center">
          <motion.h2
            className="text-[16px] font-black leading-7 text-foreground"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            این درخواست توسط خدمات‌دهنده دیگری قبول شد
          </motion.h2>
          <motion.p
            className="mt-1.5 text-[12px] leading-6 text-muted-foreground"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            کار به اولین خدمات‌دهنده‌ای سپرده می‌شود که درخواست را قبول کند.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link
              href={backHref}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-[14px] font-black text-primary-foreground shadow-[0_12px_24px_-12px_rgba(45,106,79,0.9)] transition active:scale-[0.98]"
            >
              <ArrowRight className="size-[18px]" strokeWidth={2.4} />
              بازگشت به لیست درخواست‌ها
            </Link>
          </motion.div>
        </div>
      </div>
    </MotionConfig>
  );
}
