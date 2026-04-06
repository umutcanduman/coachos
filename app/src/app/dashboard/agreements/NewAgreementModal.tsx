"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAgreement } from "./actions";

interface Client {
  id: string;
  name: string;
}

interface NewAgreementModalProps {
  open: boolean;
  onClose: () => void;
  clients: Client[];
}

export default function NewAgreementModal({
  open,
  onClose,
  clients,
}: NewAgreementModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createAgreement(formData);
      if (!result.success) {
        setError(result.error ?? "Failed to create agreement.");
      } else {
        router.refresh();
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-8">
      <div className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-[14px] border border-border-2 bg-surface p-5 shadow-2xl sm:max-w-[560px] sm:rounded-[14px] sm:p-7">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 border-none bg-transparent text-[1.125rem] text-text-3 transition-colors hover:text-text"
        >
          ✕
        </button>

        <h2 className="mb-1 font-serif text-2xl font-normal text-text">
          New Agreement
        </h2>
        <p className="mb-6 text-[0.8125rem] text-text-3">
          Create a coaching agreement for a client
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-[rgba(184,50,50,0.15)] bg-c-red-dim px-4 py-3 text-[0.8125rem] text-c-red">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.06em] text-text-2">
                Client
              </label>
              <select
                name="client_id"
                required
                className="w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 font-sans text-sm text-text outline-none transition-colors focus:border-border-2"
              >
                <option value="">Select client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.06em] text-text-2">
                Status
              </label>
              <select
                name="status"
                className="w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 font-sans text-sm text-text outline-none transition-colors focus:border-border-2"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.06em] text-text-2">
              Title
            </label>
            <input
              name="title"
              type="text"
              required
              placeholder="Coaching Agreement — Growth Journey"
              className="w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 font-sans text-sm text-text outline-none transition-colors placeholder:text-text-3 focus:border-border-2"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.06em] text-text-2">
              Agreement content
            </label>
            <textarea
              name="content"
              rows={4}
              placeholder="This coaching agreement outlines the terms and expectations for our coaching engagement..."
              className="w-full resize-y rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 font-sans text-sm leading-relaxed text-text outline-none transition-colors placeholder:text-text-3 focus:border-border-2"
            />
          </div>

          {/* Key Terms */}
          <div className="mb-4 rounded-lg border border-border bg-surface-2 p-4">
            <div className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-text-3">
              Key Terms
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-text-3">Start date</label>
                <input
                  name="start_date"
                  type="date"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-border-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-3">End date</label>
                <input
                  name="end_date"
                  type="date"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-border-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-3">Session count</label>
                <input
                  name="session_count"
                  type="number"
                  min="1"
                  placeholder="6"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-border-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-3">Payment terms</label>
                <input
                  name="payment_terms"
                  type="text"
                  placeholder="Full upfront"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none placeholder:text-text-3 focus:border-border-2"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-xs text-text-3">Cancellation policy</label>
              <input
                name="cancellation_policy"
                type="text"
                placeholder="24 hours notice required"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none placeholder:text-text-3 focus:border-border-2"
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-4 py-2 text-[0.8125rem] font-medium text-text-2 transition-all hover:bg-surface-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-[0.8125rem] font-medium text-white transition-all hover:bg-accent-hover disabled:opacity-50"
            >
              {isPending ? "Creating…" : "Create Agreement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
