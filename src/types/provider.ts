import type { GeoLocation } from "@/types/consumer";

export interface OfferedService {
  serviceId: string;
  price: number;
}

export interface ProviderProfile {
  userId: string;
  workCenter: GeoLocation;
  workRadiusKm: number;
  offeredServices: OfferedService[];
}

export type { GeoLocation };
