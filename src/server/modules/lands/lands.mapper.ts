function decimalToString(value: { toString(): string } | string) {
  return typeof value === "string" ? value : value.toString();
}

export function mapLand(land: {
  areaSquareMeters: { toString(): string } | string;
  createdAt: Date;
  description: string | null;
  latitude: { toString(): string } | string;
  longitude: { toString(): string } | string;
  publicId: string;
  title: string;
  updatedAt: Date;
}) {
  return {
    areaSquareMeters: decimalToString(land.areaSquareMeters),
    createdAt: land.createdAt.toISOString(),
    description: land.description,
    landId: land.publicId,
    latitude: decimalToString(land.latitude),
    longitude: decimalToString(land.longitude),
    title: land.title,
    updatedAt: land.updatedAt.toISOString(),
  };
}
