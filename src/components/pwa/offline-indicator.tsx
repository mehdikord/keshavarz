"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Wifi, WifiOff } from "lucide-react";

import { useOnlineStatus } from "@/hooks/use-online-status";
import { cn } from "@/lib/utils";

const RECONNECTED_VISIBLE_MS = 2_500;

/** Floating pill under the status bar while offline, then a brief "back online". */
export function OfflineIndicator() {
  const online = useOnlineStatus();
  const wasOffline = useRef(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
      return;
    }
    if (!wasOffline.current) return;
    wasOffline.current = false;
    // Reacting to the browser's `online` event, an external system.
    setShowReconnected(true);
    const timer = window.setTimeout(() => setShowReconnected(false), RECONNECTED_VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [online]);

  const state = !online ? "offline" : showReconnected ? "online" : null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top,0px)+0.5rem)] z-[70] flex justify-center px-4"
    >
      <AnimatePresence>
        {state ? (
          <motion.div
            key={state}
            role="status"
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-bold shadow-[0_12px_28px_-12px_rgba(7,29,20,0.55)] ring-1 backdrop-blur-md",
              state === "offline"
                ? "bg-[#2a1a0c]/90 text-[#ffe8c2] ring-white/10"
                : "bg-[#0f3324]/90 text-[#d8f3dc] ring-white/10",
            )}
          >
            {state === "offline" ? (
              <>
                <WifiOff className="size-4 shrink-0" strokeWidth={2.2} />
                اتصال اینترنت برقرار نیست
              </>
            ) : (
              <>
                <Wifi className="size-4 shrink-0" strokeWidth={2.2} />
                اتصال دوباره برقرار شد
              </>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
