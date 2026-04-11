"use client";

import { useState } from "react";
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

export default function PipelineBoard({
  cardsByStage,
  totalsByStage,
  onMoveStage,
  onQuickAction,
}: Props) {
  const [dragOver, setDragOver] = useState<LifecycleStage | null>(null);

  function onDragStart(e: React.DragEvent, cardId: string, fromStage: LifecycleStage) {
    e.dataTransfer.setData("text/plain", JSON.stringify({ cardId, fromStage }));
    e.dataTransfer.effectAllowed = "move";
  }

  function onDrop(e: React.DragEvent, toStage: LifecycleStage) {
    e.preventDefault();
    setDragOver(null);
    let payload: { cardId: string; fromStage: LifecycleStage } | null = null;
    try {
      payload = JSON.parse(e.dataTransfer.getData("text/plain"));
    } catch {
      return;
    }
    if (!payload || payload.fromStage === toStage) return;
    onMoveStage(payload.cardId, payload.fromStage, toStage);
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {LIFECYCLE_STAGES.map((stage) => {
        const cards = cardsByStage[stage] ?? [];
        const total = totalsByStage[stage] ?? 0;
        const isDragOver = dragOver === stage;
        return (
          <div
            key={stage}
            onDragOver={(e) => { e.preventDefault(); setDragOver(stage); }}
            onDragLeave={() => setDragOver((s) => (s === stage ? null : s))}
            onDrop={(e) => onDrop(e, stage)}
            className={`flex w-[280px] flex-shrink-0 flex-col rounded-card border bg-surface transition-colors ${
              isDragOver ? "border-accent bg-accent-lt/30" : "border-border"
            }`}
          >
            <div className="border-b border-border px-4 py-3">
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[0.7rem] font-medium ${STAGE_BADGE_CLASS[stage]}`}
                >
                  {STAGE_LABELS[stage]}
                </span>
                <span className="text-[0.72rem] text-text-3">{cards.length}</span>
              </div>
              {total > 0 && (
                <div className="mt-1 text-[0.7rem] text-text-3">
                  €{total.toLocaleString()} total
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 p-3">
              {cards.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-3 py-8 text-center text-[0.72rem] text-text-3">
                  <div className="mb-2 text-lg opacity-30">◇</div>
                  No clients at this stage
                </div>
              ) : (
                cards.map((card) => {
                  const initials = card.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);
                  const days = daysSince(card.lifecycle_stage_updated_at);
                  return (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, card.id, stage)}
                      className="rounded-lg border border-border bg-surface-2 p-3 transition-colors hover:border-border-2"
                    >
                      <Link
                        href={`/dashboard/clients/${card.id}`}
                        className="flex items-start gap-2.5"
                      >
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-accent-dim text-[0.65rem] font-semibold text-accent">
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[0.8125rem] font-medium text-text">
                            {card.name}
                          </div>
                          {card.package_type && (
                            <div className="truncate text-[0.7rem] text-text-3">
                              {card.package_type}
                            </div>
                          )}
                          {(stage === "lead" || stage === "discovery") && card.source && (
                            <div className="mt-1.5">
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
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
