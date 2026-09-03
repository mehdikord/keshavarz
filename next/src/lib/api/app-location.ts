import * as z from "zod";

import { appApi } from "@/lib/api/app-client";

export const AppProvinceSchema = z
  .object({
    provinceId: z.string().min(1),
    name: z.string(),
  })
  .strict();

export const AppCitySchema = z
  .object({
    cityId: z.string().min(1),
    name: z.string(),
  })
  .strict();

export type AppProvince = z.infer<typeof AppProvinceSchema>;
export type AppCity = z.infer<typeof AppCitySchema>;

export async function fetchAppProvinces(
  signal?: AbortSignal,
): Promise<AppProvince[]> {
  const result = await appApi.get<unknown>("/locations/provinces", {
    signal,
  });
  return z
    .object({ provinces: z.array(AppProvinceSchema) })
    .strict()
    .parse(result.data).provinces;
}

export async function fetchAppCities(
  provinceId: string,
  signal?: AbortSignal,
): Promise<AppCity[]> {
  const result = await appApi.get<unknown>(
    `/locations/provinces/${encodeURIComponent(provinceId)}/cities`,
    { signal },
  );
  return z
    .object({ cities: z.array(AppCitySchema) })
    .strict()
    .parse(result.data).cities;
}
