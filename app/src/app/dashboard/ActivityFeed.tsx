"use client";

import { useState } from "react";

interface Activity {
  id: string;
  action: string;
  description: string;
  created_at: string;
  metadata: { from_stage?: string; to_stage?: string } | null;
}

interface Props {
  activities: Activity[];
}

const ACTION_ICON: Record<string, { icon: string; bg: string; fg: string }> = {
  client_added:  { icon: "+",  bg: "bg-accent-lt",     fg: "text-accent" },
  stage_changed: { icon: "→",  bg: "bg-c-purple-dim",  fg: "text-c-purple" },
};
const DEFAULT_ICON = { icon: "•", bg: "bg-surface-3", fg: "text-text-3" };

export default function ActivityFeed({ activities }: Props) {
  const [expanded, setExpanded] = useState(false);

  const visible = expanded ? activities : activities.slice(0, 5);
  const hasMore = activities.length > 5;

  if (activities.length === 0) {
    return <div className="py-8 text-center text-sm text-text-3">No activity yet</div>;
  }

  return (
    <>
      <div className="flex flex-col">
        {visible.map((a) => {
          const style = ACTION_ICON[a.action] ?? DEFAULT_ICON;
          return (
            <div
              key={a.id}
              className="flex items-start gap-3.5 border-b border-border py-3 last:border-b-0"
            >
              <div
                className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium ${style.bg} ${style.fg}`}
              >
                {style.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[0.8125rem] leading-relaxed text-text-2">
                  {a.description}
                </p>
                <time className="text-[0.7rem] text-text-3">
                  {new Date(a.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </time>
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <div className="border-t border-border px-5 py-3 text-center">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-[0.78rem] font-medium text-accent transition-colors hover:underline"
          >
            {expanded ? "Show less" : `Show all ${activities.length} activities`}
          </button>
        </div>
      )}
    </>
  );
}
