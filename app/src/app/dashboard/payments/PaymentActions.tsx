"use client";

import { useState } from "react";
import Toast from "@/components/Toast";

export function ReminderButton({ clientName }: { clientName: string }) {
  const [toast, setToast] = useState<string | null>(null);

  return (
    <>
      <button
        onClick={() => setToast(`Reminder sent to ${clientName}`)}
        className="text-xs font-medium text-accent hover:underline"
      >
        Remind
      </button>
      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
    </>
  );
}

export function SendReminderButton({ clientName }: { clientName: string }) {
  const [toast, setToast] = useState<string | null>(null);

  return (
    <>
      <button
        onClick={() => setToast(`Payment reminder sent to ${clientName}`)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3.5 py-1.5 text-[0.75rem] font-medium text-text-2 transition-all hover:bg-surface-3"
      >
        Send Reminder
      </button>
      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
    </>
  );
}
