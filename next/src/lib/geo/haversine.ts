import type { GeoLocation } from "@/types";

const EARTH_RADIUS_KM = 6371;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function haversineKm(a: GeoLocation, b: GeoLocation): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  const distance = 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
  return Math.round(distance * 10) / 10;
}
