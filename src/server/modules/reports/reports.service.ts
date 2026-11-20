import { systemClock } from "@/server/clock/clock";
import { API_ERROR_CODES, ApiError } from "@/server/errors";
import {
  findConsumerTopLand,
  findConsumerTopService,
  findOwnedLandIdByPublicId,
  findProviderProfileIdByUserId,
  findProviderTopService,
  findServiceIdBySlug,
  listConsumerMonthlyCosts,
  listProviderMonthlyRevenue,
  sumConsumerCompletedCosts,
  sumProviderCompletedRevenue,
} from "@/server/modules/reports/reports.repository";
import { REPORTS_TIMEZONE } from "@/server/modules/reports/reports.schemas";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function resolveRange(input: { from?: string; to?: string }) {
  const now = systemClock.now();
  const to = input.to ? new Date(input.to) : now;
  const from = input.from
    ? new Date(input.from)
    : new Date(to.getTime() - THIRTY_DAYS_MS);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from >= to) {
    throw new ApiError(
      400,
      API_ERROR_CODES.validationFailed,
      "بازه تاریخ معتبر نیست.",
    );
  }
  return { from, to };
}

function tehranYear(now: Date): number {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: REPORTS_TIMEZONE,
      year: "numeric",
    }).format(now),
  );
}

export async function getConsumerFinancialSummary(
  userId: bigint,
  query: { from?: string; landId?: string; to?: string },
) {
  const { from, to } = resolveRange(query);
  let landId: bigint | undefined;
  if (query.landId) {
    const land = await findOwnedLandIdByPublicId(userId, query.landId);
    if (!land) {
      throw new ApiError(404, API_ERROR_CODES.notFound, "زمین یافت نشد.");
    }
    landId = land.id;
  }

  const [totals, topService, topLand] = await Promise.all([
    sumConsumerCompletedCosts({ from, landId, to, userId }),
    findConsumerTopService({ from, landId, to, userId }),
    findConsumerTopLand({ from, landId, to, userId }),
  ]);

  return {
    completedCount: totals.completedCount,
    from: from.toISOString(),
    timezone: REPORTS_TIMEZONE,
    to: to.toISOString(),
    topLand,
    topService,
    totalCostToman: totals.totalCostToman,
  };
}

export async function getConsumerMonthlyCosts(
  userId: bigint,
  query: { landId?: string; year?: number },
) {
  const year = query.year ?? tehranYear(systemClock.now());
  let landId: bigint | undefined;
  if (query.landId) {
    const land = await findOwnedLandIdByPublicId(userId, query.landId);
    if (!land) {
      throw new ApiError(404, API_ERROR_CODES.notFound, "زمین یافت نشد.");
    }
    landId = land.id;
  }

  const rows = await listConsumerMonthlyCosts({ landId, userId, year });
  const byMonth = new Map(rows.map((row) => [row.month, row]));
  const months = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const row = byMonth.get(month);
    return {
      count: row?.count ?? 0,
      month,
      totalToman: row?.totalToman ?? 0,
    };
  });

  return { months, timezone: REPORTS_TIMEZONE, year };
}

export async function getProviderFinancialSummary(
  userId: bigint,
  query: { from?: string; serviceId?: string; to?: string },
) {
  const profile = await findProviderProfileIdByUserId(userId);
  if (!profile) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "پروفایل Provider یافت نشد.");
  }

  const { from, to } = resolveRange(query);
  let serviceId: bigint | undefined;
  if (query.serviceId) {
    const service = await findServiceIdBySlug(query.serviceId);
    if (!service) {
      throw new ApiError(404, API_ERROR_CODES.notFound, "خدمت یافت نشد.");
    }
    serviceId = service.id;
  }

  const year = tehranYear(systemClock.now());
  const yearFrom = new Date(Date.UTC(year, 0, 1));
  const yearTo = new Date(Date.UTC(year + 1, 0, 1));

  const [totals, topService, annual] = await Promise.all([
    sumProviderCompletedRevenue({
      from,
      providerProfileId: profile.id,
      serviceId,
      to,
    }),
    findProviderTopService({
      from,
      providerProfileId: profile.id,
      serviceId,
      to,
    }),
    sumProviderCompletedRevenue({
      from: yearFrom,
      providerProfileId: profile.id,
      serviceId,
      to: yearTo,
    }),
  ]);

  return {
    annualRevenueToman: annual.totalRevenueToman,
    completedCount: totals.completedCount,
    from: from.toISOString(),
    timezone: REPORTS_TIMEZONE,
    to: to.toISOString(),
    topService,
    totalRevenueToman: totals.totalRevenueToman,
  };
}

export async function getProviderMonthlyRevenue(
  userId: bigint,
  query: { from?: string; to?: string },
) {
  const profile = await findProviderProfileIdByUserId(userId);
  if (!profile) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "پروفایل Provider یافت نشد.");
  }

  const now = systemClock.now();
  const defaultTo = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );
  const defaultFrom = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1),
  );
  const to = query.to ? new Date(query.to) : defaultTo;
  const from = query.from ? new Date(query.from) : defaultFrom;
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from >= to) {
    throw new ApiError(
      400,
      API_ERROR_CODES.validationFailed,
      "بازه تاریخ معتبر نیست.",
    );
  }

  const rows = await listProviderMonthlyRevenue({
    from,
    providerProfileId: profile.id,
    to,
  });

  const months: Array<{
    count: number;
    month: number;
    totalToman: number;
    year: number;
  }> = [];
  const cursor = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1),
  );
  const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), 1));
  const byKey = new Map(
    rows.map((row) => [`${row.year}-${row.month}`, row]),
  );

  while (cursor < end) {
    const year = cursor.getUTCFullYear();
    const month = cursor.getUTCMonth() + 1;
    const row = byKey.get(`${year}-${month}`);
    months.push({
      count: row?.count ?? 0,
      month,
      totalToman: row?.totalToman ?? 0,
      year,
    });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return {
    from: from.toISOString(),
    months,
    timezone: REPORTS_TIMEZONE,
    to: to.toISOString(),
  };
}
