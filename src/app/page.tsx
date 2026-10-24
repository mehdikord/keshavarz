"use client";

import { MotionConfig, motion } from "framer-motion";
import { Leaf } from "lucide-react";

import { FieldWeatherCard } from "@/components/home/field-weather-card";
import { HomeHero } from "@/components/home/home-hero";
import { PanelChoice } from "@/components/home/panel-choice";
import { QuickActions } from "@/components/home/quick-actions";
import { PageContainer } from "@/components/layout/page-container";
import { AuthGuard } from "@/components/shared/auth-guard";
import { useWeather } from "@/hooks/use-weather";
import { useAuthStore } from "@/stores/auth-store";

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function HomePageContent() {
  const user = useAuthStore((state) => state.user);
  const image = useAuthStore((state) => state.image);
  const weather = useWeather();

  return (
    <MotionConfig reducedMotion="user">
      <PageContainer className="gap-7 px-0 pb-10 pt-0">
        <HomeHero
          name={user?.displayName || "کشاورز عزیز"}
          avatarSrc={image}
          weather={weather.data}
          weatherLoading={weather.loading}
        />

        <div className="relative z-10 -mt-6">
          <PanelChoice />
        </div>

        <Reveal delay={0.35}>
          <QuickActions />
        </Reveal>

        <Reveal delay={0.45}>
          <FieldWeatherCard
            data={weather.data}
            loading={weather.loading}
            locating={weather.locating}
            error={weather.error}
            onRetry={weather.retry}
            onLocate={weather.locate}
          />
        </Reveal>

        <footer className="flex flex-col items-center gap-1 pt-2 text-center">
          <span className="flex items-center gap-1.5 text-xs font-bold text-primary/70">
            <Leaf className="size-3.5" />
            کشاورز
          </span>
          <span className="text-[10.5px] text-muted-foreground/80">
            همراه کشاورزان، از کاشت تا برداشت
          </span>
        </footer>
      </PageContainer>
    </MotionConfig>
  );
}

export default function HomePage() {
  return (
    <AuthGuard>
      <HomePageContent />
    </AuthGuard>
  );
}
