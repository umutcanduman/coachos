"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createInvoice, updateInvoiceStatus } from "@/app/dashboard/today-actions";
import Toast from "@/components/Toast";

interface InvoiceRow {
  id: string;
  invoice_number: string;
  amount: number;
  issued_date: string;
  due_date: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  clients: { id: string; name: string } | null;
}

interface Props {
  invoices: InvoiceRow[];
  clients: { id: string; name: string }[];
}

const inputClass = "w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 font-sans text-sm text-text outline-none placeholder:text-text-3 focus:border-border-2";
const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-[0.06em] text-text-2";

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-surface-3 text-text-3",
  sent: "bg-c-blue-dim text-c-blue",
  paid: "bg-accent-lt text-accent",
};

export default function InvoicesView({ invoices, clients }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const filtered = filter === "all" ? invoices : invoices.filter((i) => i.status === filter);

  async function handleStatusChange(id: string, status: string) {
    const r = await updateInvoiceStatus(id, status);
    if (r.success) {
      setToast({ message: `Invoice marked ${status}`, type: "success" });
      startTransition(() => router.refresh());
    } else {
      setToast({ message: r.error ?? "Failed", type: "error" });
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Filters + create */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-full border border-border bg-surface-2 p-1">
          {[{ l: "All", v: "all" }, { l: "Draft", v: "draft" }, { l: "Sent", v: "sent" }, { l: "Paid", v: "paid" }].map((f) => (
            <button key={f.v} type="button" onClick={() => setFilter(f.v)}
              className={`rounded-full px-3.5 py-1.5 text-[0.78rem] font-medium transition-all ${filter === f.v ? "bg-surface-3 text-text" : "text-text-3 hover:text-text-2"}`}
            >{f.l}</button>
          ))}
        </div>
        <button type="button" onClick={() => setModalOpen(true)}
          className="ml-auto inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-[0.8125rem] font-medium text-white hover:bg-accent-hover"
        >+ New Invoice</button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-card border border-border bg-surface">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-[0.8125rem] text-text-3">
            <div className="mb-2 text-2xl opacity-30">◎</div>
            No invoices found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="grid min-w-[600px] grid-cols-[1.5fr_1fr_0.8fr_0.8fr_0.8fr_100px] items-center gap-3 px-5 py-2.5 text-[0.7rem] font-medium uppercase tracking-[0.1em] text-text-3">
              <div>Client</div><div>Invoice #</div><div>Amount</div><div>Date</div><div>Status</div><div>Action</div>
            </div>
            {filtered.map((inv) => (
              <div key={inv.id} className="grid min-w-[600px] grid-cols-[1.5fr_1fr_0.8fr_0.8fr_0.8fr_100px] items-center gap-3 border-b border-border px-5 py-3.5 last:border-b-0">
                <div className="text-[0.8125rem] font-medium text-text">{inv.clients?.name ?? "—"}</div>
                <div className="text-[0.78rem] text-text-2">{inv.invoice_number}</div>
                <div className="text-[0.8125rem] font-medium text-text">€{Number(inv.amount).toLocaleString()}</div>
                <div className="text-[0.78rem] text-text-3">{new Date(inv.issued_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                <div><span className={`inline-flex rounded-full px-2.5 py-0.5 text-[0.65rem] font-medium capitalize ${STATUS_BADGE[inv.status] ?? "bg-surface-3 text-text-3"}`}>{inv.status}</span></div>
                <div>
                  {inv.status !== "paid" && (
                    <select
                      value={inv.status}
                      onChange={(e) => handleStatusChange(inv.id, e.target.value)}
                      className="w-full cursor-pointer rounded-md border border-border bg-surface px-2 py-1 text-[0.7rem] text-text-2 outline-none"
                    >
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="paid">Paid</option>
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {modalOpen && (
        <NewInvoiceModal clients={clients} onClose={() => setModalOpen(false)} onCreated={(msg) => {
          setModalOpen(false);
          setToast({ message: msg, type: "success" });
          startTransition(() => router.refresh());
        }} />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function NewInvoiceModal({ clients, onClose, onCreated }: { clients: { id: string; name: string }[]; onClose: () => void; onCreated: (m: string) => void }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const r = await createInvoice(fd);
    setBusy(false);
    if (r.success) onCreated(`Invoice ${r.invoiceNumber} created`);
    else setError(r.error ?? "Failed");
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-8">
      <div className="relative w-full overflow-y-auto rounded-t-[14px] border border-border-2 bg-surface p-5 shadow-2xl sm:max-w-[480px] sm:rounded-[14px] sm:p-7">
        <button onClick={onClose} className="absolute right-5 top-5 text-text-3 hover:text-text">✕</button>
        <h2 className="mb-1 font-serif text-xl text-text">New Invoice</h2>
        <p className="mb-5 text-[0.78rem] text-text-3">Generate an invoice for a client</p>
        {error && <div className="mb-4 rounded-lg bg-c-red-dim px-4 py-3 text-[0.8125rem] text-c-red">{error}</div>}
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Client</label>
            <select name="client_id" required className={inputClass}>
              <option value="">Select client</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Amount (€)</label>
              <input name="amount" type="number" min="0.01" step="0.01" required className={inputClass} placeholder="0.00" />
            </div>
            <div>
              <label className={labelClass}>Due date</label>
              <input name="due_date" type="date" className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select name="status" className={inputClass} defaultValue="draft">
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Notes</label>
            <textarea name="notes" rows={2} className={`${inputClass} resize-y`} placeholder="Invoice notes..." />
          </div>
          <div className="flex justify-end gap-2.5">
            <button type="button" onClick={onClose} className="inline-flex min-h-[44px] items-center rounded-lg border border-border bg-surface-2 px-4 py-2 text-[0.8125rem] font-medium text-text-2 hover:bg-surface-3">Cancel</button>
            <button type="submit" disabled={busy} className="inline-flex min-h-[44px] items-center rounded-lg bg-accent px-4 py-2 text-[0.8125rem] font-medium text-white hover:bg-accent-hover disabled:opacity-50">{busy ? "Creating…" : "Create Invoice"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
