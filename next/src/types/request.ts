export type RequestStatus =
  | "pending_provider"
  | "in_progress"
  | "completed"
  | "cancelled";

export type RequestProviderStatus =
  | "sent"
  | "accepted"
  | "rejected"
  | "removed";

export type CancelledBy = "consumer" | "provider";

export interface Request {
  id: string;
  consumerId: string;
  landId: string;
  serviceId: string;
  scheduledDates: string[];
  status: RequestStatus;
  assignedProviderId?: string;
  price: number;
  cancelReason?: string;
  cancelledBy?: CancelledBy;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface RequestProvider {
  requestId: string;
  providerId: string;
  status: RequestProviderStatus;
  sentAt: string;
}
