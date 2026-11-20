/**
 * - available: eligible right now and not yet sent → selectable
 * - unavailable: found earlier, no longer eligible (subscription ended, moved…)
 * - sent / rejected / accepted / removed: the provider's link on this request
 */
export type CandidateState =
  | "available"
  | "unavailable"
  | "sent"
  | "rejected"
  | "accepted"
  | "removed";

export function mapCandidate(input: {
  distanceKm: number;
  image: string | null;
  name: string;
  otherRequestStatus: "rejected" | "sent" | null;
  phone: string | null;
  priceToman: bigint;
  pricingUnit: string;
  providerPublicId: string;
  state: CandidateState;
}) {
  return {
    declinedBefore: input.otherRequestStatus === "rejected",
    distanceKm: Number(input.distanceKm.toFixed(2)),
    image: input.image,
    name: input.name,
    phone: input.phone,
    priceToman: Number(input.priceToman),
    pricingUnit: input.pricingUnit,
    providerId: input.providerPublicId,
    sentInOtherRequest: input.otherRequestStatus === "sent",
    state: input.state,
  };
}

export function mapCandidateRequestContext(request: {
  assignedProviderNameSnapshot: string | null;
  consumerNote: string | null;
  createdAt: Date;
  dates: string[];
  land: { publicId: string };
  landAreaSquareMetersSnapshot: { toString(): string };
  landTitleSnapshot: string;
  publicId: string;
  service: { image: string | null } | null;
  serviceCategoryNameSnapshot: string;
  serviceNameSnapshot: string;
  status: string;
  version: number;
}) {
  return {
    assignedProviderName: request.assignedProviderNameSnapshot,
    categoryName: request.serviceCategoryNameSnapshot,
    consumerNote: request.consumerNote,
    createdAt: request.createdAt.toISOString(),
    dates: request.dates,
    landAreaSquareMeters: request.landAreaSquareMetersSnapshot.toString(),
    landId: request.land.publicId,
    landTitle: request.landTitleSnapshot,
    requestId: request.publicId,
    serviceImage: request.service?.image ?? null,
    serviceName: request.serviceNameSnapshot,
    status: request.status,
    version: request.version,
  };
}
