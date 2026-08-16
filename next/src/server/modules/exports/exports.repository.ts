import { prisma } from "@/server/db/prisma";
import { EXPORT_MAX_ROWS } from "@/server/modules/exports/exports.schemas";
import { listCompletedFinancialsForExport } from "@/server/modules/reports/reports.repository";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function resolveRange(filters: { from?: string; to?: string }) {
  const now = new Date();
  const to = filters.to ? new Date(filters.to) : now;
  const from = filters.from
    ? new Date(filters.from)
    : new Date(to.getTime() - THIRTY_DAYS_MS);
  return { from, to };
}

export async function listPaymentsForExport(filters: {
  from?: string;
  status?: string;
  to?: string;
}) {
  const { from, to } = resolveRange(filters);
  const rows = await prisma.subscriptionPayment.findMany({
    where: {
      createdAt: { gte: from, lt: to },
      ...(filters.status
        ? {
            status: filters.status as
              | "initiated"
              | "pending"
              | "paid"
              | "failed"
              | "cancelled"
              | "partially_refunded"
              | "refunded",
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: EXPORT_MAX_ROWS + 1,
    select: {
      amountToman: true,
      createdAt: true,
      gateway: true,
      paidAt: true,
      publicId: true,
      status: true,
      user: { select: { publicId: true } },
    },
  });

  const truncated = rows.length > EXPORT_MAX_ROWS;
  const page = truncated ? rows.slice(0, EXPORT_MAX_ROWS) : rows;

  return {
    rows: page.map((row) => ({
      amountToman: Number(row.amountToman),
      createdAt: row.createdAt.toISOString(),
      gateway: row.gateway,
      paidAt: row.paidAt?.toISOString() ?? "",
      paymentId: row.publicId,
      status: row.status,
      userId: row.user.publicId,
    })),
    truncated,
  };
}

export async function listReportsForExport(filters: {
  from?: string;
  to?: string;
}) {
  const { from, to } = resolveRange(filters);
  const rows = await listCompletedFinancialsForExport({
    from,
    limit: EXPORT_MAX_ROWS + 1,
    to,
  });
  const truncated = rows.length > EXPORT_MAX_ROWS;
  const page = truncated ? rows.slice(0, EXPORT_MAX_ROWS) : rows;

  const userIds = [
    ...new Set(
      page.flatMap((row) => [
        row.consumer_user_id.toString(),
        row.provider_user_id.toString(),
      ]),
    ),
  ].map((id) => BigInt(id));
  const landIds = [...new Set(page.map((row) => row.land_id.toString()))].map(
    (id) => BigInt(id),
  );
  const serviceIds = [
    ...new Set(page.map((row) => row.service_id.toString())),
  ].map((id) => BigInt(id));

  const [users, lands, services] = await Promise.all([
    userIds.length
      ? prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, publicId: true },
        })
      : Promise.resolve([]),
    landIds.length
      ? prisma.land.findMany({
          where: { id: { in: landIds } },
          select: { id: true, publicId: true },
        })
      : Promise.resolve([]),
    serviceIds.length
      ? prisma.service.findMany({
          where: { id: { in: serviceIds } },
          select: { id: true, slug: true },
        })
      : Promise.resolve([]),
  ]);

  const userMap = new Map(users.map((user) => [user.id.toString(), user.publicId]));
  const landMap = new Map(lands.map((land) => [land.id.toString(), land.publicId]));
  const serviceMap = new Map(
    services.map((service) => [service.id.toString(), service.slug]),
  );

  return {
    rows: page.map((row) => ({
      agreedPriceToman: Number(row.agreed_price_toman),
      completedAt: row.completed_at.toISOString(),
      consumerUserId: userMap.get(row.consumer_user_id.toString()) ?? "",
      landId: landMap.get(row.land_id.toString()) ?? "",
      providerUserId: userMap.get(row.provider_user_id.toString()) ?? "",
      requestId: row.request_public_id,
      serviceId: serviceMap.get(row.service_id.toString()) ?? "",
    })),
    truncated,
  };
}
