import type { RequestStatus } from "@/types";

/** Phone contact is revealed only after the request is accepted/completed. */
export function canShowPhone(status: RequestStatus): boolean {
  return status === "in_progress" || status === "completed";
}
