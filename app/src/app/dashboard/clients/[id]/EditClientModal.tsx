"use client";

import { useState } from "react";
import { updateClient } from "./actions";
import Toast from "@/components/Toast";

interface EditClientModalProps {
  open: boolean;
  onClose: () => void;
  client: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    location: string | null;
    package_type: string | null;
    status: string;
  };
}

const inputClass = "w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 font-sans text-sm text-text outline-none transition-colors placeholder:text-text-3 focus:border-border-2";
const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-[0.06em] text-text-2";

export default function EditClientModal({ open, onClose, client }: EditClientModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const result = await updateClient(client.id, new FormData(e.currentTarget));
    setSaving(false);
    if (result.success) {
      setToast({ message: "Client updated", type: "success" });
      setTimeout(onClose, 500);
    } else {
      setError(result.error ?? "Failed to update client");
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-8">
        <div className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-[14px] border border-border-2 bg-surface p-5 shadow-2xl sm:max-w-[520px] sm:rounded-[14px] sm:p-7">
          <button onClick={onClose} className="absolute right-5 top-5 border-none bg-transparent text-[1.125rem] text-text-3 transition-colors hover:text-text">✕</button>
          <h2 className="mb-1 font-serif text-2xl font-normal text-text">Edit Client</h2>
          <p className="mb-6 text-[0.8125rem] text-text-3">Update client information</p>

          {error && (
            <div className="mb-4 rounded-lg border border-[rgba(184,50,50,0.15)] bg-c-red-dim px-4 py-3 text-[0.8125rem] text-c-red">{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className={labelClass}>Full name</label>
              <input name="name" type="text" required defaultValue={client.name} className={inputClass} />
            </div>
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Email</label>
                <input name="email" type="email" required defaultValue={client.email} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input name="phone" type="tel" defaultValue={client.phone ?? ""} className={inputClass} />
              </div>
            </div>
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Location</label>
                <input name="location" type="text" defaultValue={client.location ?? ""} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Package</label>
                <select name="package_type" defaultValue={client.package_type ?? ""} className={inputClass}>
                  <option value="">Select package</option>
                  <option value="Growth Journey">Growth Journey</option>
                  <option value="Deep Transformation">Deep Transformation</option>
                  <option value="Clarity Session">Clarity Session</option>
                  <option value="Single Session">Single Session</option>
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className={labelClass}>Status</label>
              <select name="status" defaultValue={client.status} className={inputClass}>
                <option value="active">Active</option>
                <option value="follow-up">Follow-up</option>
                <option value="completed">Completed</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="mt-5 flex justify-end gap-2.5">
              <button type="button" onClick={onClose} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-4 py-2 text-[0.8125rem] font-medium text-text-2 transition-all hover:bg-surface-3">Cancel</button>
              <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-[0.8125rem] font-medium text-white transition-all hover:bg-accent-hover disabled:opacity-50">
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
