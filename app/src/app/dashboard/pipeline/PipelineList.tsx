"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LIFECYCLE_STAGES,
  STAGE_LABELS,
  STAGE_BADGE_CLASS,
  daysSince,
  type LifecycleStage,
} from "@/lib/lifecycle";
import type { PipelineCard } from "./types";

interface Props {
  cardsByStage: Record<LifecycleStage, PipelineCard[]>;
  totalsByStage: Record<LifecycleStage, number>;
  onMoveStage: (cardId: string, fromStage: LifecycleStage, toStage: string) => void;
  onQuickAction: (card: PipelineCard) => void;
}

const QUICK_LABEL: Record<LifecycleStage, string> = {
  lead:      "Schedule Discovery",
  discovery: "Send Proposal",
  proposal:  "Mark Accepted",
  active:    "View Profile",
  alumni:    "Re-engage",
};

export default function PipelineList({
  cardsByStage,
  totalsByStage,
  onMoveStage,
  onQuickAction,
}: Props) {
  // Open by default: any stage with cards.
  const [openStages, setOpenStages] = useState<Set<LifecycleStage>>(() => {
    const open = new Set<LifecycleStage>();
    for (const s of LIFECYCLE_STAGES) {
      if ((cardsByStage[s] ?? []).length > 0) open.add(s);
    }
    return open;
  });

  // When filters change the populated stages, expand any newly populated ones
  // and collapse stages that have become empty so the view stays useful.
  useEffect(() => {
    setOpenStages((prev) => {
      const next = new Set(prev);
      for (const s of LIFECYCLE_STAGES) {
        const has = (cardsByStage[s] ?? []).length > 0;
        if (has) next.add(s);
        else next.delete(s);
      }
      return next;
    });
  }, [cardsByStage]);

  function toggle(stage: LifecycleStage) {
    setOpenStages((prev) => {
      const next = new Set(prev);
      if (next.has(stage)) next.delete(stage);
      else next.add(stage);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {LIFECYCLE_STAGES.map((stage) => {
        const cards = cardsByStage[stage] ?? [];
        const isOpen = openStages.has(stage);
        const total = totalsByStage[stage] ?? 0;

        return (
          <section
            key={stage}
            className="overflow-hidden rounded-card border border-border bg-surface"
          >
            <button
              type="button"
              onClick={() => toggle(stage)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-surface-2 sm:px-5"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[0.75rem] font-medium ${STAGE_BADGE_CLASS[stage]}`}
                >
                  {STAGE_LABELS[stage]}
                </span>
                <span className="text-[0.78rem] text-text-3">
                  {cards.length} {cards.length === 1 ? "client" : "clients"}
                </span>
                {total > 0 && (
                  <span className="text-[0.78rem] text-text-3">
                    · €{total.toLocaleString()}
                  </span>
                )}
              </div>
              <span
                className={`text-text-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
                aria-hidden
              >
                ▾
              </span>
            </button>

            {isOpen && (
              <div className="p-3 sm:p-4">
                {cards.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-[0.78rem] text-text-3">
                    No clients at this stage
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {cards.map((card) => (
                      <ClientCard
                        key={card.id}
                        card={card}
                        stage={stage}
                        onMoveStage={onMoveStage}
                        onQuickAction={onQuickAction}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function ClientCard({
  card,
  stage,
  onMoveStage,
  onQuickAction,
}: {
  card: PipelineCard;
  stage: LifecycleStage;
  onMoveStage: (cardId: string, fromStage: LifecycleStage, toStage: string) => void;
  onQuickAction: (card: PipelineCard) => void;
}) {
  const initials = card.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const days = daysSince(card.lifecycle_stage_updated_at);

  return (
    <div className="flex flex-col rounded-lg border border-border bg-surface-2 p-3 transition-colors hover:border-border-2">
      <Link
        href={`/dashboard/clients/${card.id}`}
        className="flex items-start gap-2.5"
      >
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent-dim text-[0.7rem] font-semibold text-accent">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[0.8125rem] font-medium text-text">{card.name}</div>
          {card.package_type && (
            <div className="truncate text-[0.7rem] text-text-3">{card.package_type}</div>
          )}
          {!card.package_type && card.source && (
            <div className="mt-1">
              <span className="inline-flex rounded-full bg-c-blue-dim px-2 py-0.5 text-[0.65rem] font-medium capitalize text-c-blue">
                {card.source}
              </span>
            </div>
          )}
          {stage === "proposal" && card.proposal_price !== null && (
            <div className="mt-1 text-[0.7rem] font-medium text-text-2">
              €{Number(card.proposal_price).toLocaleString()}
            </div>
          )}
        </div>
      </Link>

      <div className="mt-2 flex items-center justify-between gap-2 text-[0.65rem] text-text-3">
        <span>{days}d in stage</span>
        {card.next_action && (
          <span className="truncate text-text-3" title={card.next_action}>
            {card.next_action}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => onQuickAction(card)}
        className="mt-2.5 w-full rounded-md border border-border bg-surface px-2 py-1.5 text-[0.7rem] font-medium text-text-2 transition-colors hover:border-border-2 hover:bg-surface-3 hover:text-text"
      >
        {QUICK_LABEL[stage]}
      </button>

      <select
        aria-label={`Move ${card.name} to a different stage`}
        value={stage}
        onChange={(e) => onMoveStage(card.id, stage, e.target.value)}
        className="mt-1.5 w-full cursor-pointer rounded-md border border-border bg-surface px-2 py-1 text-[0.65rem] text-text-2 outline-none transition-colors hover:border-border-2"
      >
        {LIFECYCLE_STAGES.map((s) => (
          <option key={s} value={s}>
            Move to: {STAGE_LABELS[s]}
          </option>
        ))}
      </select>
    </div>
  );
}
