"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeSessionFlow } from "./today-actions";
import Toast from "@/components/Toast";

interface Props {
  sessionId: string;
  clientName: string;
  pendingPayment: { id: string; amount: number } | null;
  open: boolean;
  onClose: () => void;
}

const inputClass = "w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 font-sans text-sm text-text outline-none placeholder:text-text-3 focus:border-border-2";
const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-[0.06em] text-text-2";

export default function PostSessionModal({ sessionId, clientName, pendingPayment, open, onClose }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState(0);
  const [hwTitle, setHwTitle] = useState("");
  const [hwDesc, setHwDesc] = useState("");
  const [hwDue, setHwDue] = useState("");
  const [skipHw, setSkipHw] = useState(false);
  const [nextDate, setNextDate] = useState("");
  const [nextTime, setNextTime] = useState("");
  const [nextDuration, setNextDuration] = useState(60);
  const [skipNext, setSkipNext] = useState(false);
  const [markPaid, setMarkPaid] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  if (!open) return null;

  async function handleFinish() {
    setSaving(true);
    const r = await completeSessionFlow(sessionId, {
      notes,
      rating: rating > 0 ? rating : null,
      homework: !skipHw && hwTitle.trim() ? { title: hwTitle, description: hwDesc, due_date: hwDue } : null,
      nextSession: !skipNext && nextDate && nextTime ? { date: nextDate, time: nextTime, duration: nextDuration } : null,
      markPaymentPaid: markPaid && pendingPayment ? pendingPayment.id : null,
    });
    setSaving(false);
    if (r.success) {
      setToast({ message: "Session completed", type: "success" });
      setTimeout(() => {
        onClose();
        router.refresh();
      }, 800);
    } else {
      setToast({ message: r.error ?? "Failed", type: "error" });
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4">
        <div className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-[14px] border border-border-2 bg-surface p-5 shadow-2xl sm:max-w-[520px] sm:rounded-[14px] sm:p-7">
          <button onClick={onClose} className="absolute right-5 top-5 text-text-3 hover:text-text">✕</button>

          <h2 className="mb-1 font-serif text-xl text-text">Complete session</h2>
          <p className="mb-5 text-[0.78rem] text-text-3">Session with {clientName}</p>

          {/* Step indicators */}
          <div className="mb-6 flex gap-1.5">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-accent" : "bg-surface-3"}`} />
            ))}
          </div>

          {step === 1 && (
            <div>
              <div className={labelClass}>How did this session go?</div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                maxLength={5000}
                placeholder="Session notes..."
                className={`${inputClass} resize-y mb-4`}
              />
              <div className={labelClass}>Rating (private)</div>
              <div className="mb-6 flex gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg border text-lg transition-colors ${
                      s <= rating ? "border-accent bg-accent-lt text-accent" : "border-border bg-surface-2 text-text-3 hover:text-text"
                    }`}
                  >★</button>
                ))}
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={() => setStep(2)} className="inline-flex min-h-[44px] items-center rounded-lg bg-accent px-5 py-2 text-[0.8125rem] font-medium text-white hover:bg-accent-hover">Next</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className={labelClass}>Homework assignment</div>
              {!skipHw ? (
                <div className="mb-4 flex flex-col gap-3">
                  <input type="text" value={hwTitle} onChange={(e) => setHwTitle(e.target.value)} placeholder="Homework title" className={inputClass} />
                  <textarea value={hwDesc} onChange={(e) => setHwDesc(e.target.value)} placeholder="Description (optional)" rows={2} className={`${inputClass} resize-y`} />
                  <input type="date" value={hwDue} onChange={(e) => setHwDue(e.target.value)} className={inputClass} />
                </div>
              ) : (
                <div className="mb-4 text-[0.78rem] text-text-3">No homework this session</div>
              )}
              <label className="mb-6 flex cursor-pointer items-center gap-2 text-[0.8125rem] text-text-2">
                <input type="checkbox" checked={skipHw} onChange={(e) => setSkipHw(e.target.checked)} className="accent-accent" />
                Skip homework
              </label>
              <div className="flex justify-between">
                <button type="button" onClick={() => setStep(1)} className="inline-flex min-h-[44px] items-center rounded-lg border border-border bg-surface-2 px-4 py-2 text-[0.8125rem] font-medium text-text-2 hover:bg-surface-3">Back</button>
                <button type="button" onClick={() => setStep(3)} className="inline-flex min-h-[44px] items-center rounded-lg bg-accent px-5 py-2 text-[0.8125rem] font-medium text-white hover:bg-accent-hover">Next</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className={labelClass}>Schedule next session</div>
              {!skipNext ? (
                <div className="mb-4 grid grid-cols-2 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} className={inputClass} />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <input type="time" value={nextTime} onChange={(e) => setNextTime(e.target.value)} className={inputClass} />
                  </div>
                  <div className="col-span-2">
                    <select value={nextDuration} onChange={(e) => setNextDuration(Number(e.target.value))} className={inputClass}>
                      <option value={30}>30 min</option>
                      <option value={45}>45 min</option>
                      <option value={60}>60 min</option>
                      <option value={90}>90 min</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="mb-4 text-[0.78rem] text-text-3">Skipping — schedule later</div>
              )}
              <label className="mb-6 flex cursor-pointer items-center gap-2 text-[0.8125rem] text-text-2">
                <input type="checkbox" checked={skipNext} onChange={(e) => setSkipNext(e.target.checked)} className="accent-accent" />
                Skip for now
              </label>
              <div className="flex justify-between">
                <button type="button" onClick={() => setStep(2)} className="inline-flex min-h-[44px] items-center rounded-lg border border-border bg-surface-2 px-4 py-2 text-[0.8125rem] font-medium text-text-2 hover:bg-surface-3">Back</button>
                <button type="button" onClick={() => setStep(4)} className="inline-flex min-h-[44px] items-center rounded-lg bg-accent px-5 py-2 text-[0.8125rem] font-medium text-white hover:bg-accent-hover">Next</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <div className={labelClass}>Payment check</div>
              {pendingPayment ? (
                <div className="mb-4 rounded-lg border border-border bg-surface-2 p-4">
                  <p className="text-[0.8125rem] text-text-2">
                    Payment of <strong className="text-text">€{pendingPayment.amount.toLocaleString()}</strong> is due.
                  </p>
                  <label className="mt-3 flex cursor-pointer items-center gap-2 text-[0.8125rem] text-text-2">
                    <input type="checkbox" checked={markPaid} onChange={(e) => setMarkPaid(e.target.checked)} className="accent-accent" />
                    Mark as received
                  </label>
                </div>
              ) : (
                <div className="mb-4 rounded-lg border border-border bg-accent-lt p-4 text-[0.8125rem] text-accent">
                  All payments up to date ✓
                </div>
              )}
              <div className="flex justify-between">
                <button type="button" onClick={() => setStep(3)} className="inline-flex min-h-[44px] items-center rounded-lg border border-border bg-surface-2 px-4 py-2 text-[0.8125rem] font-medium text-text-2 hover:bg-surface-3">Back</button>
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={saving}
                  className="inline-flex min-h-[44px] items-center rounded-lg bg-accent px-5 py-2 text-[0.8125rem] font-medium text-white hover:bg-accent-hover disabled:opacity-50"
                >{saving ? "Completing…" : "Complete session"}</button>
              </div>
            </div>
          )}
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
