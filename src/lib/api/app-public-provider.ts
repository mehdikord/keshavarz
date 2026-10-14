import * as z from "zod";

import { appApi } from "@/lib/api/app-client";

export const AppPublicProviderServiceSchema = z
  .object({
    categoryName: z.string(),
    description: z.string().nullable(),
    image: z.string().nullable(),
    priceToman: z.number().int(),
    pricingUnit: z.string(),
    serviceId: z.string(),
    serviceName: z.string(),
  })
  .strict();

export const AppPublicProviderGalleryImageSchema = z
  .object({
    caption: z.string().nullable(),
    createdAt: z.string(),
    imageId: z.string(),
    sortOrder: z.number().int(),
    url: z.string(),
  })
  .strict();

export const AppPublicProviderProfileSchema = z
  .object({
    approved: z.boolean(),
    bio: z.string().nullable(),
    gallery: z.array(AppPublicProviderGalleryImageSchema),
    image: z.string().nullable(),
    isAvailable: z.boolean(),
    location: z
      .object({
        cityName: z.string().nullable(),
        provinceName: z.string().nullable(),
      })
      .strict()
      .nullable(),
    name: z.string(),
    providerId: z.string(),
    services: z.array(AppPublicProviderServiceSchema),
    servicesCount: z.number().int(),
    workRadiusKm: z.number().int(),
  })
  .strict();

export type AppPublicProviderProfile = z.infer<
  typeof AppPublicProviderProfileSchema
>;

export type AppPublicProviderService = z.infer<
  typeof AppPublicProviderServiceSchema
>;

export type AppPublicProviderGalleryImage = z.infer<
  typeof AppPublicProviderGalleryImageSchema
>;

export async function fetchPublicProviderProfile(
  providerId: string,
  signal?: AbortSignal,
): Promise<AppPublicProviderProfile> {
  const result = await appApi.get<unknown>(
    `/providers/${encodeURIComponent(providerId)}`,
    { signal },
  );
  return AppPublicProviderProfileSchema.parse(result.data);
}
