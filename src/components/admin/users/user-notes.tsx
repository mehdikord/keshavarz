"use client";

import { NotebookPen, Pin, PinOff, Trash2 } from "lucide-react";
import { useState } from "react";

import { useCan } from "@/components/admin/shell/admin-context";
import { Button } from "@/components/admin/ui/button";
import { Textarea } from "@/components/admin/ui/input";
import { EmptyState, Panel, PanelHeader } from "@/components/admin/ui/panel";
import { Tooltip } from "@/components/admin/ui/tooltip";
import { useAdminAction } from "@/components/admin/ui/use-admin-action";
import { adminApi } from "@/lib/admin/api";
import { faNumber, formatDateTime, formatRelative } from "@/lib/admin/format";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { cn } from "@/lib/utils";
import type { AdminUserNote } from "@/server/modules/admin/users/users.service";

export function UserNotes({ notes, now, userId }: { notes: AdminUserNote[]; now: string; userId: string }) {
  const canWrite = useCan(ADMIN_PERMISSIONS.usersUpdate);
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const create = useAdminAction();
  const update = useAdminAction();
  const nowDate = new Date(now);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const ok = await create.run(() => adminApi.post(`/users/${userId}/notes`, { body, isPinned: pinned }), "یادداشت ثبت شد.");
    if (ok) {
      setBody("");
      setPinned(false);
    }
  }

  return (
    <Panel>
      <PanelHeader
        description="فقط مدیران این یادداشت‌ها را می‌بینند."
        title={notes.length ? `یادداشت‌های داخلی (${faNumber(notes.length)})` : "یادداشت‌های داخلی"}
      />
      {canWrite ? (
        <form className="px-5 pb-4" onSubmit={submit}>
          <Textarea
            aria-label="یادداشت جدید"
            className="min-h-20 text-[13px]"
            maxLength={2000}
            onChange={(event) => setBody(event.target.value)}
            placeholder="مثلاً: تماس گرفت و گفت کد تأیید را دریافت نمی‌کند"
            value={body}
          />
          {create.errors.body ? <p className="mt-1 text-xs text-danger">{create.errors.body}</p> : null}
          <div className="mt-2 flex items-center justify-between gap-2">
            <label className="flex cursor-pointer items-center gap-2 text-[12.5px] text-muted-foreground">
              <input
                checked={pinned}
                className="size-4 accent-[var(--primary)]"
                onChange={(event) => setPinned(event.target.checked)}
                type="checkbox"
              />
              سنجاق بالای فهرست
            </label>
            <Button disabled={body.trim().length < 2} loading={create.pending} size="sm" type="submit">
              ثبت یادداشت
            </Button>
          </div>
        </form>
      ) : null}
      {notes.length === 0 ? (
        <EmptyState className="pt-4" icon={<NotebookPen />} title="هنوز یادداشتی ثبت نشده است" />
      ) : (
        <ul className="grid gap-2 px-5 pb-5">
          {notes.map((note) => (
            <li
              className={cn(
                "group rounded-xl border px-3.5 py-3",
                note.isPinned ? "border-wheat/40 bg-wheat-soft/60" : "border-line bg-raised",
              )}
              key={note.id}
            >
              <p className="text-[13px] leading-6 whitespace-pre-line">{note.body}</p>
              <div className="mt-2 flex items-center gap-2 text-[11.5px] text-muted-foreground">
                {note.isPinned ? <Pin className="size-3.5 text-wheat-ink" /> : null}
                <span className="min-w-0 flex-1 truncate" title={formatDateTime(note.createdAt)}>
                  {note.adminName ?? "مدیر حذف‌شده"}، {formatRelative(note.createdAt, nowDate)}
                </span>
                {canWrite ? (
                  <span className="flex items-center gap-0.5 opacity-70 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <Tooltip content={note.isPinned ? "برداشتن سنجاق" : "سنجاق کردن"}>
                      <Button
                        aria-label={note.isPinned ? "برداشتن سنجاق" : "سنجاق کردن"}
                        disabled={update.pending}
                        onClick={() =>
                          update.run(
                            () => adminApi.patch(`/users/${userId}/notes/${note.id}`, { isPinned: !note.isPinned }),
                            note.isPinned ? "سنجاق برداشته شد." : "یادداشت سنجاق شد.",
                          )
                        }
                        size="icon-sm"
                        variant="ghost"
                      >
                        {note.isPinned ? <PinOff /> : <Pin />}
                      </Button>
                    </Tooltip>
                    {confirmingId === note.id ? (
                      <Button
                        autoFocus
                        loading={update.pending}
                        onBlur={() => setConfirmingId(null)}
                        onClick={() => {
                          void update.run(() => adminApi.delete(`/users/${userId}/notes/${note.id}`), "یادداشت حذف شد.");
                          setConfirmingId(null);
                        }}
                        size="sm"
                        variant="danger-soft"
                      >
                        حذف شود
                      </Button>
                    ) : (
                      <Tooltip content="حذف یادداشت">
                        <Button
                          aria-label="حذف یادداشت"
                          disabled={update.pending}
                          onClick={() => setConfirmingId(note.id)}
                          size="icon-sm"
                          variant="ghost"
                        >
                          <Trash2 />
                        </Button>
                      </Tooltip>
                    )}
                  </span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
