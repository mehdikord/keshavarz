import type { Metadata } from "next";
import { Database } from "lucide-react";

import { SettingsSectionForm } from "@/components/admin/settings/settings-section-form";
import { AdminForbidden } from "@/components/admin/shell/forbidden";
import { PageHeader } from "@/components/admin/shell/page-header";
import { Badge } from "@/components/admin/ui/badge";
import { Panel, PanelHeader } from "@/components/admin/ui/panel";
import { formatDateTime } from "@/lib/admin/format";
import { ADMIN_PERMISSIONS, can } from "@/lib/admin/permissions";
import { getAdminPageSession } from "@/server/modules/admin/auth/admin-viewer";
import { getAdminSettings } from "@/server/modules/admin/settings/settings-admin.service";

export const metadata: Metadata = { title: "تنظیمات عمومی" };

export default async function AdminGeneralSettingsPage() {
  const session = await getAdminPageSession();
  if (!session || !can(session.viewer.access, ADMIN_PERMISSIONS.settingsView)) {
    return <AdminForbidden section="تنظیمات" />;
  }
  const canManage = can(session.viewer.access, ADMIN_PERMISSIONS.settingsManage);
  const settings = await getAdminSettings();

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "تنظیمات" }, { label: "تنظیمات عمومی" }]}
        description={
          canManage
            ? "تغییرات حداکثر تا ۳۰ ثانیه بعد در همه بخش‌های سامانه اعمال می‌شود. هر تغییر در گزارش ممیزی ثبت می‌شود."
            : "شما فقط اجازه مشاهده تنظیمات را دارید."
        }
        title="تنظیمات عمومی"
      />
      <nav aria-label="بخش‌های تنظیمات" className="admin-scroll -mx-1 mb-4 flex gap-1 overflow-x-auto px-1 pb-1">
        {settings.sections.map((section) => (
          <a
            className="inline-flex h-9 shrink-0 items-center rounded-[10px] px-3 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-card hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            href={`#section-${section.id}`}
            key={section.id}
          >
            {section.title}
          </a>
        ))}
        {settings.others.length > 0 ? (
          <a
            className="inline-flex h-9 shrink-0 items-center rounded-[10px] px-3 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
            href="#section-others"
          >
            سایر
          </a>
        ) : null}
      </nav>
      <div className="grid gap-5">
        {settings.sections.map((section) => (
          <div className="scroll-mt-20" id={`section-${section.id}`} key={section.id}>
            <SettingsSectionForm
              description={section.description}
              id={section.id}
              items={section.items}
              title={section.title}
            />
          </div>
        ))}
        {settings.others.length > 0 ? (
          <div className="scroll-mt-20" id="section-others">
            <Panel>
              <PanelHeader
                description="مقادیری که در پایگاه داده هستند اما این پنل آن‌ها را نمی‌شناسد. فقط برای مشاهده نمایش داده می‌شوند."
                title="سایر تنظیمات ذخیره‌شده"
              />
              <ul className="divide-y divide-line border-t border-line">
                {settings.others.map((setting) => (
                  <li className="grid gap-2 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-6" key={`${setting.group}.${setting.key}`}>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Database className="size-3.5 text-muted-foreground" />
                        <span className="font-mono text-[12.5px] font-semibold" dir="ltr">
                          {setting.group}.{setting.key}
                        </span>
                        <Badge dot={false}>{setting.valueType}</Badge>
                        {setting.isPublic ? (
                          <Badge dot={false} tone="info">
                            عمومی
                          </Badge>
                        ) : null}
                      </div>
                      {setting.description ? (
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{setting.description}</p>
                      ) : null}
                      <p className="mt-1 text-[11px] text-muted-foreground">آخرین تغییر: {formatDateTime(setting.updatedAt)}</p>
                    </div>
                    <pre
                      className="admin-scroll max-h-40 overflow-auto rounded-lg bg-raised px-3 py-2 text-left font-mono text-[12px] leading-5"
                      dir="ltr"
                    >
                      {setting.value}
                    </pre>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        ) : null}
      </div>
    </>
  );
}
