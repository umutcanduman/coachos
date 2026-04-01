"use client";

import { useState } from "react";
import { createSession } from "./actions";
import Toast from "@/components/Toast";

interface AddSessionModalProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
}

const inputClass = "w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 font-sans text-sm text-text outline-none transition-colors placeholder:text-text-3 focus:border-border-2";
const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-[0.06em] text-text-2";

export default function AddSessionModal({ open, onClose, clientId, clientName }: AddSessionModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const result = await createSession(clientId, new FormData(e.currentTarget));
    setSaving(false);
    if (result.success) {
      setToast({ message: "Session created", type: "success" });
      setTimeout(onClose, 500);
    } else {
      setError(result.error ?? "Failed to create session");
    }
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <>
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-8 backdrop-blur-sm">
        <div className="relative w-full max-w-[480px] rounded-[14px] border border-border-2 bg-surface p-7 shadow-2xl">
          <button onClick={onClose} className="absolute right-5 top-5 border-none bg-transparent text-[1.125rem] text-text-3 transition-colors hover:text-text">✕</button>
          <h2 className="mb-1 font-serif text-2xl font-normal text-text">New Session</h2>
          <p className="mb-6 text-[0.8125rem] text-text-3">Schedule a session with {clientName}</p>

          {error && (
            <div className="mb-4 rounded-lg border border-[rgba(184,50,50,0.15)] bg-c-red-dim px-4 py-3 text-[0.8125rem] text-c-red">{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Date</label>
                <input name="date" type="date" required min={today} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Time</label>
                <input name="time" type="time" required defaultValue="10:00" className={inputClass} />
              </div>
            </div>
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Type</label>
                <select name="type" defaultValue="one-on-one" className={inputClass}>
                  <option value="one-on-one">One-on-One</option>
                  <option value="discovery">Discovery</option>
                  <option value="group">Group</option>
                  <option value="follow-up">Follow-up</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Duration</label>
                <select name="duration" defaultValue="60" className={inputClass}>
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">60 min</option>
                  <option value="90">90 min</option>
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className={labelClass}>Notes</label>
              <textarea name="notes" rows={3} placeholder="Session notes or agenda…" className={inputClass} />
            </div>
            <div className="mt-5 flex justify-end gap-2.5">
              <button type="button" onClick={onClose} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-4 py-2 text-[0.8125rem] font-medium text-text-2 transition-all hover:bg-surface-3">Cancel</button>
              <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-[0.8125rem] font-medium text-white transition-all hover:bg-accent-hover disabled:opacity-50">
                {saving ? "Creating…" : "Create Session"}
              </button>
            </div>
          </form>
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
