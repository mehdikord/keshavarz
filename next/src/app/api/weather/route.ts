import { NextResponse } from "next/server";

import { DEFAULT_MAP_CENTER } from "@/lib/maps/defaults";
import type { WeatherForecastResponse } from "@/types/weather";

const WEATHER_API_BASE = "https://api.weatherapi.com/v1/forecast.json";
const CACHE_SECONDS = 600;

export async function GET(request: Request) {
  const apiKey = process.env.WEATHERAPI_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "کلید WeatherAPI تنظیم نشده است" },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const q =
    lat && lng
      ? `${lat},${lng}`
      : (searchParams.get("q") ??
        `${DEFAULT_MAP_CENTER.lat},${DEFAULT_MAP_CENTER.lng}`);
  const days = searchParams.get("days") ?? "5";

  const url = new URL(WEATHER_API_BASE);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("q", q);
  url.searchParams.set("days", days);
  url.searchParams.set("lang", "fa");
  url.searchParams.set("aqi", "no");
  url.searchParams.set("alerts", "no");

  try {
    const response = await fetch(url.toString(), {
      next: { revalidate: CACHE_SECONDS },
    });

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;

      return NextResponse.json(
        {
          error:
            errorBody?.error?.message ??
            "سرویس آب‌وهوا در دسترس نیست",
        },
        { status: response.status },
      );
    }

    const data = (await response.json()) as WeatherForecastResponse;

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=300`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "خطا در اتصال به سرویس آب‌وهوا" },
      { status: 502 },
    );
  }
}
