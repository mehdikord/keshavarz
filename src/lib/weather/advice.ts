import type { WeatherCurrent } from "@/types/weather";

export type AdviceTone = "good" | "warn" | "bad";

export interface FieldAdvice {
  tone: AdviceTone;
  status: string;
  reason: string;
}

export const ADVICE_TONE_STYLES: Record<AdviceTone, string> = {
  good: "bg-[#d8f3dc] text-[#1b5e3b]",
  warn: "bg-[#fdefd6] text-[#9a5b13]",
  bad: "bg-[#fde2dc] text-[#b23a1f]",
};

/** Rule-of-thumb guidance; thresholds follow common field-spraying practice. */
export function getSprayAdvice(current: WeatherCurrent, rainChance: number): FieldAdvice {
  if (current.wind_kph > 15) {
    return { tone: "bad", status: "نامناسب", reason: "باد شدید؛ خطر بادبردگی سم" };
  }
  if (rainChance >= 50) {
    return { tone: "bad", status: "نامناسب", reason: "احتمال بارش و شسته‌شدن سم" };
  }
  if (current.temp_c >= 30) {
    return { tone: "warn", status: "با احتیاط", reason: "هوای گرم؛ صبح زود یا عصر" };
  }
  return { tone: "good", status: "مناسب", reason: "باد ملایم و هوای پایدار" };
}

export function getIrrigationAdvice(current: WeatherCurrent, rainChance: number): FieldAdvice {
  if (rainChance >= 60) {
    return { tone: "warn", status: "تعویق", reason: "بارش در راه است" };
  }
  if (current.temp_c >= 30 || current.humidity < 30) {
    return { tone: "warn", status: "صبح یا عصر", reason: "تبخیر بالا در ساعات گرم" };
  }
  return { tone: "good", status: "عادی", reason: "شرایط معمول آبیاری" };
}
