import { createClient } from "@/lib/supabase/server";
import Topbar from "@/components/Topbar";
import PipelineView from "./PipelineView";
import { isLifecycleStage } from "@/lib/lifecycle";
import type { PipelineCard, PipelineSummary } from "./types";

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
  next_follow_up_date: string | null;
  created_at: string;
};

function nextActionFor(c: RawClient): string | null {
  switch (c.lifecycle_stage) {
    case "lead":
      if (c.next_follow_up_date) {
        return `Follow up ${new Date(c.next_follow_up_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
      }
      return c.discovery_call_date
        ? `Call ${new Date(c.discovery_call_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
        : "Schedule discovery";
    case "discovery":
      return "Send proposal";
    case "proposal":
      return c.proposal_sent_date
        ? `Sent ${new Date(c.proposal_sent_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
        : "Send proposal";
    case "active":
      return "Continue sessions";
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

  let cards: PipelineCard[] = [];
  let existingClients: { id: string; name: string }[] = [];

  if (coachId) {
    try {
      const { data } = await supabase
        .from("clients")
        .select(`
          id, name, email, package_type, source, lifecycle_stage,
          lifecycle_stage_updated_at, proposal_price,
          discovery_call_date, proposal_sent_date, reengagement_date,
          next_follow_up_date, created_at
        `)
        .eq("coach_id", coachId)
        .order("lifecycle_stage_updated_at", { ascending: false });

      const rows = (data ?? []) as RawClient[];
      cards = rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        package_type: row.package_type,
        source: row.source,
        lifecycle_stage: isLifecycleStage(row.lifecycle_stage) ? row.lifecycle_stage : "active",
        lifecycle_stage_updated_at: row.lifecycle_stage_updated_at,
        proposal_price: row.proposal_price !== null ? Number(row.proposal_price) : null,
        next_action: nextActionFor(row),
      }));

      existingClients = rows.map((r) => ({ id: r.id, name: r.name }));
    } catch { /* clients query may fail or columns may not exist yet */ }
  }

  // ----- summary metrics ---------------------------------------
  const summary: PipelineSummary = {
    leadsThisMonth: 0,
    inProposalCount: 0,
    inProposalValue: 0,
    activeCount: 0,
    alumniCount: 0,
  };

  if (coachId) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const startOfMonthIso = startOfMonth.toISOString();

    try {
      const { count } = await supabase
        .from("clients")
        .select("id", { count: "exact", head: true })
        .eq("coach_id", coachId)
        .in("lifecycle_stage", ["lead", "discovery", "proposal"])
        .gte("created_at", startOfMonthIso);
      summary.leadsThisMonth = count ?? 0;
    } catch { /* lifecycle column may not exist yet */ }

    try {
      const { data } = await supabase
        .from("clients")
        .select("proposal_price")
        .eq("coach_id", coachId)
        .eq("lifecycle_stage", "proposal");
      const rows = data ?? [];
      summary.inProposalCount = rows.length;
      summary.inProposalValue = rows.reduce(
        (sum, r) => sum + (r.proposal_price !== null ? Number(r.proposal_price) : 0),
        0
      );
    } catch { /* proposal_price column may not exist yet */ }

    try {
      const { count } = await supabase
        .from("clients")
        .select("id", { count: "exact", head: true })
        .eq("coach_id", coachId)
        .eq("lifecycle_stage", "active");
      summary.activeCount = count ?? 0;
    } catch { /* fall back to overall active count via status */ }

    if (summary.activeCount === 0) {
      try {
        const { count } = await supabase
          .from("clients")
          .select("id", { count: "exact", head: true })
          .eq("coach_id", coachId)
          .eq("status", "active");
        summary.activeCount = count ?? 0;
      } catch { /* clients table may not exist */ }
    }

    try {
      const { count } = await supabase
        .from("clients")
        .select("id", { count: "exact", head: true })
        .eq("coach_id", coachId)
        .eq("lifecycle_stage", "alumni");
      summary.alumniCount = count ?? 0;
    } catch { /* lifecycle column may not exist yet */ }
  }

  return (
    <>
      <Topbar
        title="Pipeline"
        subtitle={cards.length === 0 ? "No clients yet" : `${cards.length} clients across stages`}
      />
      <div className="flex-1 p-4 lg:p-7">
        <PipelineView cards={cards} summary={summary} existingClients={existingClients} />
      </div>
    </>
  );
}
