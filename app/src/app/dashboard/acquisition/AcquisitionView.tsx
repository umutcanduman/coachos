"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { STAGE_LABELS, STAGE_BADGE_CLASS } from "@/lib/lifecycle";
import { moveClientStage } from "@/app/dashboard/pipeline/actions";
import Toast from "@/components/Toast";

interface LeadRow {
  id: string;
  name: string;
  email: string;
  lifecycle_stage: string;
  source: string | null;
  created_at: string;
  next_follow_up_date: string | null;
  proposal_price: number | null;
}

interface SourceRow {
  source: string;
  total: number;
  converted: number;
  revenue: number;
}

interface Props {
  stats: { leadsThisMonth: number; conversionRate: number; openProposalValue: number; available: number; maxCapacity: number; activeCount: number };
  leads: LeadRow[];
  sourcePerf: SourceRow[];
}

export default function AcquisitionView({ stats, leads, sourcePerf }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  async function handleMoveStage(clientId: string, toStage: string) {
    const r = await moveClientStage(clientId, toStage);
    if (!r.success) { setToast({ message: r.error ?? "Failed", type: "error" }); return; }
    setToast({ message: "Stage updated", type: "success" });
    startTransition(() => router.refresh());
  }

  const capacityPct = Math.min(100, Math.round((stats.activeCount / stats.maxCapacity) * 100));
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-5">
      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Leads this month" value={String(stats.leadsThisMonth)} />
        <StatTile label="Conversion (90d)" value={`${stats.conversionRate}%`} />
        <StatTile label="Open proposals" value={`€${stats.openProposalValue.toLocaleString()}`} />
        <StatTile label="Available capacity" value={`${stats.available} slots`} sub={`${stats.activeCount}/${stats.maxCapacity} filled`} />
      </div>

      {/* Active leads table */}
      <div className="overflow-hidden rounded-card border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="text-sm font-medium text-text">Active leads</div>
          <Link href="/dashboard/pipeline" className="text-xs text-accent hover:underline">Pipeline →</Link>
        </div>
        {leads.length === 0 ? (
          <div className="py-12 text-center text-[0.8125rem] text-text-3">
            <div className="mb-2 text-2xl opacity-30">◇</div>
            No active leads. Add leads from the Pipeline page.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="grid min-w-[700px] grid-cols-[2fr_0.8fr_0.8fr_0.8fr_1fr_0.8fr_120px] items-center gap-3 px-5 py-2.5 text-[0.7rem] font-medium uppercase tracking-[0.1em] text-text-3">
              <div>Name</div><div>Stage</div><div>Source</div><div>Days</div><div>Follow-up</div><div>Value</div><div>Action</div>
            </div>
            {leads.map((lead) => {
              const stage = (STAGE_LABELS as Record<string, string>)[lead.lifecycle_stage] ?? lead.lifecycle_stage;
              const badgeClass = (STAGE_BADGE_CLASS as Record<string, string>)[lead.lifecycle_stage] ?? "bg-surface-3 text-text-3";
              const days = Math.floor((Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24));
              const overdue = lead.next_follow_up_date && lead.next_follow_up_date < today;
              return (
                <Link
                  key={lead.id}
                  href={`/dashboard/clients/${lead.id}`}
                  className="grid min-w-[700px] grid-cols-[2fr_0.8fr_0.8fr_0.8fr_1fr_0.8fr_120px] items-center gap-3 border-b border-border px-5 py-3 transition-colors last:border-b-0 hover:bg-surface-2"
                >
                  <div>
                    <div className="text-[0.8125rem] font-medium text-text">{lead.name}</div>
                    <div className="text-[0.7rem] text-text-3">{lead.email}</div>
                  </div>
                  <div><span className={`inline-flex rounded-full px-2 py-0.5 text-[0.65rem] font-medium ${badgeClass}`}>{stage}</span></div>
                  <div className="text-[0.78rem] capitalize text-text-3">{lead.source ?? "—"}</div>
                  <div className="text-[0.78rem] text-text-3">{days}d</div>
                  <div className={`text-[0.78rem] ${overdue ? "font-medium text-c-red" : "text-text-3"}`}>
                    {lead.next_follow_up_date ? new Date(lead.next_follow_up_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                    {overdue && " (overdue)"}
                  </div>
                  <div className="text-[0.78rem] text-text-2">{lead.proposal_price ? `€${Number(lead.proposal_price).toLocaleString()}` : "—"}</div>
                  <div onClick={(e) => e.preventDefault()}>
                    <select
                      defaultValue={lead.lifecycle_stage}
                      onChange={(e) => handleMoveStage(lead.id, e.target.value)}
                      className="w-full cursor-pointer rounded-md border border-border bg-surface px-2 py-1 text-[0.7rem] text-text-2 outline-none"
                    >
                      {(["lead", "discovery", "proposal", "active", "alumni"] as const).map((s) => (
                        <option key={s} value={s}>→ {STAGE_LABELS[s]}</option>
                      ))}
                    </select>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Capacity planning */}
      <div className="overflow-hidden rounded-card border border-border bg-surface p-5">
        <div className="mb-3 text-sm font-medium text-text">Capacity</div>
        <div className="mb-2 h-3 overflow-hidden rounded-full bg-surface-3">
          <div className={`h-full rounded-full transition-all ${capacityPct >= 90 ? "bg-c-red" : capacityPct >= 70 ? "bg-c-amber" : "bg-accent"}`} style={{ width: `${capacityPct}%` }} />
        </div>
        <div className="flex items-center justify-between text-[0.78rem]">
          <span className="text-text-2">{stats.activeCount} of {stats.maxCapacity} slots filled</span>
          <span className={`font-medium ${stats.available > 0 ? "text-accent" : "text-c-red"}`}>
            {stats.available > 0 ? `${stats.available} available` : "At full capacity"}
          </span>
        </div>
        <Link href="/dashboard/settings" className="mt-2 inline-block text-[0.72rem] text-accent hover:underline">Update max capacity →</Link>
      </div>

      {/* Source performance */}
      {sourcePerf.length > 0 && (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          <div className="border-b border-border px-5 py-4 text-sm font-medium text-text">Source performance</div>
          <div className="overflow-x-auto">
            <div className="grid min-w-[500px] grid-cols-[1.5fr_0.8fr_0.8fr_0.8fr_1fr] items-center gap-3 px-5 py-2.5 text-[0.7rem] font-medium uppercase tracking-[0.1em] text-text-3">
              <div>Source</div><div>Leads</div><div>Converted</div><div>Rate</div><div>Revenue</div>
            </div>
            {sourcePerf.map((s) => (
              <div key={s.source} className="grid min-w-[500px] grid-cols-[1.5fr_0.8fr_0.8fr_0.8fr_1fr] items-center gap-3 border-b border-border px-5 py-3 last:border-b-0">
                <div className="text-[0.8125rem] capitalize text-text">{s.source}</div>
                <div className="text-[0.8125rem] text-text-2">{s.total}</div>
                <div className="text-[0.8125rem] text-text-2">{s.converted}</div>
                <div className="text-[0.8125rem] text-text-2">{s.total > 0 ? Math.round((s.converted / s.total) * 100) : 0}%</div>
                <div className="text-[0.8125rem] text-text-2">€{s.revenue.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-card border border-border bg-surface px-4 py-3">
      <div className="text-[0.65rem] uppercase tracking-[0.08em] text-text-3">{label}</div>
      <div className="mt-1 font-serif text-2xl text-text">{value}</div>
      {sub && <div className="mt-0.5 text-[0.7rem] text-text-3">{sub}</div>}
    </div>
  );
}
