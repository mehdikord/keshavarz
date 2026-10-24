"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/utils/format";

interface SearchStepProps {
  index: number;
  title: string;
  /** Shown in the header once the step has a value. */
  summary?: string | null;
  hint: string;
  done: boolean;
  open: boolean;
  optional?: boolean;
  error?: string | null;
  onToggle: () => void;
  children: React.ReactNode;
}

/** Collapsible step card: the open step shows its picker, done steps collapse to a summary. */
export function SearchStep({
  index,
  title,
  summary,
  hint,
  done,
  open,
  optional = false,
  error,
  onToggle,
  children,
}: SearchStepProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-[26px] bg-white transition-shadow duration-300",
        open
          ? "shadow-[0_20px_40px_-24px_rgba(160,86,26,0.6)] ring-2 ring-[#f0c58a]"
          : "shadow-[0_12px_26px_-22px_rgba(160,86,26,0.5)] ring-1 ring-[#efe0c8]",
        error && !open && "ring-2 ring-[#e8a08f]",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-4 text-right"
      >
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full text-[13px] font-black transition-colors",
            done
              ? "bg-[#4f9a55] text-white"
              : open
                ? "bg-[#b9531f] text-white"
                : "bg-[#f6ead8] text-[#a0561a]",
          )}
        >
          {done ? <Check className="size-4" strokeWidth={3} /> : toPersianDigits(index)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="text-[14.5px] font-black text-[#3b2410]">{title}</span>
            {optional ? <span className="text-[11px] text-[#a08463]">(اختیاری)</span> : null}
          </span>
          <span
            className={cn(
              "mt-0.5 block truncate text-[11.5px]",
              error && !open ? "font-bold text-[#b23a1f]" : done ? "font-bold text-[#2f6a35]" : "text-[#8a6a48]",
            )}
          >
            {error && !open ? error : (summary ?? hint)}
          </span>
        </span>
        <ChevronDown
          className={cn("size-5 shrink-0 text-[#a08463] transition-transform duration-300", open && "rotate-180")}
        />
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="px-4 pb-4">
              {children}
              {error ? <p className="mt-3 text-[11.5px] font-bold text-[#b23a1f]">{error}</p> : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
