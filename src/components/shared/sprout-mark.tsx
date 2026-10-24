"use client";

import { motion } from "framer-motion";

interface SproutMarkProps {
  className?: string;
  /** Seed drop + growth intro; off for the small inline loader. */
  intro?: boolean;
  stemColor?: string;
  leafColor?: string;
  leafAltColor?: string;
  soilColor?: string;
}

const EASE_GROW = [0.34, 1.56, 0.64, 1] as const;

/** A seed that drops, roots and grows into the app's sprout mark, then sways. */
export function SproutMark({
  className,
  intro = true,
  stemColor = "#d8f3dc",
  leafColor = "#74c69d",
  leafAltColor = "#b7e4c7",
  soilColor = "rgba(216,243,220,0.25)",
}: SproutMarkProps) {
  const delay = (seconds: number) => (intro ? seconds : seconds * 0.4);

  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden>
      <motion.ellipse
        cx="60"
        cy="94"
        rx="30"
        ry="5"
        fill={soilColor}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
        transition={{ duration: 0.5, delay: delay(0.1) }}
      />

      {intro ? (
        <motion.ellipse
          cx="60"
          rx="4"
          ry="5.5"
          fill="#e9c46a"
          initial={{ cy: 6, opacity: 0 }}
          animate={{ cy: [6, 90, 90], opacity: [0, 1, 0], scaleY: [1, 1, 0.4] }}
          style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
          transition={{ duration: 0.9, times: [0, 0.6, 1], ease: "easeIn" }}
        />
      ) : null}

      <motion.g
        style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
        animate={{ rotate: [-2.5, 2.5, -2.5] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: delay(1.8) }}
      >
        <motion.path
          d="M60 92 C 60 78 59 66 60 48"
          fill="none"
          stroke={stemColor}
          strokeWidth="5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, delay: delay(0.75), ease: "easeOut" }}
        />
        <motion.path
          d="M59.5 68 C 46 67 37 57 38 44 C 51 45 59.5 54 59.5 68Z"
          fill={leafColor}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{ transformBox: "fill-box", transformOrigin: "100% 100%" }}
          transition={{ duration: 0.6, delay: delay(1.15), ease: EASE_GROW }}
        />
        <motion.path
          d="M60.5 58 C 74 57 83 46 82 32 C 69 34 60.5 43 60.5 58Z"
          fill={leafAltColor}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{ transformBox: "fill-box", transformOrigin: "0% 100%" }}
          transition={{ duration: 0.6, delay: delay(1.35), ease: EASE_GROW }}
        />
      </motion.g>
    </svg>
  );
}
