import type { WeatherForecastResponse, WeatherQuery } from "@/types/weather";

export async function fetchWeather(
  query: WeatherQuery = {},
): Promise<WeatherForecastResponse> {
  const params = new URLSearchParams();

  if (query.lat !== undefined && query.lng !== undefined) {
    params.set("lat", String(query.lat));
    params.set("lng", String(query.lng));
  } else if (query.q) {
    params.set("q", query.q);
  }

  const response = await fetch(`/api/weather?${params.toString()}`);

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? "دریافت اطلاعات آب‌وهوا ناموفق بود");
  }

  return response.json() as Promise<WeatherForecastResponse>;
}

export function getWeatherIconUrl(iconPath: string): string {
  if (iconPath.startsWith("http")) return iconPath;
  return `https:${iconPath}`;
}
