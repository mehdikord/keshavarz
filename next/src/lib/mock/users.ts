import type { Land, OfferedService, User, UserSubscription } from "@/types";

export const SEED_USER_IDS = {
  ali: "user-ali",
  hassan: "user-hassan",
  reza: "user-reza",
  zahra: "user-zahra",
} as const;

const SEED_TIMESTAMP = "2025-07-01T08:00:00.000Z";

export const SEED_USERS: User[] = [
  {
    id: SEED_USER_IDS.ali,
    phone: "09121111111",
    displayName: "علی رضایی",
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: SEED_USER_IDS.hassan,
    phone: "09122222222",
    displayName: "حسن محمدی",
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: SEED_USER_IDS.reza,
    phone: "09123333333",
    displayName: "رضا کریمی",
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: SEED_USER_IDS.zahra,
    phone: "09123456789",
    displayName: "زهرا احمدی",
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
];

export interface ProviderSeedData {
  workCenter: { lat: number; lng: number };
  workRadiusKm: number;
  offeredServices: OfferedService[];
  subscription: UserSubscription | null;
}

export const SEED_PROVIDER_DATA: Record<string, ProviderSeedData> = {
  [SEED_USER_IDS.ali]: {
    workCenter: { lat: 31.32, lng: 48.68 },
    workRadiusKm: 50,
    offeredServices: [
      { serviceId: "svc-plant-wheat", price: 5_000_000 },
      { serviceId: "svc-harvest-wheat", price: 8_000_000 },
      { serviceId: "svc-spray-pesticide", price: 3_000_000 },
    ],
    subscription: {
      planId: "plan-pro",
      startDate: "2025-06-01T00:00:00.000Z",
      endDate: "2026-06-01T00:00:00.000Z",
      isActive: true,
    },
  },
  [SEED_USER_IDS.hassan]: {
    workCenter: { lat: 32.38, lng: 48.4 },
    workRadiusKm: 30,
    offeredServices: [
      { serviceId: "svc-plow", price: 4_000_000 },
      { serviceId: "svc-plant-corn", price: 6_000_000 },
    ],
    subscription: {
      planId: "plan-basic",
      startDate: "2025-06-15T00:00:00.000Z",
      endDate: "2026-06-15T00:00:00.000Z",
      isActive: true,
    },
  },
  [SEED_USER_IDS.reza]: {
    workCenter: { lat: 32.05, lng: 48.85 },
    workRadiusKm: 80,
    offeredServices: [{ serviceId: "svc-harvest-rice", price: 10_000_000 }],
    subscription: {
      planId: "plan-basic",
      startDate: "2024-01-01T00:00:00.000Z",
      endDate: "2024-12-31T00:00:00.000Z",
      isActive: false,
    },
  },
};

export const SEED_LANDS: Land[] = [
  {
    id: "land-wheat-north",
    userId: SEED_USER_IDS.zahra,
    title: "زمین گندم شمال",
    areaSqm: 5000,
    location: { lat: 31.35, lng: 48.72 },
    description: "زمین گندم در شمال اهواز",
    createdAt: SEED_TIMESTAMP,
  },
  {
    id: "land-vegetables",
    userId: SEED_USER_IDS.zahra,
    title: "زمین سبزیجات",
    areaSqm: 2000,
    location: { lat: 31.28, lng: 48.65 },
    createdAt: SEED_TIMESTAMP,
  },
];

export function findUserByPhone(phone: string): User | undefined {
  return SEED_USERS.find((user) => user.phone === phone);
}

export function getProviderSeedForUser(userId: string): ProviderSeedData | null {
  return SEED_PROVIDER_DATA[userId] ?? null;
}

export function getLandsForUser(userId: string): Land[] {
  return SEED_LANDS.filter((land) => land.userId === userId);
}
