"use client";

import { useState } from "react";
import { addSession, editSession, scheduleSession } from "./actions";
import Toast from "@/components/Toast";

interface SessionItem {
  id: string;
  date: string;
  duration: number;
  type: string;
  status: string;
  notes: string | null;
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
  completedCount: number;
  scheduledCount: number;
  remaining: number;
}

interface ClientOption {
  id: string;
  name: string;
}

interface Props {
  scheduled: SessionItem[];
  toSchedule: ToScheduleItem[];
  past: SessionItem[];
  showReminders?: boolean;
  clients: ClientOption[];
}

const reminderStyles: Record<string, string> = {
  pending: "bg-c-amber-dim text-c-amber",
  sent: "bg-accent-lt text-accent",
  failed: "bg-c-red-dim text-c-red",
};

const inputClass = "w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 font-sans text-sm text-text outline-none transition-colors placeholder:text-text-3 focus:border-border-2";
const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-[0.06em] text-text-2";

export default function SessionsTabs({ scheduled, toSchedule, past, showReminders = false, clients }: Props) {
  const [activeTab, setActiveTab] = useState<"scheduled" | "toSchedule" | "past">("scheduled");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModal, setEditModal] = useState<SessionItem | null>(null);
  const [scheduleModal, setScheduleModal] = useState<ToScheduleItem | null>(null);

  const tabs = [
    { key: "scheduled" as const, label: `Scheduled (${scheduled.length})` },
    { key: "toSchedule" as const, label: `To Schedule (${toSchedule.reduce((s, c) => s + c.remaining, 0)})` },
    { key: "past" as const, label: `Past (${past.length})` },
  ];

  const initials = (name: string) =>
    name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const schedCols = showReminders
    ? "grid-cols-[2fr_1.2fr_0.9fr_0.8fr_0.8fr_90px_80px_100px]"
    : "grid-cols-[2.2fr_1.4fr_1fr_0.9fr_0.9fr_100px_80px]";
  const pastCols = schedCols;

  return (
    <div className="flex-1 p-4 lg:p-7">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex gap-1 overflow-x-auto rounded-full border border-border bg-surface-2 p-1">
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
        <div className="ml-auto">
          <button
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-[0.8125rem] font-medium text-white transition-all hover:bg-accent-hover"
          >
            + Add Session
          </button>
        </div>
      </div>

      {/* Scheduled */}
      {activeTab === "scheduled" && (
        <div className="overflow-hidden overflow-x-auto rounded-card border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <div className="text-sm font-medium text-text">Scheduled Sessions</div>
              <div className="mt-0.5 text-xs text-text-3">Confirmed dates & times</div>
            </div>
          </div>
          <div className={`grid min-w-[750px] ${schedCols} items-center gap-4 px-5 py-2.5 text-[0.7rem] font-medium uppercase tracking-[0.1em] text-text-3`}>
            <div>Client</div><div>Package</div><div>Date</div><div>Time</div><div>Duration</div><div>Status</div><div></div>
            {showReminders && <div>Reminder</div>}
          </div>
          {scheduled.length === 0 ? (
            <div className="py-16 text-center text-sm text-text-3"><div className="mb-3 text-2xl opacity-40">◷</div>No scheduled sessions</div>
          ) : scheduled.map(s => {
            const d = new Date(s.date);
            return (
              <div key={s.id} className={`grid min-w-[750px] ${schedCols} items-center gap-4 border-b border-border px-5 py-3.5 last:border-b-0 hover:bg-surface-2`}>
                <div className="flex items-center gap-3">
                  <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full bg-accent-dim text-xs font-semibold text-accent">{initials(s.clientName)}</div>
                  <div><div className="text-sm font-medium text-text">{s.clientName}</div><div className="text-xs text-text-3">{s.type}</div></div>
                </div>
                <div><span className="inline-flex rounded-full bg-accent-lt px-2.5 py-1 text-[0.7rem] font-medium text-accent">{s.packageType}</span></div>
                <div className="text-[0.8125rem] text-text-3">{d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                <div className="text-[0.8125rem] text-text-3">{d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}</div>
                <div className="text-[0.8125rem] text-text-3">{s.duration} min</div>
                <div><span className="inline-flex rounded-full bg-c-blue-dim px-2.5 py-1 text-[0.7rem] font-medium text-c-blue">Confirmed</span></div>
                <div>
                  <button onClick={() => setEditModal(s)} className="text-[0.78rem] font-medium text-accent hover:text-accent-hover">Edit</button>
                </div>
                {showReminders && (
                  <div>
                    {s.reminderStatus ? (
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[0.7rem] font-medium capitalize ${reminderStyles[s.reminderStatus] ?? "bg-surface-3 text-text-3"}`}>{s.reminderStatus}</span>
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

      {/* To Schedule */}
      {activeTab === "toSchedule" && (
        <>
          {toSchedule.length > 0 && (
            <div className="mb-5 flex items-center gap-3 rounded-lg border border-[rgba(168,92,7,0.15)] bg-c-amber-dim px-4 py-3.5">
              <span className="text-base">📅</span>
              <div>
                <div className="text-[0.8125rem] font-medium text-c-amber">{toSchedule.reduce((s, c) => s + c.remaining, 0)} sessions still need to be scheduled across {toSchedule.length} clients.</div>
                <div className="mt-0.5 text-xs text-text-3">These are purchased but not yet booked.</div>
              </div>
            </div>
          )}
          <div className="overflow-hidden rounded-card border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div><div className="text-sm font-medium text-text">Remaining Sessions</div><div className="mt-0.5 text-xs text-text-3">Purchased · not yet scheduled</div></div>
            </div>
            <div className="grid grid-cols-[2fr_1.6fr_1.6fr_110px] items-center gap-4 px-5 py-2.5 text-[0.7rem] font-medium uppercase tracking-[0.1em] text-text-3">
              <div>Client</div><div>Breakdown</div><div>Sessions</div><div></div>
            </div>
            {toSchedule.length === 0 ? (
              <div className="py-16 text-center text-sm text-text-3"><div className="mb-3 text-2xl opacity-40">✓</div>All sessions are scheduled</div>
            ) : toSchedule.map(c => (
              <div key={c.id} className="grid grid-cols-[2fr_1.6fr_1.6fr_110px] items-center gap-4 border-b border-border px-5 py-3.5 last:border-b-0 hover:bg-surface-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full bg-accent-dim text-xs font-semibold text-accent">{initials(c.name)}</div>
                  <div>
                    <div className="text-sm font-medium text-text">{c.name}</div>
                    <div className="text-xs text-text-3">{c.packageType}</div>
                  </div>
                </div>
                <div>
                  <div className="flex flex-wrap gap-[3px] max-w-[160px]">
                    {Array.from({ length: c.totalSessions }).map((_, i) => (
                      <div key={i} className={`h-2.5 w-2.5 rounded-sm ${
                        i < c.completedCount
                          ? "bg-accent"
                          : i < c.completedCount + c.scheduledCount
                          ? "border-2 border-c-blue bg-c-blue-dim"
                          : "border border-border-2 bg-surface-3"
                      }`} />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[0.8125rem] text-text-2">
                    <span className="text-accent font-medium">{c.completedCount}</span>
                    <span className="text-text-3"> completed · </span>
                    <span className="text-c-blue font-medium">{c.scheduledCount}</span>
                    <span className="text-text-3"> scheduled · </span>
                    <span className={`font-medium ${c.remaining > 3 ? "text-c-red" : "text-c-amber"}`}>{c.remaining}</span>
                    <span className="text-text-3"> to schedule</span>
                  </div>
                </div>
                <div><button onClick={() => setScheduleModal(c)} className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-[0.78rem] font-medium text-text-2 hover:bg-surface-3">Schedule</button></div>
              </div>
            ))}
          </div>
          {toSchedule.length > 0 && (
            <div className="mt-3.5 flex justify-center">
              <p className="text-[0.78rem] text-text-3">
                <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-accent align-middle" /> Completed{" "}
                <span className="mx-2 mr-1 inline-block h-2.5 w-2.5 rounded-sm border-2 border-c-blue bg-c-blue-dim align-middle" /> Scheduled{" "}
                <span className="mx-2 mr-1 inline-block h-2.5 w-2.5 rounded-sm border border-border-2 bg-surface-3 align-middle" /> To schedule
              </p>
            </div>
          )}
        </>
      )}

      {/* Past */}
      {activeTab === "past" && (
        <div className="overflow-hidden overflow-x-auto rounded-card border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div><div className="text-sm font-medium text-text">Past Sessions</div><div className="mt-0.5 text-xs text-text-3">All completed sessions</div></div>
          </div>
          <div className={`grid min-w-[750px] ${pastCols} items-center gap-4 px-5 py-2.5 text-[0.7rem] font-medium uppercase tracking-[0.1em] text-text-3`}>
            <div>Client</div><div>Package</div><div>Date</div><div>Time</div><div>Duration</div><div>Status</div><div></div>
            {showReminders && <div>Reminder</div>}
          </div>
          {past.length === 0 ? (
            <div className="py-16 text-center text-sm text-text-3"><div className="mb-3 text-2xl opacity-40">◷</div>No past sessions</div>
          ) : past.map(s => (
            <PastSessionRow key={s.id} session={s} cols={pastCols} showReminders={showReminders} onEdit={() => setEditModal(s)} />
          ))}
        </div>
      )}

      {/* Add Session Modal */}
      {addModalOpen && (
        <ModalWrapper onClose={() => setAddModalOpen(false)} title="New Session" subtitle="Schedule a new coaching session">
          <AddSessionForm clients={clients} onSuccess={() => { setAddModalOpen(false); setToast({ message: "Session created", type: "success" }); }} onError={(msg) => setToast({ message: msg, type: "error" })} />
        </ModalWrapper>
      )}

      {/* Edit Session Modal */}
      {editModal && (
        <ModalWrapper onClose={() => setEditModal(null)} title="Edit Session" subtitle={`Session with ${editModal.clientName}`}>
          <EditSessionForm session={editModal} onSuccess={() => { setEditModal(null); setToast({ message: "Session updated", type: "success" }); }} onError={(msg) => setToast({ message: msg, type: "error" })} />
        </ModalWrapper>
      )}

      {/* Schedule Modal */}
      {scheduleModal && (
        <ModalWrapper onClose={() => setScheduleModal(null)} title="Schedule Session" subtitle={`Book a session for ${scheduleModal.name}`}>
          <ScheduleForm clientId={scheduleModal.id} onSuccess={() => { setScheduleModal(null); setToast({ message: "Session scheduled", type: "success" }); }} onError={(msg) => setToast({ message: msg, type: "error" })} />
        </ModalWrapper>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function ModalWrapper({ onClose, title, subtitle, children }: { onClose: () => void; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-8">
      <div className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-[14px] border border-border-2 bg-surface p-5 shadow-2xl sm:max-w-[480px] sm:rounded-[14px] sm:p-7">
        <button onClick={onClose} className="absolute right-5 top-5 border-none bg-transparent text-[1.125rem] text-text-3 transition-colors hover:text-text">✕</button>
        <h2 className="mb-1 font-serif text-2xl font-normal text-text">{title}</h2>
        <p className="mb-6 text-[0.8125rem] text-text-3">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}

function AddSessionForm({ clients, onSuccess, onError }: { clients: ClientOption[]; onSuccess: () => void; onError: (msg: string) => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const result = await addSession(new FormData(e.currentTarget));
    setSaving(false);
    if (result.success) { onSuccess(); } else { setError(result.error ?? "Failed"); onError(result.error ?? "Failed"); }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="mb-4 rounded-lg border border-[rgba(184,50,50,0.15)] bg-c-red-dim px-4 py-3 text-[0.8125rem] text-c-red">{error}</div>}
      <div className="mb-4">
        <label className={labelClass}>Client</label>
        <select name="client_id" required className={inputClass}>
          <option value="">Select client</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div><label className={labelClass}>Date</label><input name="date" type="date" required min={today} className={inputClass} /></div>
        <div><label className={labelClass}>Time</label><input name="time" type="time" required defaultValue="10:00" className={inputClass} /></div>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div><label className={labelClass}>Type</label>
          <select name="type" defaultValue="one-on-one" className={inputClass}>
            <option value="one-on-one">One-on-One</option><option value="discovery">Discovery</option><option value="group">Group</option><option value="follow-up">Follow-up</option>
          </select>
        </div>
        <div><label className={labelClass}>Duration</label>
          <select name="duration" defaultValue="60" className={inputClass}>
            <option value="30">30 min</option><option value="45">45 min</option><option value="60">60 min</option><option value="90">90 min</option>
          </select>
        </div>
      </div>
      <div className="mb-4"><label className={labelClass}>Notes</label><textarea name="notes" rows={2} placeholder="Session notes…" className={inputClass} /></div>
      <div className="mt-5 flex justify-end gap-2.5">
        <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-[0.8125rem] font-medium text-white transition-all hover:bg-accent-hover disabled:opacity-50">{saving ? "Creating…" : "Create Session"}</button>
      </div>
    </form>
  );
}

function EditSessionForm({ session, onSuccess, onError }: { session: SessionItem; onSuccess: () => void; onError: (msg: string) => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const d = new Date(session.date);
  const dateStr = d.toISOString().split("T")[0];
  const timeStr = d.toTimeString().slice(0, 5);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const result = await editSession(session.id, new FormData(e.currentTarget));
    setSaving(false);
    if (result.success) { onSuccess(); } else { setError(result.error ?? "Failed"); onError(result.error ?? "Failed"); }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="mb-4 rounded-lg border border-[rgba(184,50,50,0.15)] bg-c-red-dim px-4 py-3 text-[0.8125rem] text-c-red">{error}</div>}
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div><label className={labelClass}>Date</label><input name="date" type="date" required defaultValue={dateStr} className={inputClass} /></div>
        <div><label className={labelClass}>Time</label><input name="time" type="time" required defaultValue={timeStr} className={inputClass} /></div>
      </div>
      <div className="mb-4 grid grid-cols-3 gap-4">
        <div><label className={labelClass}>Type</label>
          <select name="type" defaultValue={session.type} className={inputClass}>
            <option value="one-on-one">One-on-One</option><option value="discovery">Discovery</option><option value="group">Group</option><option value="follow-up">Follow-up</option>
          </select>
        </div>
        <div><label className={labelClass}>Duration</label>
          <select name="duration" defaultValue={session.duration} className={inputClass}>
            <option value="30">30 min</option><option value="45">45 min</option><option value="60">60 min</option><option value="90">90 min</option>
          </select>
        </div>
        <div><label className={labelClass}>Status</label>
          <select name="status" defaultValue={session.status} className={inputClass}>
            <option value="scheduled">Scheduled</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="no-show">No-show</option>
          </select>
        </div>
      </div>
      <div className="mb-4"><label className={labelClass}>Notes</label><textarea name="notes" rows={3} defaultValue={session.notes ?? ""} placeholder="Session notes…" className={inputClass} /></div>
      <div className="mt-5 flex justify-end gap-2.5">
        <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-[0.8125rem] font-medium text-white transition-all hover:bg-accent-hover disabled:opacity-50">{saving ? "Saving…" : "Save Changes"}</button>
      </div>
    </form>
  );
}

function ScheduleForm({ clientId, onSuccess, onError }: { clientId: string; onSuccess: () => void; onError: (msg: string) => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const result = await scheduleSession(clientId, new FormData(e.currentTarget));
    setSaving(false);
    if (result.success) { onSuccess(); } else { setError(result.error ?? "Failed"); onError(result.error ?? "Failed"); }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="mb-4 rounded-lg border border-[rgba(184,50,50,0.15)] bg-c-red-dim px-4 py-3 text-[0.8125rem] text-c-red">{error}</div>}
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div><label className={labelClass}>Date</label><input name="date" type="date" required min={today} className={inputClass} /></div>
        <div><label className={labelClass}>Time</label><input name="time" type="time" required defaultValue="10:00" className={inputClass} /></div>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div><label className={labelClass}>Type</label>
          <select name="type" defaultValue="one-on-one" className={inputClass}>
            <option value="one-on-one">One-on-One</option><option value="discovery">Discovery</option><option value="group">Group</option><option value="follow-up">Follow-up</option>
          </select>
        </div>
        <div><label className={labelClass}>Duration</label>
          <select name="duration" defaultValue="60" className={inputClass}>
            <option value="30">30 min</option><option value="45">45 min</option><option value="60">60 min</option><option value="90">90 min</option>
          </select>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2.5">
        <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-[0.8125rem] font-medium text-white transition-all hover:bg-accent-hover disabled:opacity-50">{saving ? "Scheduling…" : "Schedule Session"}</button>
      </div>
    </form>
  );
}

function PastSessionRow({ session: s, cols, showReminders, onEdit }: { session: SessionItem; cols: string; showReminders: boolean; onEdit: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const d = new Date(s.date);
  const ini = s.clientName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const hasNotes = !!s.notes;
  const preview = hasNotes && s.notes!.length > 100 ? s.notes!.slice(0, 100) + "…" : s.notes;

  return (
    <div className="border-b border-border last:border-b-0">
      <div className={`grid min-w-[750px] ${cols} items-center gap-4 px-5 py-3.5 hover:bg-surface-2`}>
        <div className="flex items-center gap-3">
          <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full bg-surface-3 text-xs font-semibold text-text-3">{ini}</div>
          <div><div className="text-sm font-medium text-text">{s.clientName}</div><div className="text-xs text-text-3">{s.type}</div></div>
        </div>
        <div><span className="inline-flex rounded-full bg-surface-3 px-2.5 py-1 text-[0.7rem] font-medium text-text-3">{s.packageType}</span></div>
        <div className="text-[0.8125rem] text-text-3">{d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
        <div className="text-[0.8125rem] text-text-3">{d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}</div>
        <div className="text-[0.8125rem] text-text-3">{s.duration} min</div>
        <div><span className="inline-flex rounded-full bg-surface-3 px-2.5 py-1 text-[0.7rem] font-medium text-text-3">Done</span></div>
        <div><button onClick={onEdit} className="text-[0.78rem] font-medium text-accent hover:text-accent-hover">Edit</button></div>
        {showReminders && (
          <div>
            {s.reminderStatus ? (
              <span className={`inline-flex rounded-full px-2.5 py-1 text-[0.7rem] font-medium capitalize ${reminderStyles[s.reminderStatus] ?? "bg-surface-3 text-text-3"}`}>{s.reminderStatus}</span>
            ) : (
              <span className="text-xs text-text-3">—</span>
            )}
          </div>
        )}
      </div>
      {hasNotes && (
        <div className="px-5 pb-3">
          <div className="ml-[42px] rounded-lg bg-surface-2 px-4 py-2.5">
            <p className="text-[0.8125rem] leading-relaxed text-text-2">{expanded ? s.notes : preview}</p>
            {s.notes!.length > 100 && (
              <button onClick={() => setExpanded(!expanded)} className="mt-1 text-[0.75rem] font-medium text-accent hover:text-accent-hover">
                {expanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
