"use client";

import { useState } from "react";
import { savePrepNotes } from "./today-actions";
import Toast from "@/components/Toast";

interface SessionBrief {
  sessionId: string;
  clientName: string;
  packageName: string | null;
  sessionNumber: number;
  totalSessions: number;
  date: string;
  lastSessionDate: string | null;
  lastSessionNotes: string | null;
  homework: { title: string; status: string }[];
  goals: { title: string; progress: number }[];
  prepNotes: string | null;
}

interface Props {
  brief: SessionBrief;
  open: boolean;
  onClose: () => void;
}

const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-[0.06em] text-text-2";

export default function PreSessionModal({ brief, open, onClose }: Props) {
  const [notes, setNotes] = useState(brief.prepNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showLastSession, setShowLastSession] = useState(true);

  if (!open) return null;

  async function handleSave() {
    setSaving(true);
    const r = await savePrepNotes(brief.sessionId, notes);
    setSaving(false);
    if (r.success) {
      setToast({ message: "Prep notes saved", type: "success" });
    } else {
      setToast({ message: r.error ?? "Failed", type: "error" });
    }
  }

  const initials = brief.clientName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <>
      <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4">
        <div className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-[14px] border border-border-2 bg-surface p-5 shadow-2xl sm:max-w-[600px] sm:rounded-[14px] sm:p-7">
          <button onClick={onClose} className="absolute right-5 top-5 text-text-3 hover:text-text">✕</button>

          {/* Header */}
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-dim text-sm font-semibold text-accent">{initials}</div>
            <div>
              <h2 className="font-serif text-xl text-text">{brief.clientName}</h2>
              <p className="text-[0.78rem] text-text-3">
                {brief.packageName ?? "No package"} · Session {brief.sessionNumber} of {brief.totalSessions}
              </p>
            </div>
          </div>

          {/* Last session */}
          {brief.lastSessionDate && (
            <div className="mb-4 rounded-lg border border-border bg-surface-2">
              <button
                type="button"
                onClick={() => setShowLastSession((v) => !v)}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-[0.8125rem] font-medium text-text-2"
              >
                Last session — {new Date(brief.lastSessionDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                <span className={`text-text-3 transition-transform ${showLastSession ? "rotate-180" : ""}`}>▾</span>
              </button>
              {showLastSession && brief.lastSessionNotes && (
                <div className="border-t border-border px-4 py-3 text-[0.8125rem] leading-relaxed text-text-3 whitespace-pre-wrap">
                  {brief.lastSessionNotes}
                </div>
              )}
              {showLastSession && !brief.lastSessionNotes && (
                <div className="border-t border-border px-4 py-3 text-[0.78rem] text-text-3">No notes from last session</div>
              )}
            </div>
          )}

          {/* Homework */}
          <div className="mb-4">
            <div className={labelClass}>Homework</div>
            {brief.homework.length === 0 ? (
              <div className="text-[0.78rem] text-text-3">No homework assigned</div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {brief.homework.map((hw, i) => (
                  <div key={i} className="flex items-center gap-2 text-[0.8125rem]">
                    <span className={`h-2 w-2 rounded-full ${hw.status === "completed" ? "bg-accent" : "bg-c-amber"}`} />
                    <span className={hw.status === "completed" ? "text-text-3 line-through" : "text-text-2"}>{hw.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Goals */}
          <div className="mb-4">
            <div className={labelClass}>Goals</div>
            {brief.goals.length === 0 ? (
              <div className="text-[0.78rem] text-text-3">No goals set</div>
            ) : (
              <div className="flex flex-col gap-2">
                {brief.goals.map((g, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between text-[0.8125rem]">
                      <span className="text-text-2">{g.title}</span>
                      <span className="text-xs text-text-3">{g.progress}%</span>
                    </div>
                    <div className="mt-1 h-[4px] overflow-hidden rounded-full bg-surface-3">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${g.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Prep notes */}
          <div className="mb-4">
            <div className={labelClass}>Prep notes</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              maxLength={3000}
              placeholder="What do you want to focus on in this session?"
              className="w-full resize-y rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text outline-none placeholder:text-text-3 focus:border-border-2"
            />
          </div>

          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-[44px] items-center rounded-lg border border-border bg-surface-2 px-4 py-2 text-[0.8125rem] font-medium text-text-2 hover:bg-surface-3"
            >Close</button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex min-h-[44px] items-center rounded-lg bg-accent px-4 py-2 text-[0.8125rem] font-medium text-white hover:bg-accent-hover disabled:opacity-50"
            >{saving ? "Saving…" : "Save notes"}</button>
          </div>
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
