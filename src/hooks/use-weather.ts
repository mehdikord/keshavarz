"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchWeather } from "@/lib/weather/client";
import { toast } from "@/lib/toast";
import type { WeatherForecastResponse } from "@/types/weather";

function toMessage(err: unknown) {
  return err instanceof Error ? err.message : "خطا در دریافت آب‌وهوا";
}

/** Loads the forecast once and exposes retry + "use my location" actions. */
export function useWeather() {
  const [data, setData] = useState<WeatherForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (coords?: { lat: number; lng: number }) => {
    setLoading(true);
    setError(null);

    try {
      setData(await fetchWeather(coords ?? {}));
    } catch (err) {
      const message = toMessage(err);
      setError(message);
      toast.error("آب‌وهوا", message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchWeather({})
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(toMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("موقعیت‌یابی در این مرورگر پشتیبانی نمی‌شود");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void load({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }).finally(() => setLocating(false));
        toast.success("موقعیت دریافت شد", "آب‌وهوای منطقه شما به‌روزرسانی شد");
      },
      (geoError) => {
        setLocating(false);
        if (geoError.code === geoError.PERMISSION_DENIED) {
          toast.error("دسترسی به موقعیت رد شد", "لطفاً مجوز موقعیت را فعال کنید");
          return;
        }
        toast.error("خطا در دریافت موقعیت");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  }, [load]);

  return {
    data,
    loading,
    locating,
    error,
    retry: () => void load(),
    locate,
  };
}
