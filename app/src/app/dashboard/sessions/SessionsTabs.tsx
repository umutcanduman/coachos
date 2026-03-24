"use client";

import { useState } from "react";

interface SessionItem {
  id: string;
  date: string;
  duration: number;
  type: string;
  status: string;
  clientName: string;
  clientId: string;
  packageType: string;
  reminderStatus: string | null;
}

interface ToScheduleItem {
  id: string;
  name: string;
  packageType: string;
  totalSessions: number;
  usedSessions: number;
  scheduledCount: number;
  remaining: number;
}

interface Props {
  scheduled: SessionItem[];
  toSchedule: ToScheduleItem[];
  past: SessionItem[];
  showReminders?: boolean;
}

const reminderStyles: Record<string, string> = {
  pending: "bg-c-amber-dim text-c-amber",
  sent: "bg-accent-lt text-accent",
  failed: "bg-c-red-dim text-c-red",
};

export default function SessionsTabs({ scheduled, toSchedule, past, showReminders = false }: Props) {
  const [activeTab, setActiveTab] = useState<"scheduled" | "toSchedule" | "past">("scheduled");

  const tabs = [
    { key: "scheduled" as const, label: `Scheduled (${scheduled.length})` },
    { key: "toSchedule" as const, label: `To Schedule (${toSchedule.reduce((s, c) => s + c.remaining, 0)})` },
    { key: "past" as const, label: `Past (${past.length})` },
  ];

  const initials = (name: string) =>
    name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  // Column layout changes when reminders are visible
  const schedCols = showReminders
    ? "grid-cols-[2fr_1.2fr_0.9fr_0.8fr_0.8fr_90px_100px]"
    : "grid-cols-[2.2fr_1.4fr_1fr_0.9fr_0.9fr_100px]";
  const pastCols = schedCols;

  return (
    <div className="flex-1 p-7">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-full border border-border bg-surface-2 p-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`rounded-full px-3.5 py-1.5 text-[0.78rem] font-medium transition-all ${
                activeTab === t.key ? "bg-surface-3 text-text" : "text-text-3 hover:text-text-2"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Scheduled ── */}
      {activeTab === "scheduled" && (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <div className="text-sm font-medium text-text">Scheduled Sessions</div>
              <div className="mt-0.5 text-xs text-text-3">Confirmed dates & times</div>
            </div>
          </div>
          <div className={`grid ${schedCols} items-center gap-4 px-5 py-2.5 text-[0.7rem] font-medium uppercase tracking-[0.1em] text-text-3`}>
            <div>Client</div><div>Package</div><div>Date</div><div>Time</div><div>Duration</div><div>Status</div>
            {showReminders && <div>Reminder</div>}
          </div>
          {scheduled.length === 0 ? (
            <div className="py-16 text-center text-sm text-text-3">
              <div className="mb-3 text-2xl opacity-40">◷</div>No scheduled sessions
            </div>
          ) : scheduled.map(s => {
            const d = new Date(s.date);
            return (
              <div key={s.id} className={`grid ${schedCols} items-center gap-4 border-b border-border px-5 py-3.5 last:border-b-0 hover:bg-surface-2`}>
                <div className="flex items-center gap-3">
                  <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full bg-accent-dim text-xs font-semibold text-accent">{initials(s.clientName)}</div>
                  <div><div className="text-sm font-medium text-text">{s.clientName}</div><div className="text-xs text-text-3">{s.type}</div></div>
                </div>
                <div><span className="inline-flex rounded-full bg-accent-lt px-2.5 py-1 text-[0.7rem] font-medium text-accent">{s.packageType}</span></div>
                <div className="text-[0.8125rem] text-text-3">{d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                <div className="text-[0.8125rem] text-text-3">{d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}</div>
                <div className="text-[0.8125rem] text-text-3">{s.duration} min</div>
                <div><span className="inline-flex rounded-full bg-c-blue-dim px-2.5 py-1 text-[0.7rem] font-medium text-c-blue">Confirmed</span></div>
                {showReminders && (
                  <div>
                    {s.reminderStatus ? (
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[0.7rem] font-medium capitalize ${reminderStyles[s.reminderStatus] ?? "bg-surface-3 text-text-3"}`}>
                        {s.reminderStatus}
                      </span>
                    ) : (
                      <span className="text-xs text-text-3">—</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── To Schedule ── */}
      {activeTab === "toSchedule" && (
        <>
          {toSchedule.length > 0 && (
            <div className="mb-5 flex items-center gap-3 rounded-lg border border-[rgba(168,92,7,0.15)] bg-c-amber-dim px-4 py-3.5">
              <span className="text-base">📅</span>
              <div>
                <div className="text-[0.8125rem] font-medium text-c-amber">
                  {toSchedule.reduce((s, c) => s + c.remaining, 0)} sessions still need to be scheduled across {toSchedule.length} clients.
                </div>
                <div className="mt-0.5 text-xs text-text-3">These are purchased but not yet booked.</div>
              </div>
            </div>
          )}
          <div className="overflow-hidden rounded-card border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div><div className="text-sm font-medium text-text">Remaining Sessions</div><div className="mt-0.5 text-xs text-text-3">Purchased · not yet scheduled</div></div>
            </div>
            <div className="grid grid-cols-[2.2fr_1.4fr_0.8fr_0.8fr_1.2fr_110px] items-center gap-4 px-5 py-2.5 text-[0.7rem] font-medium uppercase tracking-[0.1em] text-text-3">
              <div>Client</div><div>Package</div><div>Used</div><div>Remaining</div><div>Progress</div><div></div>
            </div>
            {toSchedule.length === 0 ? (
              <div className="py-16 text-center text-sm text-text-3"><div className="mb-3 text-2xl opacity-40">✓</div>All sessions are scheduled</div>
            ) : toSchedule.map(c => (
              <div key={c.id} className="grid grid-cols-[2.2fr_1.4fr_0.8fr_0.8fr_1.2fr_110px] items-center gap-4 border-b border-border px-5 py-3.5 last:border-b-0 hover:bg-surface-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full bg-accent-dim text-xs font-semibold text-accent">{initials(c.name)}</div>
                  <div><div className="text-sm font-medium text-text">{c.name}</div><div className="text-xs text-text-3">{c.packageType} · {c.totalSessions} sessions</div></div>
                </div>
                <div>
                  <div className="flex flex-wrap gap-[3px] max-w-[130px]">
                    {Array.from({ length: c.totalSessions }).map((_, i) => (
                      <div key={i} className={`h-2.5 w-2.5 rounded-sm ${i < c.usedSessions ? "bg-accent" : i < c.usedSessions + c.scheduledCount ? "bg-c-blue opacity-50" : "border border-border-2 bg-surface-3"}`} />
                    ))}
                  </div>
                </div>
                <div className="text-sm text-text-2">{c.usedSessions} done</div>
                <div><span className={`inline-flex rounded-full px-2.5 py-1 text-[0.7rem] font-medium ${c.remaining > 3 ? "bg-c-red-dim text-c-red" : "bg-c-amber-dim text-c-amber"}`}>{c.remaining} left</span></div>
                <div className="min-w-[80px]"><div className="h-[5px] overflow-hidden rounded-full bg-surface-3"><div className="h-full rounded-full bg-accent" style={{ width: `${Math.round((c.usedSessions / c.totalSessions) * 100)}%` }} /></div></div>
                <div><button className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-[0.78rem] font-medium text-text-2 hover:bg-surface-3">Schedule</button></div>
              </div>
            ))}
          </div>
          {toSchedule.length > 0 && (
            <div className="mt-3.5 flex justify-center">
              <p className="text-[0.78rem] text-text-3">
                <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-accent align-middle" /> Done{" "}
                <span className="mx-2 mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-c-blue opacity-50 align-middle" /> Scheduled{" "}
                <span className="mx-2 mr-1 inline-block h-2.5 w-2.5 rounded-sm border border-border-2 bg-surface-3 align-middle" /> To schedule
              </p>
            </div>
          )}
        </>
      )}

      {/* ── Past ── */}
      {activeTab === "past" && (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div><div className="text-sm font-medium text-text">Past Sessions</div><div className="mt-0.5 text-xs text-text-3">All completed sessions</div></div>
          </div>
          <div className={`grid ${pastCols} items-center gap-4 px-5 py-2.5 text-[0.7rem] font-medium uppercase tracking-[0.1em] text-text-3`}>
            <div>Client</div><div>Package</div><div>Date</div><div>Time</div><div>Duration</div><div>Status</div>
            {showReminders && <div>Reminder</div>}
          </div>
          {past.length === 0 ? (
            <div className="py-16 text-center text-sm text-text-3"><div className="mb-3 text-2xl opacity-40">◷</div>No past sessions</div>
          ) : past.map(s => {
            const d = new Date(s.date);
            return (
              <div key={s.id} className={`grid ${pastCols} items-center gap-4 border-b border-border px-5 py-3.5 last:border-b-0 hover:bg-surface-2`}>
                <div className="flex items-center gap-3">
                  <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full bg-surface-3 text-xs font-semibold text-text-3">{initials(s.clientName)}</div>
                  <div><div className="text-sm font-medium text-text">{s.clientName}</div><div className="text-xs text-text-3">{s.type}</div></div>
                </div>
                <div><span className="inline-flex rounded-full bg-surface-3 px-2.5 py-1 text-[0.7rem] font-medium text-text-3">{s.packageType}</span></div>
                <div className="text-[0.8125rem] text-text-3">{d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                <div className="text-[0.8125rem] text-text-3">{d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}</div>
                <div className="text-[0.8125rem] text-text-3">{s.duration} min</div>
                <div><span className="inline-flex rounded-full bg-surface-3 px-2.5 py-1 text-[0.7rem] font-medium text-text-3">Done</span></div>
                {showReminders && (
                  <div>
                    {s.reminderStatus ? (
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[0.7rem] font-medium capitalize ${reminderStyles[s.reminderStatus] ?? "bg-surface-3 text-text-3"}`}>
                        {s.reminderStatus}
                      </span>
                    ) : (
                      <span className="text-xs text-text-3">—</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
