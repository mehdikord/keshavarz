"use client";

import { AnimatePresence, motion } from "framer-motion";

export type FarmStage = "phone" | "otp" | "success";

const SPROUTS = [8, 20, 32, 44, 56, 68, 80, 92];

/** A sprout that grows out of the soil, then sways; becomes wheat on success. */
function Crop({ x, index, ripe }: { x: number; index: number; ripe: boolean }) {
  return (
    <motion.g
      style={{ transformOrigin: "50% 100%", transformBox: "fill-box" }}
      initial={{ scaleY: 0, opacity: 0 }}
      animate={{ scaleY: 1, opacity: 1 }}
      transition={{ delay: 0.6 + index * 0.09, duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <motion.g
        style={{ transformOrigin: "50% 100%", transformBox: "fill-box" }}
        animate={{ rotate: [-3, 3, -3] }}
        transition={{ duration: 3 + (index % 3) * 0.6, repeat: Infinity, ease: "easeInOut", delay: index * 0.2 }}
      >
        <svg x={`${x - 3}%`} y="0" width="6%" height="100%" viewBox="0 0 24 48" preserveAspectRatio="xMidYMax meet" overflow="visible">
          <path d="M12 48 V18" stroke={ripe ? "#7a4a12" : "#2f7d4a"} strokeWidth="2.2" strokeLinecap="round" />
          {ripe ? (
            <g fill="#a8661a">
              {[4, 10, 16].map((y) => (
                <g key={y}>
                  <ellipse cx="8.5" cy={y + 4} rx="3" ry="4.5" transform={`rotate(-28 8.5 ${y + 4})`} />
                  <ellipse cx="15.5" cy={y + 4} rx="3" ry="4.5" transform={`rotate(28 15.5 ${y + 4})`} />
                </g>
              ))}
              <ellipse cx="12" cy="4" rx="2.6" ry="4" />
            </g>
          ) : (
            <g fill="#52b788">
              <path d="M12 26 C 4 24 2 16 3 12 C 9 13 12 18 12 26Z" />
              <path d="M12 22 C 20 20 22 12 21 8 C 15 9 12 14 12 22Z" fill="#74c69d" />
            </g>
          )}
        </svg>
      </motion.g>
    </motion.g>
  );
}

function Tractor() {
  return (
    <svg viewBox="0 0 64 40" className="h-full w-full" aria-hidden>
      <rect x="22" y="10" width="16" height="14" rx="2" fill="#c9611f" />
      <rect x="25" y="13" width="10" height="7" rx="1" fill="#ffe8c2" />
      <path d="M36 18 H54 a3 3 0 0 1 3 3 V27 H36Z" fill="#e8892c" />
      <rect x="49" y="10" width="3" height="9" rx="1" fill="#5c3a10" />
      <circle cx="28" cy="29" r="9" fill="#3b2410" />
      <circle cx="28" cy="29" r="4" fill="#a8a29e" />
      <circle cx="52" cy="32" r="6" fill="#3b2410" />
      <circle cx="52" cy="32" r="2.5" fill="#a8a29e" />
    </svg>
  );
}

export function FarmScene({ stage }: { stage: FarmStage }) {
  const ripe = stage === "success";

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-0"
        animate={{
          background: ripe
            ? "linear-gradient(175deg,#fff4d6 0%,#ffd98a 55%,#f4a94f 100%)"
            : "linear-gradient(175deg,#dff3ff 0%,#e9f7ec 52%,#cfe9c9 100%)",
        }}
        transition={{ duration: 1.2 }}
      />

      <motion.div
        className="absolute left-[8%] size-16 rounded-full bg-gradient-to-br from-[#fff7d1] via-[#ffd27f] to-[#f4a261]"
        initial={{ top: "70%", opacity: 0 }}
        animate={{ top: ripe ? "40%" : "46%", opacity: 1 }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="animate-sun-glow absolute inset-0 rounded-full" />
      </motion.div>

      {[
        { top: "16%", size: "w-24", duration: 38, delay: 0 },
        { top: "30%", size: "w-16", duration: 30, delay: -12 },
        { top: "10%", size: "w-14", duration: 46, delay: -26 },
      ].map((cloud) => (
        <motion.div
          key={cloud.top}
          className={`absolute ${cloud.size} h-6`}
          style={{ top: cloud.top }}
          initial={{ left: "-30%" }}
          animate={{ left: "110%" }}
          transition={{ duration: cloud.duration, repeat: Infinity, ease: "linear", delay: cloud.delay }}
        >
          <span className="absolute inset-x-0 bottom-0 h-4 rounded-full bg-white/90" />
          <span className="absolute bottom-1 left-[20%] size-6 rounded-full bg-white/90" />
          <span className="absolute bottom-0.5 left-[48%] size-5 rounded-full bg-white/90" />
        </motion.div>
      ))}

      {[0, 1, 2].map((bird) => (
        <motion.svg
          key={bird}
          viewBox="0 0 20 8"
          className="absolute w-4 text-[#3b4a3b]/50"
          style={{ top: `${22 + bird * 5}%` }}
          initial={{ right: "-8%" }}
          animate={{ right: "110%" }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear", delay: bird * 1.4 + 2 }}
        >
          <path d="M0 6 Q5 0 10 5 Q15 0 20 6" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </motion.svg>
      ))}

      <svg viewBox="0 0 400 140" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[46%] w-full">
        <motion.path
          d="M0 60 C 80 30 160 40 230 56 C 300 72 360 34 400 44 V140 H0Z"
          animate={{ fill: ripe ? "#e9b54f" : "#95d5b2" }}
          transition={{ duration: 1.2 }}
        />
        <motion.path
          d="M0 86 C 100 60 200 98 290 80 C 340 70 380 72 400 78 V140 H0Z"
          animate={{ fill: ripe ? "#d99a3a" : "#52b788" }}
          transition={{ duration: 1.2 }}
        />
        <g fill="none" stroke="#1b4332" strokeOpacity="0.12" strokeWidth="1.5">
          <path d="M0 100 C 100 76 200 112 290 96 C 340 87 380 88 400 94" />
          <path d="M0 112 C 100 90 200 122 290 108 C 340 100 380 101 400 106" />
          <path d="M0 124 C 100 104 200 132 290 120 C 340 113 380 114 400 118" />
        </g>
      </svg>

      <svg className="absolute inset-x-0 bottom-[16%] h-[24%] w-full" preserveAspectRatio="none">
        {SPROUTS.map((x, index) => (
          <Crop key={x} x={x} index={index} ripe={ripe} />
        ))}
      </svg>

      <AnimatePresence>
        {stage === "otp" ? (
          <motion.div
            key="tractor"
            className="absolute bottom-[33%] h-10 w-16"
            initial={{ left: "-20%" }}
            animate={{ left: "115%" }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
          >
            <motion.div animate={{ y: [0, -1.5, 0] }} transition={{ duration: 0.35, repeat: Infinity }}>
              <Tractor />
            </motion.div>
            {[0, 1, 2].map((puff) => (
              <motion.span
                key={puff}
                className="absolute -left-2 bottom-1 size-3 rounded-full bg-[#c9b48a]/60"
                animate={{ x: [-2, -18], y: [0, -6], opacity: [0.7, 0], scale: [0.6, 1.4] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: puff * 0.3 }}
              />
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {ripe
          ? Array.from({ length: 14 }, (_, i) => (
              <motion.span
                key={i}
                className="absolute size-2.5 rounded-full"
                style={{
                  left: "50%",
                  top: "55%",
                  background: i % 2 ? "#e9b54f" : "#52b788",
                  borderRadius: i % 3 ? "60% 0 60% 0" : "50%",
                }}
                initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                animate={{
                  x: Math.cos((i / 14) * Math.PI * 2) * (90 + (i % 4) * 25),
                  y: Math.sin((i / 14) * Math.PI * 2) * (70 + (i % 3) * 20) - 30,
                  opacity: 0,
                  rotate: 220,
                }}
                transition={{ duration: 1.3, ease: "easeOut" }}
              />
            ))
          : null}
      </AnimatePresence>
    </div>
  );
}
