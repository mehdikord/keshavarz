import {
  Ban,
  CalendarDays,
  ExternalLink,
  History,
  LandPlot,
  MapPin,
  MessageSquareText,
  Search,
  Send,
  Tractor,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import { CatalogThumb } from "@/components/admin/catalog/catalog-thumb";
import { Avatar } from "@/components/admin/ui/avatar";
import { Badge } from "@/components/admin/ui/badge";
import { CopyButton } from "@/components/admin/ui/copy-button";
import { Ltr, PhoneText } from "@/components/admin/ui/ltr";
import { EmptyState, Panel, PanelHeader } from "@/components/admin/ui/panel";
import {
  faNumber,
  formatArea,
  formatDateTime,
  formatDayMonth,
  formatRelative,
  formatToman,
  formatWeekday,
} from "@/lib/admin/format";
import { PRICING_UNIT, REQUEST_STATUS } from "@/lib/admin/labels";
import { cn } from "@/lib/utils";
import type { AdminRequestDetail } from "@/server/modules/admin/requests/requests-admin.service";

import { RequestHeaderActions, WithdrawLinkButton } from "./request-actions";
import { ACTOR_TYPE, CANCELLED_BY, LINK_REMOVED_REASON, LINK_STATUS } from "./request-labels";
import { RequestStatusBadge } from "./requests-table";

const mapUrl = (latitude: number, longitude: number) => `https://neshan.org/maps/@${latitude},${longitude},16z`;
const statusLabel = (status: string | null) => (status ? (REQUEST_STATUS[status]?.label ?? status) : "ثبت");

// ------------------------------------------------------------------ header

export function RequestHeader({ detail, now }: { detail: AdminRequestDetail; now: Date }) {
  return (
    <Panel className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <CatalogThumb image={detail.service.image} name={detail.service.name} size={64} />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted-foreground">{detail.category}</p>
            <h1 className="mt-0.5 text-[22px] leading-tight font-extrabold tracking-tight">{detail.service.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12.5px] text-muted-foreground">
              <RequestStatusBadge status={detail.status} />
              <span title={formatDateTime(detail.createdAt)}>ثبت {formatRelative(detail.createdAt, now)}</span>
              <span className="inline-flex items-center gap-1">
                <Ltr className="font-mono text-[11.5px]">{detail.id}</Ltr>
                <CopyButton label="کپی شناسه درخواست" value={detail.id} />
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RequestHeaderActions requestId={detail.id} status={detail.status} version={detail.version} />
        </div>
      </div>

      {detail.cancellation ? (
        <div className="mt-4 flex items-start gap-3 rounded-xl bg-danger-soft px-4 py-3 text-[13px] text-danger">
          <Ban className="mt-0.5 size-4 shrink-0" />
          <div className="min-w-0">
            <p className="font-bold">
              لغو شده توسط {CANCELLED_BY[detail.cancellation.by ?? ""] ?? "—"}
              {detail.cancellation.byName ? ` (${detail.cancellation.byName})` : ""}، {formatDateTime(detail.cancellation.at)}
            </p>
            {detail.cancellation.reason ? <p className="mt-1 leading-6 text-foreground/80">{detail.cancellation.reason}</p> : null}
          </div>
        </div>
      ) : null}

      <StatusSteps detail={detail} />
    </Panel>
  );
}

/** Where the request is in its life: sent → accepted → done (or where it stopped). */
function StatusSteps({ detail }: { detail: AdminRequestDetail }) {
  const reached = (status: string) => detail.timeline.some((entry) => entry.to === status) || detail.status === status;
  const steps = [
    { at: detail.createdAt, done: true, label: "ثبت درخواست" },
    {
      at: detail.timeline.find((entry) => entry.to === "pending_provider")?.createdAt ?? null,
      done: reached("pending_provider") || reached("in_progress") || reached("completed"),
      label: "ارسال به خدمات‌دهندگان",
    },
    { at: detail.acceptedAt, done: Boolean(detail.acceptedAt), label: "پذیرش و شروع کار" },
    { at: detail.completedAt, done: detail.status === "completed", label: "انجام کار" },
  ];
  const cancelled = detail.status === "cancelled";

  return (
    <ol className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4 sm:grid-cols-4">
      {steps.map((step, index) => (
        <li className="flex items-start gap-2.5" key={step.label}>
          <span
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
              step.done ? "bg-ok text-white" : cancelled ? "bg-muted text-muted-foreground/60" : "bg-muted text-muted-foreground",
            )}
          >
            {faNumber(index + 1)}
          </span>
          <div className="min-w-0">
            <p className={cn("text-[12.5px] font-semibold", !step.done && "text-muted-foreground")}>{step.label}</p>
            <p className="text-[11px] text-muted-foreground">{step.done && step.at ? formatDateTime(step.at) : "—"}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

// -------------------------------------------------------------- invitations

export function InvitationsPanel({ detail, now }: { detail: AdminRequestDetail; now: Date }) {
  const canWithdraw = detail.status === "pending_provider";
  return (
    <Panel>
      <PanelHeader
        description="خدمات‌دهندگانی که درخواست برایشان ارسال شده و پاسخ هر کدام"
        title={`دعوت‌ها (${faNumber(detail.links.length)})`}
      />
      {detail.links.length === 0 ? (
        <EmptyState icon={<Send />} title="هنوز برای هیچ خدمات‌دهنده‌ای ارسال نشده است" />
      ) : (
        <ul className="divide-y divide-line border-t border-line">
          {detail.links.map((link) => {
            const meta = LINK_STATUS[link.status] ?? { label: link.status, tone: "neutral" as const };
            return (
              <li className="px-5 py-4" key={link.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        className="font-bold underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        href={`/admins/providers/${link.providerId}`}
                      >
                        {link.providerName}
                      </Link>
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                    </div>
                    <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] text-muted-foreground">
                      <PhoneText phone={link.providerPhone} />
                      <span className="tabular-nums">{formatToman(link.priceToman)}</span>
                      <span>{faNumber(link.distanceKm)} کیلومتر فاصله</span>
                    </p>
                  </div>
                  {canWithdraw && link.status === "sent" ? (
                    <WithdrawLinkButton linkId={link.id} providerName={link.providerName} requestId={detail.id} />
                  ) : null}
                </div>
                <p className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-[11.5px] text-muted-foreground">
                  <span>ارسال: {formatRelative(link.sentAt, now)}</span>
                  <span>{link.viewedAt ? `دیده شد: ${formatRelative(link.viewedAt, now)}` : "هنوز دیده نشده"}</span>
                  {link.respondedAt ? <span>پاسخ: {formatRelative(link.respondedAt, now)}</span> : null}
                </p>
                {link.rejectionReason ? (
                  <p className="mt-2 rounded-lg bg-raised px-3 py-2 text-[12.5px]">دلیل رد: {link.rejectionReason}</p>
                ) : null}
                {link.removedReason ? (
                  <p className="mt-2 text-[12px] text-muted-foreground">{LINK_REMOVED_REASON[link.removedReason] ?? link.removedReason}</p>
                ) : null}
                {link.history.length > 0 ? (
                  <details className="group mt-2">
                    <summary className="cursor-pointer text-[12px] font-semibold text-muted-foreground outline-none select-none hover:text-foreground focus-visible:text-foreground">
                      تاریخچه این دعوت ({faNumber(link.history.length)})
                    </summary>
                    <ul className="mt-2 grid gap-1.5 border-r-2 border-line pr-3 text-[12px]">
                      {link.history.map((entry) => (
                        <li key={entry.id}>
                          <span className="font-semibold">
                            {entry.from ? `${LINK_STATUS[entry.from]?.label ?? entry.from} ← ` : ""}
                            {LINK_STATUS[entry.to]?.label ?? entry.to}
                          </span>
                          <span className="text-muted-foreground">
                            {" "}
                            · {ACTOR_TYPE[entry.actor.type]}: {entry.actor.name} · {formatDateTime(entry.createdAt)}
                          </span>
                          {entry.reason ? (
                            <span className="block text-muted-foreground">
                              {LINK_REMOVED_REASON[entry.reason] ?? entry.reason}
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

// --------------------------------------------------------------- candidates

export function CandidatesPanel({ detail }: { detail: AdminRequestDetail }) {
  const invited = new Set(detail.links.map((link) => link.providerId));
  return (
    <Panel className="overflow-hidden">
      <PanelHeader
        description="نتیجه جستجوی خدمات‌گیرنده؛ قیمت و فاصله مربوط به لحظه جستجو است."
        title={`خدمات‌دهندگان پیدا شده (${faNumber(detail.candidates.length)})`}
      />
      {detail.candidates.length === 0 ? (
        <EmptyState icon={<Search />} title="جستجو خدمات‌دهنده‌ای پیدا نکرد" />
      ) : (
        <div className="overflow-x-auto border-t border-line">
          <table className="w-full min-w-[560px] text-[13px]">
            <thead>
              <tr className="border-b border-line text-right text-[11.5px] text-muted-foreground">
                <th className="py-2.5 pr-5 pl-3 font-semibold" scope="col">خدمات‌دهنده</th>
                <th className="px-3 font-semibold" scope="col">قیمت</th>
                <th className="px-3 font-semibold" scope="col">فاصله</th>
                <th className="px-3 pl-5 font-semibold" scope="col">دعوت</th>
              </tr>
            </thead>
            <tbody>
              {detail.candidates.map((candidate) => (
                <tr className="border-b border-line last:border-0" key={candidate.id}>
                  <td className="py-2.5 pr-5 pl-3">
                    <Link className="font-semibold underline-offset-4 hover:underline" href={`/admins/providers/${candidate.providerId}`}>
                      {candidate.providerName}
                    </Link>
                  </td>
                  <td className="px-3 whitespace-nowrap tabular-nums">
                    {formatToman(candidate.priceToman)}
                    <span className="mr-1 text-[11.5px] text-muted-foreground">{PRICING_UNIT[candidate.pricingUnit] ?? ""}</span>
                  </td>
                  <td className="px-3 whitespace-nowrap">{faNumber(candidate.distanceKm)} کیلومتر</td>
                  <td className="px-3 pl-5">
                    {invited.has(candidate.providerId) ? (
                      <Badge dot={false} tone="info">ارسال شده</Badge>
                    ) : (
                      <span className="text-[12px] text-muted-foreground">ارسال نشده</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

// ----------------------------------------------------------------- timeline

export function TimelinePanel({ detail, now }: { detail: AdminRequestDetail; now: Date }) {
  return (
    <Panel>
      <PanelHeader description="هر تغییر وضعیت، چه کسی و چرا" title="تاریخچه وضعیت" />
      {detail.timeline.length === 0 ? (
        <EmptyState icon={<History />} title="تغییری ثبت نشده است" />
      ) : (
        <ol className="relative mx-5 mb-5 border-r border-line">
          {detail.timeline.map((entry) => {
            const tone = REQUEST_STATUS[entry.to]?.tone ?? "neutral";
            return (
              <li className="relative pr-5 pb-4 last:pb-0" key={entry.id}>
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-1.5 -right-[5px] size-2.5 rounded-full ring-4 ring-card",
                    tone === "success" && "bg-ok",
                    tone === "danger" && "bg-danger",
                    tone === "info" && "bg-info",
                    tone === "warning" && "bg-warn",
                    tone === "neutral" && "bg-muted-foreground/60",
                    tone === "wheat" && "bg-wheat",
                  )}
                />
                <p className="text-[13px] font-semibold">
                  {entry.from ? `${statusLabel(entry.from)} ← ` : ""}
                  {statusLabel(entry.to)}
                </p>
                <p className="mt-0.5 text-[11.5px] text-muted-foreground" title={formatDateTime(entry.createdAt)}>
                  {ACTOR_TYPE[entry.actor.type]}: {entry.actor.name} · {formatRelative(entry.createdAt, now)}
                </p>
                {entry.reason ? <p className="mt-1 text-[12.5px] leading-6">{entry.reason}</p> : null}
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}

export function AuditPanel({ detail, now }: { detail: AdminRequestDetail; now: Date }) {
  if (detail.audits.length === 0) return null;
  return (
    <Panel>
      <PanelHeader description="اقداماتی که مدیران روی این درخواست انجام داده‌اند" title="گزارش اقدامات مدیران" />
      <ul className="divide-y divide-line border-t border-line">
        {detail.audits.map((log) => (
          <li className="px-5 py-3" key={log.id}>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-[13px] font-semibold">{log.label}</span>
              <span className="text-[12px] text-muted-foreground" title={formatDateTime(log.createdAt)}>
                {log.adminName ?? "مدیر حذف‌شده"}، {formatRelative(log.createdAt, now)}
              </span>
              {log.ipAddress ? (
                <span className="text-[11px] text-muted-foreground">
                  <Ltr>{log.ipAddress}</Ltr>
                </span>
              ) : null}
            </div>
            {typeof log.newValues?.reason === "string" ? (
              <p className="mt-1 text-[12.5px] leading-6 text-foreground/85">{log.newValues.reason}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

// -------------------------------------------------------------------- aside

function AsideRow({ children, icon, label }: { children: React.ReactNode; icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-start gap-3 px-5 py-3.5">
      <span className="mt-0.5 text-muted-foreground [&_svg]:size-4">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[11.5px] font-medium text-muted-foreground">{label}</p>
        <div className="mt-1 text-[13px]">{children}</div>
      </div>
    </div>
  );
}

export function RequestAside({ detail }: { detail: AdminRequestDetail }) {
  const { land } = detail;
  return (
    <Panel className="divide-y divide-line">
      <AsideRow icon={<UserRound />} label="خدمات‌گیرنده">
        <Link className="group flex items-center gap-2.5" href={`/admins/users/${detail.consumer.id}`}>
          <Avatar image={detail.consumer.image} name={detail.consumer.name} seed={detail.consumer.id} size={32} />
          <span className="min-w-0">
            <span className="block truncate font-semibold group-hover:underline">{detail.consumer.name}</span>
            <PhoneText className="text-[11.5px] text-muted-foreground" phone={detail.consumer.phone} />
          </span>
        </Link>
        {detail.consumer.deleted ? <p className="mt-1 text-[11.5px] text-warn">حساب این کاربر حذف شده است.</p> : null}
      </AsideRow>

      <AsideRow icon={<Tractor />} label="خدمات‌دهنده انتخاب‌شده">
        {detail.provider ? (
          <ProviderIdentity provider={detail.provider} />
        ) : (
          <span className="text-muted-foreground">هنوز کسی درخواست را نپذیرفته است.</span>
        )}
        {detail.agreedPriceToman ? (
          <p className="mt-2 font-bold tabular-nums">{formatToman(detail.agreedPriceToman)}</p>
        ) : null}
      </AsideRow>

      <AsideRow icon={<LandPlot />} label="زمین (در لحظه ثبت)">
        <p className="font-semibold">{land.title}</p>
        <p className="text-[12px] text-muted-foreground">{formatArea(land.areaSquareMeters)}</p>
        {land.currentTitle && land.currentTitle !== land.title ? (
          <p className="text-[11.5px] text-muted-foreground">نام فعلی زمین: {land.currentTitle}</p>
        ) : null}
        <a
          className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold text-info hover:underline"
          href={mapUrl(land.latitude, land.longitude)}
          rel="noreferrer"
          target="_blank"
        >
          <MapPin className="size-3.5" />
          <Ltr>
            {land.latitude.toFixed(5)}, {land.longitude.toFixed(5)}
          </Ltr>
          <ExternalLink className="size-3" />
        </a>
      </AsideRow>

      <AsideRow icon={<CalendarDays />} label="روزهای درخواستی">
        {detail.dates.length === 0 ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {detail.dates.map((date) => (
              <li className="rounded-lg bg-muted px-2 py-1 text-[12px]" key={date}>
                {formatWeekday(date)} {formatDayMonth(date)}
              </li>
            ))}
          </ul>
        )}
      </AsideRow>

      <AsideRow icon={<MessageSquareText />} label="توضیح خدمات‌گیرنده">
        {detail.consumerNote ? (
          <p className="leading-6 whitespace-pre-line">{detail.consumerNote}</p>
        ) : (
          <span className="text-muted-foreground">توضیحی ننوشته است.</span>
        )}
      </AsideRow>

      <div className="px-5 py-3.5 text-[11.5px] leading-6 text-muted-foreground">
        {faNumber(detail.notificationsCount)} اعلان درباره این درخواست ارسال شده است.
        {detail.service.currentName !== detail.service.name ? ` نام فعلی خدمت: «${detail.service.currentName}».` : ""}
        {detail.service.isActive ? "" : " این خدمت اکنون غیرفعال است."}
      </div>
    </Panel>
  );
}

function ProviderIdentity({ provider }: { provider: NonNullable<AdminRequestDetail["provider"]> }) {
  const body = (
    <>
      <Avatar image={provider.image} name={provider.name} seed={provider.id ?? undefined} size={32} />
      <span className="min-w-0">
        <span className="block truncate font-semibold group-hover:underline">{provider.name}</span>
        <PhoneText className="text-[11.5px] text-muted-foreground" phone={provider.phone} />
      </span>
    </>
  );
  // A provider whose profile no longer exists has only the snapshot name.
  return provider.id ? (
    <Link className="group flex items-center gap-2.5" href={`/admins/providers/${provider.id}`}>
      {body}
    </Link>
  ) : (
    <div className="flex items-center gap-2.5">{body}</div>
  );
}
