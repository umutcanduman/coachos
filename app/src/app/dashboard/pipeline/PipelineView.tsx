"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  STAGE_LABELS,
  SOURCE_OPTIONS,
  SOURCE_LABELS,
  type LifecycleStage,
} from "@/lib/lifecycle";
import { moveClientStage, quickAdvance } from "./actions";
import PipelineList from "./PipelineList";
import PipelineBoard from "./PipelineBoard";
import Toast from "@/components/Toast";
import NewClientModal from "@/app/dashboard/clients/NewClientModal";
import type { PipelineCard, PipelineSummary } from "./types";

interface Props {
  cards: PipelineCard[];
  summary: PipelineSummary;
  existingClients: { id: string; name: string }[];
}

type ViewMode = "list" | "board";

export default function PipelineView({ cards, summary, existingClients }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [addLeadOpen, setAddLeadOpen] = useState(false);

  // Apply client-side filters before bucketing.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cards.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q)) {
        return false;
      }
      if (sourceFilter && c.source !== sourceFilter) return false;
      return true;
    });
  }, [cards, search, sourceFilter]);

  const cardsByStage = useMemo(() => {
    const buckets: Record<LifecycleStage, PipelineCard[]> = {
      lead: [], discovery: [], proposal: [], onboarding: [],
      active: [], completing: [], offboarding: [], alumni: [],
    };
    for (const c of filtered) buckets[c.lifecycle_stage].push(c);
    return buckets;
  }, [filtered]);

  const totalsByStage = useMemo(() => {
    const totals: Record<LifecycleStage, number> = {
      lead: 0, discovery: 0, proposal: 0, onboarding: 0,
      active: 0, completing: 0, offboarding: 0, alumni: 0,
    };
    for (const c of filtered) {
      if (c.lifecycle_stage === "proposal" && c.proposal_price) {
        totals.proposal += Number(c.proposal_price);
      }
    }
    return totals;
  }, [filtered]);

  const totalCards = cards.length;
  const filteredCount = filtered.length;
  const isFiltering = search.trim().length > 0 || sourceFilter.length > 0;

  async function handleMoveStage(cardId: string, fromStage: LifecycleStage, toStage: string) {
    if (toStage === fromStage) return;
    const r = await moveClientStage(cardId, toStage);
    if (!r.success) {
      setToast({ message: r.error ?? "Failed to move", type: "error" });
      return;
    }
    setToast({
      message: `Moved to ${STAGE_LABELS[toStage as LifecycleStage] ?? toStage}`,
      type: "success",
    });
    startTransition(() => router.refresh());
  }

  async function handleQuickAction(card: PipelineCard) {
    if (
      card.lifecycle_stage === "onboarding" ||
      card.lifecycle_stage === "active" ||
      card.lifecycle_stage === "offboarding"
    ) {
      router.push(`/dashboard/clients/${card.id}`);
      return;
    }
    const r = await quickAdvance(card.id, card.lifecycle_stage);
    if (!r.success) {
      setToast({ message: r.error ?? "Action failed", type: "error" });
      return;
    }
    setToast({ message: "Updated", type: "success" });
    startTransition(() => router.refresh());
  }

  // Empty state — only when there are no clients at all
  if (totalCards === 0) {
    return (
      <>
        <SummaryBar summary={summary} />
        <div className="rounded-card border border-border bg-surface p-10 text-center">
          <div className="mb-3 text-3xl opacity-30">◇</div>
          <h2 className="mb-1 font-serif text-xl text-text">Your pipeline is empty</h2>
          <p className="mb-6 text-[0.8125rem] text-text-3">
            Add your first lead to start tracking your client journey.
          </p>
          <button
            type="button"
            onClick={() => setAddLeadOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-[0.8125rem] font-medium text-white transition-all hover:bg-accent-hover"
          >
            + Add Lead
          </button>
        </div>
        <NewClientModal
          open={addLeadOpen}
          onClose={() => setAddLeadOpen(false)}
          existingClients={existingClients}
        />
      </>
    );
  }

  return (
    <>
      <SummaryBar summary={summary} />

      {/* Filters + view toggle */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="min-w-[180px] flex-1 rounded-lg border border-border bg-surface-2 px-3.5 py-2 text-[0.8125rem] text-text outline-none placeholder:text-text-3 focus:border-border-2 sm:flex-initial sm:w-[260px]"
        />
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-[0.8125rem] text-text outline-none focus:border-border-2"
        >
          <option value="">All sources</option>
          {SOURCE_OPTIONS.map((s) => (
            <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
          ))}
        </select>
        {isFiltering && (
          <button
            type="button"
            onClick={() => { setSearch(""); setSourceFilter(""); }}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-[0.75rem] text-text-3 transition-colors hover:bg-surface-3 hover:text-text"
          >
            Clear
          </button>
        )}
        <button
          type="button"
          onClick={() => setAddLeadOpen(true)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-[0.8125rem] font-medium text-white transition-all hover:bg-accent-hover"
        >
          + Add Lead
        </button>

        {/* View toggle — desktop only */}
        <div className="hidden gap-1 rounded-lg border border-border bg-surface-2 p-1 lg:flex">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`rounded-md px-3 py-1 text-[0.75rem] font-medium transition-colors ${
              viewMode === "list" ? "bg-surface-3 text-text" : "text-text-3 hover:text-text-2"
            }`}
          >
            List
          </button>
          <button
            type="button"
            onClick={() => setViewMode("board")}
            className={`rounded-md px-3 py-1 text-[0.75rem] font-medium transition-colors ${
              viewMode === "board" ? "bg-surface-3 text-text" : "text-text-3 hover:text-text-2"
            }`}
          >
            Board
          </button>
        </div>
      </div>

      {isFiltering && (
        <div className="mb-3 text-[0.75rem] text-text-3">
          Showing {filteredCount} of {totalCards} clients
        </div>
      )}

      {filteredCount === 0 ? (
        <div className="rounded-card border border-border bg-surface p-10 text-center text-[0.8125rem] text-text-3">
          No clients match your filters.
        </div>
      ) : (
        <>
          {/* Mobile + List mode on desktop */}
          <div className={viewMode === "board" ? "lg:hidden" : ""}>
            <PipelineList
              cardsByStage={cardsByStage}
              totalsByStage={totalsByStage}
              onMoveStage={handleMoveStage}
              onQuickAction={handleQuickAction}
            />
          </div>

          {/* Board mode — desktop only */}
          {viewMode === "board" && (
            <div className="hidden lg:block">
              <div className="mb-3 text-[0.7rem] text-text-3">
                Board view works best on large monitors. Drag a card between columns to update its stage.
              </div>
              <PipelineBoard
                cardsByStage={cardsByStage}
                totalsByStage={totalsByStage}
                onMoveStage={handleMoveStage}
                onQuickAction={handleQuickAction}
              />
            </div>
          )}
        </>
      )}

      <NewClientModal
        open={addLeadOpen}
        onClose={() => setAddLeadOpen(false)}
        existingClients={existingClients}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}

function SummaryBar({ summary }: { summary: PipelineSummary }) {
  const items = [
    { label: "New leads this month", value: String(summary.leadsThisMonth) },
    {
      label: "In proposal",
      value: `${summary.inProposalCount}`,
      sub: summary.inProposalValue > 0 ? `€${summary.inProposalValue.toLocaleString()}` : null,
    },
    { label: "Active clients", value: String(summary.activeCount) },
    { label: "Completing", value: String(summary.completingCount) },
  ];
  return (
    <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((it) => (
        <div
          key={it.label}
          className="rounded-card border border-border bg-surface px-4 py-3"
        >
          <div className="text-[0.65rem] uppercase tracking-[0.08em] text-text-3">
            {it.label}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-serif text-2xl text-text">{it.value}</span>
            {it.sub && <span className="text-[0.75rem] text-text-3">{it.sub}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
