function money(value: bigint | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  return Number(value);
}

function decimal(value: { toString(): string } | string | number | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : value.toString();
}

function canRevealContact(
  status: string,
  relation: "owner" | "assigned" | "invited" | "none",
): boolean {
  if (status !== "in_progress" && status !== "completed") {
    return false;
  }
  return relation === "owner" || relation === "assigned";
}

export function mapConsumerRequestSummary(request: {
  agreedPriceToman: bigint | null;
  assignedProviderNameSnapshot: string | null;
  createdAt: Date;
  landTitleSnapshot: string;
  publicId: string;
  serviceNameSnapshot: string;
  status: string;
  version: number;
}) {
  return {
    agreedPriceToman: money(request.agreedPriceToman),
    assignedProviderName: request.assignedProviderNameSnapshot,
    createdAt: request.createdAt.toISOString(),
    landTitle: request.landTitleSnapshot,
    requestId: request.publicId,
    serviceName: request.serviceNameSnapshot,
    status: request.status,
    version: request.version,
  };
}

export function mapProviderLink(link: {
  distanceKm: { toString(): string } | string | number;
  providerNameSnapshot: string;
  providerPublicId: string;
  servicePriceSnapshotToman: bigint;
  status: string;
  phone?: string | null;
  showPhone: boolean;
}) {
  return {
    distanceKm: Number(Number(decimal(link.distanceKm)).toFixed(2)),
    name: link.providerNameSnapshot,
    phone: link.showPhone ? (link.phone ?? null) : null,
    priceToman: Number(link.servicePriceSnapshotToman),
    providerId: link.providerPublicId,
    status: link.status,
  };
}

export function mapConsumerRequestDetail(input: {
  request: {
    acceptedAt: Date | null;
    agreedPriceToman: bigint | null;
    assignedProviderNameSnapshot: string | null;
    cancelReason: string | null;
    cancelledAt: Date | null;
    completedAt: Date | null;
    consumerNote: string | null;
    createdAt: Date;
    landAreaSquareMetersSnapshot: { toString(): string } | string;
    landLatitudeSnapshot: { toString(): string } | string;
    landLongitudeSnapshot: { toString(): string } | string;
    landTitleSnapshot: string;
    publicId: string;
    serviceCategoryNameSnapshot: string;
    serviceNameSnapshot: string;
    status: string;
    version: number;
  };
  dates: string[];
  links: Array<{
    distanceKm: { toString(): string } | string | number;
    phone: string | null;
    providerNameSnapshot: string;
    providerPublicId: string;
    servicePriceSnapshotToman: bigint;
    status: string;
  }>;
  assignedProviderPublicId: string | null;
}) {
  const status = input.request.status;
  return {
    acceptedAt: input.request.acceptedAt?.toISOString() ?? null,
    agreedPriceToman: money(input.request.agreedPriceToman),
    assignedProviderId: input.assignedProviderPublicId,
    assignedProviderName: input.request.assignedProviderNameSnapshot,
    cancelReason: input.request.cancelReason,
    cancelledAt: input.request.cancelledAt?.toISOString() ?? null,
    completedAt: input.request.completedAt?.toISOString() ?? null,
    consumerNote: input.request.consumerNote,
    createdAt: input.request.createdAt.toISOString(),
    dates: input.dates,
    land: {
      areaSquareMeters: decimal(input.request.landAreaSquareMetersSnapshot),
      latitude: decimal(input.request.landLatitudeSnapshot),
      longitude: decimal(input.request.landLongitudeSnapshot),
      title: input.request.landTitleSnapshot,
    },
    providers: input.links.map((link) =>
      mapProviderLink({
        ...link,
        showPhone:
          canRevealContact(status, "owner") &&
          link.status === "accepted" &&
          link.providerPublicId === input.assignedProviderPublicId,
      }),
    ),
    requestId: input.request.publicId,
    serviceCategoryName: input.request.serviceCategoryNameSnapshot,
    serviceName: input.request.serviceNameSnapshot,
    status,
    version: input.request.version,
  };
}

export function mapProviderRequestSummary(input: {
  distanceKm: { toString(): string } | string | number;
  landTitleSnapshot: string;
  linkStatus: string;
  priceToman: bigint;
  publicId: string;
  sentAt: Date;
  serviceNameSnapshot: string;
  status: string;
  version: number;
}) {
  return {
    distanceKm: Number(Number(decimal(input.distanceKm)).toFixed(2)),
    landTitle: input.landTitleSnapshot,
    linkStatus: input.linkStatus,
    priceToman: Number(input.priceToman),
    requestId: input.publicId,
    sentAt: input.sentAt.toISOString(),
    serviceName: input.serviceNameSnapshot,
    status: input.status,
    version: input.version,
  };
}

export function mapProviderRequestDetail(input: {
  consumerName: string;
  consumerPhone: string | null;
  dates: string[];
  distanceKm: { toString(): string } | string | number;
  isAssigned: boolean;
  linkStatus: string;
  priceToman: bigint;
  request: {
    acceptedAt: Date | null;
    agreedPriceToman: bigint | null;
    cancelReason: string | null;
    cancelledAt: Date | null;
    completedAt: Date | null;
    consumerNote: string | null;
    createdAt: Date;
    landAreaSquareMetersSnapshot: { toString(): string } | string;
    landLatitudeSnapshot: { toString(): string } | string;
    landLongitudeSnapshot: { toString(): string } | string;
    landTitleSnapshot: string;
    publicId: string;
    serviceCategoryNameSnapshot: string;
    serviceNameSnapshot: string;
    status: string;
    version: number;
  };
  viewedAt: Date | null;
}) {
  const relation = input.isAssigned ? "assigned" : "invited";
  const showPhone = canRevealContact(input.request.status, relation);

  return {
    acceptedAt: input.request.acceptedAt?.toISOString() ?? null,
    agreedPriceToman: money(input.request.agreedPriceToman),
    cancelReason: input.request.cancelReason,
    cancelledAt: input.request.cancelledAt?.toISOString() ?? null,
    completedAt: input.request.completedAt?.toISOString() ?? null,
    consumer: {
      name: input.consumerName,
      phone: showPhone ? input.consumerPhone : null,
    },
    consumerNote: input.request.consumerNote,
    createdAt: input.request.createdAt.toISOString(),
    dates: input.dates,
    distanceKm: Number(Number(decimal(input.distanceKm)).toFixed(2)),
    isAssigned: input.isAssigned,
    land: {
      areaSquareMeters: decimal(input.request.landAreaSquareMetersSnapshot),
      latitude: decimal(input.request.landLatitudeSnapshot),
      longitude: decimal(input.request.landLongitudeSnapshot),
      title: input.request.landTitleSnapshot,
    },
    linkStatus: input.linkStatus,
    priceToman: Number(input.priceToman),
    requestId: input.request.publicId,
    serviceCategoryName: input.request.serviceCategoryNameSnapshot,
    serviceName: input.request.serviceNameSnapshot,
    status: input.request.status,
    version: input.request.version,
    viewedAt: input.viewedAt?.toISOString() ?? null,
  };
}

export function mapAdminRequestSummary(request: {
  agreedPriceToman: bigint | null;
  assignedProviderNameSnapshot: string | null;
  consumerPublicId: string;
  createdAt: Date;
  landTitleSnapshot: string;
  publicId: string;
  serviceNameSnapshot: string;
  status: string;
  version: number;
}) {
  return {
    ...mapConsumerRequestSummary(request),
    consumerUserId: request.consumerPublicId,
  };
}

export function mapAdminRequestDetail(input: {
  assignedProviderPublicId: string | null;
  consumerPublicId: string;
  dates: string[];
  links: Array<{
    distanceKm: { toString(): string } | string | number;
    id: bigint;
    phone: string | null;
    providerNameSnapshot: string;
    providerPublicId: string;
    removedReason: string | null;
    rejectionReason: string | null;
    respondedAt: Date | null;
    sentAt: Date;
    servicePriceSnapshotToman: bigint;
    status: string;
    viewedAt: Date | null;
  }>;
  request: {
    acceptedAt: Date | null;
    agreedPriceToman: bigint | null;
    assignedProviderNameSnapshot: string | null;
    cancelReason: string | null;
    cancelledAt: Date | null;
    cancelledBy: string | null;
    completedAt: Date | null;
    consumerNameSnapshot: string;
    consumerNote: string | null;
    createdAt: Date;
    landAreaSquareMetersSnapshot: { toString(): string } | string;
    landLatitudeSnapshot: { toString(): string } | string;
    landLongitudeSnapshot: { toString(): string } | string;
    landTitleSnapshot: string;
    publicId: string;
    serviceCategoryNameSnapshot: string;
    serviceNameSnapshot: string;
    status: string;
    version: number;
  };
}) {
  return {
    acceptedAt: input.request.acceptedAt?.toISOString() ?? null,
    agreedPriceToman: money(input.request.agreedPriceToman),
    assignedProviderId: input.assignedProviderPublicId,
    assignedProviderName: input.request.assignedProviderNameSnapshot,
    cancelReason: input.request.cancelReason,
    cancelledAt: input.request.cancelledAt?.toISOString() ?? null,
    cancelledBy: input.request.cancelledBy,
    completedAt: input.request.completedAt?.toISOString() ?? null,
    consumer: {
      name: input.request.consumerNameSnapshot,
      userId: input.consumerPublicId,
    },
    consumerNote: input.request.consumerNote,
    createdAt: input.request.createdAt.toISOString(),
    dates: input.dates,
    land: {
      areaSquareMeters: decimal(input.request.landAreaSquareMetersSnapshot),
      latitude: decimal(input.request.landLatitudeSnapshot),
      longitude: decimal(input.request.landLongitudeSnapshot),
      title: input.request.landTitleSnapshot,
    },
    providers: input.links.map((link) => ({
      distanceKm: Number(Number(decimal(link.distanceKm)).toFixed(2)),
      linkId: link.id.toString(),
      name: link.providerNameSnapshot,
      phone: link.phone,
      priceToman: Number(link.servicePriceSnapshotToman),
      providerId: link.providerPublicId,
      rejectionReason: link.rejectionReason,
      removedReason: link.removedReason,
      respondedAt: link.respondedAt?.toISOString() ?? null,
      sentAt: link.sentAt.toISOString(),
      status: link.status,
      viewedAt: link.viewedAt?.toISOString() ?? null,
    })),
    requestId: input.request.publicId,
    serviceCategoryName: input.request.serviceCategoryNameSnapshot,
    serviceName: input.request.serviceNameSnapshot,
    status: input.request.status,
    version: input.request.version,
  };
}

export function mapAdminRequestHistories(input: {
  providerLinkHistories: Array<{
    actorAdminId: bigint | null;
    actorType: string;
    actorUserId: bigint | null;
    createdAt: Date;
    fromStatus: string | null;
    id: bigint;
    reason: string | null;
    serviceRequestProviderId: bigint;
    toStatus: string;
  }>;
  statusHistories: Array<{
    actorAdminId: bigint | null;
    actorType: string;
    actorUserId: bigint | null;
    createdAt: Date;
    fromStatus: string | null;
    id: bigint;
    reason: string | null;
    toStatus: string;
  }>;
}) {
  return {
    providerLinkHistories: input.providerLinkHistories.map((row) => ({
      actorAdminId: row.actorAdminId?.toString() ?? null,
      actorType: row.actorType,
      actorUserId: row.actorUserId?.toString() ?? null,
      createdAt: row.createdAt.toISOString(),
      fromStatus: row.fromStatus,
      historyId: row.id.toString(),
      linkId: row.serviceRequestProviderId.toString(),
      reason: row.reason,
      toStatus: row.toStatus,
    })),
    statusHistories: input.statusHistories.map((row) => ({
      actorAdminId: row.actorAdminId?.toString() ?? null,
      actorType: row.actorType,
      actorUserId: row.actorUserId?.toString() ?? null,
      createdAt: row.createdAt.toISOString(),
      fromStatus: row.fromStatus,
      historyId: row.id.toString(),
      reason: row.reason,
      toStatus: row.toStatus,
    })),
  };
}
