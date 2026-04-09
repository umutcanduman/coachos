import { createClient } from "@/lib/supabase/server";
import Topbar from "@/components/Topbar";
import PipelineBoard, { type PipelineCard } from "./PipelineBoard";
import {
  LIFECYCLE_STAGES,
  isLifecycleStage,
  type LifecycleStage,
} from "@/lib/lifecycle";

export const dynamic = "force-dynamic";

type RawClient = {
  id: string;
  name: string;
  email: string;
  package_type: string | null;
  source: string | null;
  lifecycle_stage: string;
  lifecycle_stage_updated_at: string | null;
  proposal_price: number | null;
  discovery_call_date: string | null;
  proposal_sent_date: string | null;
  reengagement_date: string | null;
  packages: { price: number; status: string }[] | null;
};

function nextActionFor(c: RawClient): string | null {
  switch (c.lifecycle_stage) {
    case "lead":
      return c.discovery_call_date
        ? `Call ${new Date(c.discovery_call_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
        : "Schedule discovery";
    case "discovery":
      return "Send proposal";
    case "proposal":
      return c.proposal_sent_date
        ? `Sent ${new Date(c.proposal_sent_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
        : "Send proposal";
    case "onboarding":
      return "Finish onboarding";
    case "active":
      return "Continue sessions";
    case "completing":
      return "Wrap up sessions";
    case "offboarding":
      return "Finish offboarding";
    case "alumni":
      return c.reengagement_date
        ? `Re-engage ${new Date(c.reengagement_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
        : "Check in";
    default:
      return null;
  }
}

export default async function PipelinePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <>
        <Topbar title="Pipeline" />
        <div className="flex-1 p-4 lg:p-7">
          <div className="rounded-card border border-border bg-surface py-16 text-center text-sm text-text-3">
            Session expired. Please refresh.
          </div>
        </div>
      </>
    );
  }

  let coachId: string | null = null;
  try {
    const { data: coach } = await supabase
      .from("coaches")
      .select("id")
      .eq("user_id", user.id)
      .single();
    coachId = coach?.id ?? null;
  } catch { /* coaches table may not exist */ }

  // Initialise empty buckets so the UI renders even before migration runs
  const cardsByStage: Record<LifecycleStage, PipelineCard[]> = {
    lead: [], discovery: [], proposal: [], onboarding: [],
    active: [], completing: [], offboarding: [], alumni: [],
  };
  const totalsByStage: Record<LifecycleStage, number> = {
    lead: 0, discovery: 0, proposal: 0, onboarding: 0,
    active: 0, completing: 0, offboarding: 0, alumni: 0,
  };

  if (coachId) {
    try {
      const { data } = await supabase
        .from("clients")
        .select(`
          id, name, email, package_type, source, lifecycle_stage,
          lifecycle_stage_updated_at, proposal_price,
          discovery_call_date, proposal_sent_date, reengagement_date,
          packages ( price, status )
        `)
        .eq("coach_id", coachId)
        .order("lifecycle_stage_updated_at", { ascending: false });

      const rows = (data ?? []) as RawClient[];
      for (const row of rows) {
        const stage = isLifecycleStage(row.lifecycle_stage) ? row.lifecycle_stage : "active";
        const card: PipelineCard = {
          id: row.id,
          name: row.name,
          email: row.email,
          package_type: row.package_type,
          source: row.source,
          lifecycle_stage: stage,
          lifecycle_stage_updated_at: row.lifecycle_stage_updated_at,
          proposal_price: row.proposal_price !== null ? Number(row.proposal_price) : null,
          next_action: nextActionFor(row),
        };
        cardsByStage[stage].push(card);

        // Stage totals: sum proposal_price for proposal column,
        // active package price for active/completing/onboarding.
        if (stage === "proposal" && card.proposal_price) {
          totalsByStage[stage] += card.proposal_price;
        } else if (stage === "active" || stage === "completing" || stage === "onboarding") {
          const pkgs = Array.isArray(row.packages) ? row.packages : [];
          const active = pkgs.find((p) => p.status === "active") ?? pkgs[0];
          if (active?.price) totalsByStage[stage] += Number(active.price);
        }
      }
    } catch { /* clients query may fail */ }
  }

  const totalCards = LIFECYCLE_STAGES.reduce(
    (sum, s) => sum + cardsByStage[s].length,
    0
  );

  return (
    <>
      <Topbar
        title="Pipeline"
        subtitle={totalCards === 0 ? "No clients yet" : `${totalCards} clients across stages`}
      />
      <div className="flex-1 p-4 lg:p-7">
        <div className="mb-4 hidden text-xs text-text-3 lg:block">
          Drag a card between columns to update its lifecycle stage.
        </div>
        <PipelineBoard cardsByStage={cardsByStage} totalsByStage={totalsByStage} />
      </div>
    </>
  );
}
