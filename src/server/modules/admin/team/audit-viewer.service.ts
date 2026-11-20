import { systemClock } from "@/server/clock/clock";
import {
  auditWhere,
  findAdminIdByPublicIdAny,
  findAuditRow,
  listAuditFacets,
  listAuditRows,
  resolveSubjectRefs,
} from "@/server/modules/admin/team/team.repository";
import type { AuditListQuery } from "@/server/modules/admin/team/team.schemas";

export interface AuditSubject {
  href: string | null;
  id: string;
  label: string | null;
  type: string;
}

export interface AuditEntry {
  action: string;
  actor: { id: string; image: string | null; name: string } | null;
  createdAt: string;
  httpMethod: string | null;
  id: string;
  ipAddress: string | null;
  module: string;
  route: string | null;
  subject: AuditSubject | null;
}

interface AuditRowLike {
  action: string;
  admin: { image: string | null; name: string; publicId: string } | null;
  auditableId: bigint | null;
  auditableType: string | null;
  createdAt: Date;
  httpMethod: string | null;
  id: bigint;
  ipAddress: string | null;
  module: string;
  route: string | null;
}

/** Turns audit rows into view models with a link to each subject's page where one exists. */
export async function mapAuditRows(rows: AuditRowLike[]): Promise<AuditEntry[]> {
  const subjects = rows
    .filter((row) => row.auditableType && row.auditableId !== null)
    .map((row) => ({ id: row.auditableId!, type: row.auditableType! }));
  const refs = await resolveSubjectRefs(subjects);
  const byId = <T extends { id: bigint }>(list: T[]) => new Map(list.map((row) => [row.id.toString(), row]));
  const users = byId(refs.users);
  const requests = byId(refs.requests);
  const providers = byId(refs.providers);
  const payments = byId(refs.payments);
  const admins = byId(refs.admins);
  const services = byId(refs.services);
  const categories = byId(refs.categories);
  const subscriptions = byId(refs.subscriptions);
  const plans = byId(refs.plans);
  const roles = byId(refs.roles);

  function subjectOf(type: string, rawId: bigint): AuditSubject {
    const id = rawId.toString();
    const base = { href: null, id, label: null, type };
    switch (type) {
      case "user": {
        const row = users.get(id);
        return row ? { ...base, href: `/admins/users/${row.publicId}`, label: row.name } : base;
      }
      case "service_request": {
        const row = requests.get(id);
        return row ? { ...base, href: `/admins/requests/${row.publicId}`, label: row.serviceNameSnapshot } : base;
      }
      case "provider_profile": {
        const row = providers.get(id);
        return row ? { ...base, href: `/admins/providers/${row.user.publicId}`, label: row.user.name } : base;
      }
      case "subscription_payment": {
        const row = payments.get(id);
        return row ? { ...base, href: `/admins/billing/payments/${row.publicId}`, label: row.publicId } : base;
      }
      case "provider_subscription": {
        const row = subscriptions.get(id);
        return row
          ? {
              ...base,
              href: `/admins/billing/subscriptions?q=${row.providerProfile.user.phone}`,
              label: row.planNameSnapshot,
            }
          : base;
      }
      case "subscription_plan": {
        const row = plans.get(id);
        return { ...base, href: "/admins/billing/plans", label: row?.name ?? null };
      }
      case "admin": {
        const row = admins.get(id);
        return row ? { ...base, href: `/admins/team/admins/${row.publicId}`, label: row.name } : base;
      }
      case "admin_role": {
        const row = roles.get(id);
        return { ...base, href: row ? `/admins/team/roles/${id}` : null, label: row?.name ?? null };
      }
      case "service": {
        const row = services.get(id);
        return row
          ? { ...base, href: `/admins/catalog/services?q=${encodeURIComponent(row.name)}`, label: row.name }
          : base;
      }
      case "service_category":
      case "ServiceCategory": {
        const row = categories.get(id);
        return { ...base, href: "/admins/catalog/categories", label: row?.name ?? null };
      }
      default:
        return base;
    }
  }

  return rows.map((row) => ({
    action: row.action,
    actor: row.admin ? { id: row.admin.publicId, image: row.admin.image, name: row.admin.name } : null,
    createdAt: row.createdAt.toISOString(),
    httpMethod: row.httpMethod,
    id: row.id.toString(),
    ipAddress: row.ipAddress,
    module: row.module,
    route: row.route,
    subject: row.auditableType && row.auditableId !== null ? subjectOf(row.auditableType, row.auditableId) : null,
  }));
}

const DAY_MS = 86_400_000;

/** Calendar dates are Tehran days; the period presets count back from now. */
function auditRange(query: AuditListQuery): { from?: Date; to?: Date } {
  const now = systemClock.now();
  const presets: Record<string, number> = { "30d": 30, "7d": 7, "90d": 90 };
  if (query.period === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { from: start };
  }
  if (presets[query.period]) return { from: new Date(now.getTime() - presets[query.period]! * DAY_MS) };
  return {
    from: query.from ? new Date(`${query.from}T00:00:00+03:30`) : undefined,
    to: query.to ? new Date(new Date(`${query.to}T00:00:00+03:30`).getTime() + DAY_MS) : undefined,
  };
}

export async function listAuditEntries(query: AuditListQuery) {
  let actorId: bigint | null | undefined;
  if (query.actor && query.actor !== "system") {
    actorId = (await findAdminIdByPublicIdAny(query.actor))?.id ?? BigInt(0);
  }
  const where = auditWhere(query, auditRange(query), actorId);
  const [{ rows, total }, facets] = await Promise.all([
    listAuditRows(where, (query.page - 1) * query.perPage, query.perPage),
    listAuditFacets(),
  ]);
  return {
    facets: {
      admins: facets.admins.map((row) => ({ id: row.publicId, name: row.name })),
      modules: facets.modules.map((row) => ({ count: row._count._all, module: row.module })),
      subjectTypes: facets.types.map((row) => ({ count: row._count._all, type: row.auditableType! })),
    },
    items: await mapAuditRows(rows),
    page: query.page,
    pageCount: Math.max(1, Math.ceil(total / query.perPage)),
    perPage: query.perPage,
    total,
  };
}
export type AuditList = Awaited<ReturnType<typeof listAuditEntries>>;

export async function getAuditEntry(id: string) {
  const row = await findAuditRow(BigInt(id));
  if (!row) return null;
  const [entry] = await mapAuditRows([row]);
  return {
    ...entry!,
    metadata: row.metadata,
    newValues: row.newValues,
    oldValues: row.oldValues,
    userAgent: row.userAgent,
  };
}
export type AuditDetail = NonNullable<Awaited<ReturnType<typeof getAuditEntry>>>;
