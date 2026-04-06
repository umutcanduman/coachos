"use client";

import { useState } from "react";
import { createHomework, toggleHomeworkStatus, createGoal, updateGoalProgress, updateSessionNotes } from "./actions";
import Toast from "@/components/Toast";

interface Session {
  id: string;
  date: string;
  duration: number;
  type: string;
  status: string;
  notes: string | null;
}

interface Homework {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: string;
  category: string | null;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  due_date: string | null;
  paid_date: string | null;
  description: string | null;
}

interface Goal {
  id: string;
  title: string;
  progress: number;
  status: string;
}

interface ProfileTabsProps {
  sessions: Session[];
  homework: Homework[];
  payments: Payment[];
  goals: Goal[];
  clientId: string;
  clientCreatedAt: string;
}

const inputClass = "w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 font-sans text-sm text-text outline-none transition-colors placeholder:text-text-3 focus:border-border-2";
const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-[0.06em] text-text-2";

export default function ProfileTabs({
  sessions,
  homework,
  payments,
  goals,
  clientId,
  clientCreatedAt,
}: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState("sessions");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [hwModalOpen, setHwModalOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);

  const tabs = [
    { key: "sessions", label: "Session Notes" },
    { key: "homework", label: `Homework (${homework.length})` },
    { key: "payments", label: "Payments" },
    { key: "goals", label: `Goals (${goals.length})` },
    { key: "timeline", label: "Timeline" },
  ];

  return (
    <div>
      {/* Tabs */}
      <div className="mb-5 flex gap-0 overflow-x-auto border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-[0.8125rem] font-medium transition-colors ${
              activeTab === tab.key
                ? "border-accent text-accent"
                : "border-transparent text-text-3 hover:text-text-2"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Session Notes */}
      {activeTab === "sessions" && (
        <div>
          {sessions.length === 0 ? (
            <EmptyState icon="◷" message="No sessions yet" />
          ) : (
            sessions.map((session) => (
              <SessionNoteCard key={session.id} session={session} clientId={clientId} onToast={(msg, type) => setToast({ message: msg, type })} />
            ))
          )}
        </div>
      )}

      {/* Homework */}
      {activeTab === "homework" && (
        <div>
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => setHwModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-[0.8125rem] font-medium text-white transition-all hover:bg-accent-hover"
            >
              + Add Homework
            </button>
          </div>
          <div className="overflow-hidden rounded-card border border-border bg-surface">
            {homework.length === 0 ? (
              <EmptyState icon="✓" message="No homework assigned" />
            ) : (
              homework.map((hw) => {
                const isOverdue = hw.due_date && new Date(hw.due_date) < new Date() && hw.status !== "completed";
                return (
                  <HomeworkRow
                    key={hw.id}
                    hw={hw}
                    isOverdue={!!isOverdue}
                    clientId={clientId}
                    onToggle={(msg, type) => setToast({ message: msg, type })}
                  />
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Payments */}
      {activeTab === "payments" && (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_80px] items-center gap-4 px-5 py-2.5 text-[0.7rem] font-medium uppercase tracking-[0.08em] text-text-3">
            <div>Description</div><div>Date</div><div>Amount</div><div>Status</div><div></div>
          </div>
          {payments.length === 0 ? (
            <EmptyState icon="◎" message="No payments recorded" />
          ) : (
            payments.map((payment) => (
              <div key={payment.id} className="grid grid-cols-[2fr_1.5fr_1fr_1fr_80px] items-center gap-4 border-b border-border px-5 py-3.5 text-[0.8125rem] last:border-b-0">
                <div className="text-text-2">{payment.description ?? "Payment"}</div>
                <div className="text-text-3">
                  {payment.paid_date
                    ? new Date(payment.paid_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                    : payment.due_date
                    ? `Due ${new Date(payment.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                    : "—"}
                </div>
                <div className="font-medium text-text">€{Number(payment.amount).toLocaleString()}</div>
                <div>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[0.7rem] font-medium ${
                    payment.status === "paid" ? "bg-accent-lt text-accent"
                    : payment.status === "overdue" ? "bg-c-red-dim text-c-red"
                    : "bg-c-amber-dim text-c-amber"
                  }`}>{payment.status}</span>
                </div>
                <div></div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Goals */}
      {activeTab === "goals" && (
        <div>
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => setGoalModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-[0.8125rem] font-medium text-white transition-all hover:bg-accent-hover"
            >
              + Add Goal
            </button>
          </div>
          {goals.length === 0 ? (
            <EmptyState icon="◑" message="No goals set yet" />
          ) : (
            <div className="space-y-3">
              {goals.map((goal) => (
                <GoalRow key={goal.id} goal={goal} clientId={clientId} onUpdate={(msg, type) => setToast({ message: msg, type })} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      {activeTab === "timeline" && (
        <div className="overflow-hidden rounded-card border border-border bg-surface p-5">
          <div className="flex flex-col gap-4">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-start gap-3.5">
                <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-accent-lt text-xs text-accent">◷</div>
                <div>
                  <p className="text-[0.8125rem] text-text-2"><strong className="font-medium text-text">{session.type}</strong> session — {session.status}</p>
                  <time className="text-[0.7rem] text-text-3">{new Date(session.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</time>
                </div>
              </div>
            ))}
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-start gap-3.5">
                <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-c-blue-dim text-xs text-c-blue">◎</div>
                <div>
                  <p className="text-[0.8125rem] text-text-2">Payment of <strong className="font-medium text-text">€{Number(payment.amount).toLocaleString()}</strong> — {payment.status}</p>
                  <time className="text-[0.7rem] text-text-3">
                    {(payment.paid_date || payment.due_date)
                      ? new Date((payment.paid_date ?? payment.due_date)!).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "—"}
                  </time>
                </div>
              </div>
            ))}
            <div className="flex items-start gap-3.5">
              <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-c-purple-dim text-xs text-c-purple">◉</div>
              <div>
                <p className="text-[0.8125rem] text-text-2">Client created</p>
                <time className="text-[0.7rem] text-text-3">{new Date(clientCreatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</time>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Homework Modal */}
      {hwModalOpen && (
        <ModalWrapper onClose={() => setHwModalOpen(false)} title="Add Homework" subtitle="Assign a task for your client">
          <HomeworkForm clientId={clientId} onSuccess={() => { setHwModalOpen(false); setToast({ message: "Homework added", type: "success" }); }} />
        </ModalWrapper>
      )}

      {/* Add Goal Modal */}
      {goalModalOpen && (
        <ModalWrapper onClose={() => setGoalModalOpen(false)} title="Add Goal" subtitle="Set a coaching goal for your client">
          <GoalForm clientId={clientId} onSuccess={() => { setGoalModalOpen(false); setToast({ message: "Goal added", type: "success" }); }} />
        </ModalWrapper>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

/* ── Sub-components ── */

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div className="py-12 text-center text-sm text-text-3">
      <div className="mb-3 text-2xl opacity-40">{icon}</div>
      {message}
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

function HomeworkRow({ hw, isOverdue, clientId, onToggle }: { hw: Homework; isOverdue: boolean; clientId: string; onToggle: (msg: string, type: "success" | "error") => void }) {
  const [pending, setPending] = useState(false);

  async function handleToggle() {
    setPending(true);
    const newStatus = hw.status === "completed" ? "pending" : "completed";
    const result = await toggleHomeworkStatus(hw.id, clientId, newStatus);
    setPending(false);
    onToggle(result.success ? (newStatus === "completed" ? "Marked complete" : "Marked pending") : (result.error ?? "Failed"), result.success ? "success" : "error");
  }

  return (
    <div className="flex items-start gap-3.5 border-b border-border px-5 py-4 last:border-b-0">
      <button
        onClick={handleToggle}
        disabled={pending}
        className={`mt-0.5 flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full border-[1.5px] text-[0.65rem] transition-colors disabled:opacity-50 ${
          hw.status === "completed" ? "border-accent bg-accent text-white" : "border-border-2 hover:border-accent"
        }`}
      >
        {hw.status === "completed" ? "✓" : ""}
      </button>
      <div className="flex-1">
        <h4 className={`text-sm ${hw.status === "completed" ? "text-text-3 line-through" : "text-text"}`}>{hw.title}</h4>
        {hw.description && <p className="text-xs text-text-3">{hw.description}</p>}
      </div>
      <div className={`flex-shrink-0 text-right text-[0.72rem] ${isOverdue ? "text-c-red" : "text-text-3"}`}>
        {hw.due_date ? `Due ${new Date(hw.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}
      </div>
    </div>
  );
}

function GoalRow({ goal, clientId, onUpdate }: { goal: Goal; clientId: string; onUpdate: (msg: string, type: "success" | "error") => void }) {
  const [progress, setProgress] = useState(goal.progress);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (progress === goal.progress) return;
    setSaving(true);
    const result = await updateGoalProgress(goal.id, clientId, progress);
    setSaving(false);
    onUpdate(result.success ? "Goal updated" : (result.error ?? "Failed"), result.success ? "success" : "error");
  }

  const pct = Math.min(Math.max(progress, 0), 100);
  const barColor = pct > 60 ? "bg-accent" : pct >= 30 ? "bg-c-amber" : "bg-c-red";

  return (
    <div className="rounded-lg border border-border bg-surface-2 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[0.8125rem] font-medium text-text">{goal.title}</span>
        <span className={`text-xs font-medium ${pct > 60 ? "text-accent" : pct >= 30 ? "text-c-amber" : "text-c-red"}`}>
          {pct}%
        </span>
      </div>
      <div className="mb-3 h-[5px] overflow-hidden rounded-full bg-surface-3">
        <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={100}
          value={progress}
          onChange={(e) => setProgress(Number(e.target.value))}
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-surface-3 accent-accent"
        />
        <button
          onClick={handleSave}
          disabled={saving || progress === goal.progress}
          className="rounded-lg bg-accent px-3 py-1 text-[0.75rem] font-medium text-white transition-all hover:bg-accent-hover disabled:opacity-30"
        >
          {saving ? "…" : "Save"}
        </button>
      </div>
    </div>
  );
}

function HomeworkForm({ clientId, onSuccess }: { clientId: string; onSuccess: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const result = await createHomework(clientId, new FormData(e.currentTarget));
    setSaving(false);
    if (result.success) onSuccess();
    else setError(result.error ?? "Failed");
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="mb-4 rounded-lg border border-[rgba(184,50,50,0.15)] bg-c-red-dim px-4 py-3 text-[0.8125rem] text-c-red">{error}</div>}
      <div className="mb-4">
        <label className={labelClass}>Title</label>
        <input name="title" type="text" required placeholder="Read Chapter 3" className={inputClass} />
      </div>
      <div className="mb-4">
        <label className={labelClass}>Description</label>
        <textarea name="description" rows={2} placeholder="Details or instructions…" className={inputClass} />
      </div>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Due date</label>
          <input name="due_date" type="date" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Category</label>
          <select name="category" className={inputClass}>
            <option value="">None</option>
            <option value="reading">Reading</option>
            <option value="exercise">Exercise</option>
            <option value="reflection">Reflection</option>
            <option value="action">Action</option>
          </select>
        </div>
      </div>
      <div className="mt-5 flex justify-end">
        <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-[0.8125rem] font-medium text-white transition-all hover:bg-accent-hover disabled:opacity-50">
          {saving ? "Adding…" : "Add Homework"}
        </button>
      </div>
    </form>
  );
}

function GoalForm({ clientId, onSuccess }: { clientId: string; onSuccess: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const result = await createGoal(clientId, new FormData(e.currentTarget));
    setSaving(false);
    if (result.success) onSuccess();
    else setError(result.error ?? "Failed");
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="mb-4 rounded-lg border border-[rgba(184,50,50,0.15)] bg-c-red-dim px-4 py-3 text-[0.8125rem] text-c-red">{error}</div>}
      <div className="mb-4">
        <label className={labelClass}>Goal title</label>
        <input name="title" type="text" required placeholder="Improve work-life balance" className={inputClass} />
      </div>
      <div className="mt-5 flex justify-end">
        <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-[0.8125rem] font-medium text-white transition-all hover:bg-accent-hover disabled:opacity-50">
          {saving ? "Adding…" : "Add Goal"}
        </button>
      </div>
    </form>
  );
}

function SessionNoteCard({ session, clientId, onToast }: { session: Session; clientId: string; onToast: (msg: string, type: "success" | "error") => void }) {
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(session.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const result = await updateSessionNotes(session.id, clientId, notes);
    setSaving(false);
    if (result.success) {
      onToast("Notes saved", "success");
      setEditing(false);
    } else {
      onToast(result.error ?? "Failed to save", "error");
    }
  }

  return (
    <div className="mb-3.5 rounded-lg border border-border bg-surface-2 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-medium text-text">{session.type} Session</h4>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-accent-lt px-2.5 py-1 text-[0.7rem] font-medium text-accent">{session.status}</span>
          <span className="rounded-full bg-surface-3 px-2.5 py-1 text-[0.7rem] font-medium text-text-3">{session.duration} min</span>
          <time className="text-[0.72rem] text-text-3">
            {new Date(session.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </time>
        </div>
      </div>
      {editing ? (
        <div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Add session notes…"
            className={inputClass}
          />
          <div className="mt-2 flex justify-end gap-2">
            <button onClick={() => { setEditing(false); setNotes(session.notes ?? ""); }} className="rounded-lg px-3 py-1 text-[0.75rem] font-medium text-text-3 hover:text-text">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="rounded-lg bg-accent px-3 py-1 text-[0.75rem] font-medium text-white hover:bg-accent-hover disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
          </div>
        </div>
      ) : (
        <div>
          {session.notes ? (
            <p className="mb-2 text-[0.8125rem] leading-relaxed text-text-2">{session.notes}</p>
          ) : (
            <p className="mb-2 text-[0.8125rem] italic text-text-3">No notes for this session</p>
          )}
          <button onClick={() => setEditing(true)} className="text-[0.75rem] font-medium text-accent hover:text-accent-hover">
            {session.notes ? "Edit notes" : "Add notes"}
          </button>
        </div>
      )}
    </div>
  );
}
