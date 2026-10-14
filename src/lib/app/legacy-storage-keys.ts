/**
 * Legacy Zustand persist keys from the retired mock domain layer.
 * Cleared on bootstrap so old browsers do not keep stale domain SoT.
 */
export const LEGACY_APP_STORAGE_KEYS = {
  auth: "keshavarz-auth",
  provider: "keshavarz-provider",
  consumer: "keshavarz-consumer",
  requests: "keshavarz-requests",
  notifications: "keshavarz-notifications",
  catalog: "keshavarz-catalog",
  initialized: "keshavarz-initialized",
} as const;
