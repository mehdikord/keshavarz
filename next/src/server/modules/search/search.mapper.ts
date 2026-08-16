export function mapSearchContext(context: {
  categoryName: string;
  categorySlug: string;
  consumerNote: string | null;
  dates: string[];
  expiresAt: Date;
  landPublicId: string;
  landTitle: string;
  searchId: string;
  serviceName: string;
  serviceSlug: string;
}) {
  return {
    categoryId: context.categorySlug,
    categoryName: context.categoryName,
    consumerNote: context.consumerNote,
    dates: context.dates,
    expiresAt: context.expiresAt.toISOString(),
    landId: context.landPublicId,
    landTitle: context.landTitle,
    searchId: context.searchId,
    serviceId: context.serviceSlug,
    serviceName: context.serviceName,
  };
}

export function mapSearchProvider(provider: {
  distanceKm: number;
  previousStatus: "rejected" | "sent" | null;
  priceToman: bigint | number;
  pricingUnit: string;
  providerName: string | null;
  providerPublicId: string;
}) {
  return {
    distanceKm: Number(provider.distanceKm.toFixed(2)),
    name: provider.providerName,
    previousStatus: provider.previousStatus,
    priceToman: Number(provider.priceToman),
    pricingUnit: provider.pricingUnit,
    providerId: provider.providerPublicId,
  };
}
