import { createClient } from "@/lib/supabase/server";
import Topbar from "@/components/Topbar";
import AcquisitionView from "./AcquisitionView";

export const dynamic = "force-dynamic";

export default async function AcquisitionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (<><Topbar title="Acquisition" /><div className="flex-1 p-4 lg:p-7"><div className="rounded-card border border-border bg-surface py-16 text-center text-sm text-text-3">Session expired.</div></div></>);
  }

  let coachId: string | null = null;
  try {
    const { data: coach } = await supabase.from("coaches").select("id").eq("user_id", user.id).single();
    coachId = coach?.id ?? null;
  } catch { /* ok */ }

  // Stats
  let leadsThisMonth = 0;
  let totalLeadsLast90 = 0;
  let convertedLast90 = 0;
  let openProposalValue = 0;
  let maxCapacity = 10;
  let activeCount = 0;
  type LeadRow = { id: string; name: string; email: string; lifecycle_stage: string; source: string | null; created_at: string; next_follow_up_date: string | null; proposal_price: number | null };
  let leads: LeadRow[] = [];
  type SourceRow = { source: string; total: number; converted: number; revenue: number };
  let sourcePerf: SourceRow[] = [];

  if (coachId) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const d90 = new Date(now); d90.setDate(d90.getDate() - 90);
    const d90Iso = d90.toISOString();

    try {
      const { count } = await supabase.from("clients").select("id", { count: "exact", head: true })
        .eq("coach_id", coachId).in("lifecycle_stage", ["lead", "discovery", "proposal"]).gte("created_at", startOfMonth);
      leadsThisMonth = count ?? 0;
    } catch { /* ok */ }

    try {
      const { count } = await supabase.from("clients").select("id", { count: "exact", head: true })
        .eq("coach_id", coachId).in("lifecycle_stage", ["lead", "discovery", "proposal", "active", "alumni"]).gte("created_at", d90Iso);
      totalLeadsLast90 = count ?? 0;
      const { count: conv } = await supabase.from("clients").select("id", { count: "exact", head: true })
        .eq("coach_id", coachId).eq("lifecycle_stage", "active").gte("created_at", d90Iso);
      convertedLast90 = conv ?? 0;
    } catch { /* ok */ }

    try {
      const { data } = await supabase.from("clients").select("proposal_price").eq("coach_id", coachId).eq("lifecycle_stage", "proposal");
      openProposalValue = (data ?? []).reduce((s, r) => s + Number(r.proposal_price ?? 0), 0);
    } catch { /* ok */ }

    try {
      const { count } = await supabase.from("clients").select("id", { count: "exact", head: true }).eq("coach_id", coachId).eq("lifecycle_stage", "active");
      activeCount = count ?? 0;
    } catch { /* ok */ }

    try {
      const { data: cs } = await supabase.from("coach_settings").select("max_client_capacity").eq("coach_id", coachId).maybeSingle();
      if (cs?.max_client_capacity) maxCapacity = cs.max_client_capacity;
    } catch { /* ok */ }

    // Active leads
    try {
      const { data } = await supabase.from("clients")
        .select("id, name, email, lifecycle_stage, source, created_at, next_follow_up_date, proposal_price")
        .eq("coach_id", coachId).in("lifecycle_stage", ["lead", "discovery", "proposal"])
        .order("next_follow_up_date", { ascending: true, nullsFirst: false });
      leads = (data ?? []) as LeadRow[];
    } catch { /* ok */ }

    // Source performance
    try {
      const { data: allClients } = await supabase.from("clients")
        .select("source, lifecycle_stage, payments(amount, status)")
        .eq("coach_id", coachId);
      const bySource = new Map<string, { total: number; converted: number; revenue: number }>();
      for (const c of allClients ?? []) {
        const src = (c as { source: string | null }).source ?? "unknown";
        const entry = bySource.get(src) ?? { total: 0, converted: 0, revenue: 0 };
        entry.total++;
        if ((c as { lifecycle_stage: string }).lifecycle_stage === "active") entry.converted++;
        const payments = Array.isArray((c as { payments: unknown[] }).payments) ? (c as { payments: { amount: number; status: string }[] }).payments : [];
        entry.revenue += payments.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
        bySource.set(src, entry);
      }
      sourcePerf = Array.from(bySource.entries()).map(([source, d]) => ({ source, ...d })).filter((s) => s.source !== "unknown");
    } catch { /* ok */ }
  }

  const conversionRate = totalLeadsLast90 > 0 ? Math.round((convertedLast90 / totalLeadsLast90) * 100) : 0;
  const available = Math.max(0, maxCapacity - activeCount);

  return (
    <>
      <Topbar title="Acquisition" subtitle={`${leads.length} active leads`} />
      <div className="flex-1 p-4 lg:p-7">
        <AcquisitionView
          stats={{ leadsThisMonth, conversionRate, openProposalValue, available, maxCapacity, activeCount }}
          leads={leads}
          sourcePerf={sourcePerf}
        />
      </div>
    </>
  );
}
