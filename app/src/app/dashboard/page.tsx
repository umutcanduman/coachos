import { createClient } from "@/lib/supabase/server";
import Topbar from "@/components/Topbar";
import TodayView, {
  type TodaySession,
  type AttentionItem,
  type WeekDay,
} from "./TodayView";



export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <>
        <Topbar title="Dashboard" />
        <div className="flex-1 p-4 lg:p-7">
          <div className="rounded-card border border-border bg-surface py-16 text-center text-sm text-text-3">Session expired. Please refresh.</div>
        </div>
      </>
    );
  }

  let coachId: string | null = null;
  let coachName = "Coach";
  try {
    const { data: coach } = await supabase
      .from("coaches")
      .select("id, name")
      .eq("user_id", user.id)
      .single();
    if (coach) {
      coachId = coach.id;
      coachName = coach.name ?? coachName;
    }
  } catch { /* coaches table may not exist */ }

  // Defaults
  const todaySessions: TodaySession[] = [];
  const attention: AttentionItem[] = [];
  const weekDays: WeekDay[] = [];
  const pipelineSnapshot = { leads: 0, proposals: 0, proposalValue: 0, active: 0, alumni: 0 };
  let activities: { id: string; action: string; description: string; created_at: string; metadata: { from_stage?: string; to_stage?: string } | null }[] = [];
  const stats = { sessionsToday: 0, overdueFollowups: 0, homeworkToReview: 0, unscheduled: 0 };

  if (!coachId) {
    const subtitle = new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    return (
      <>
        <Topbar title="Dashboard" subtitle={subtitle} />
        <div className="flex-1 p-4 lg:p-7">
          <TodayView coachName={coachName} todaySessions={todaySessions} attention={attention} weekDays={weekDays} pipelineSnapshot={pipelineSnapshot} activities={activities} stats={stats} />
        </div>
      </>
    );
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

  // --- Today's sessions with full context ---
  try {
    const { data: sessionsRaw } = await supabase
      .from("sessions")
      .select("id, client_id, date, duration, type, status, notes, prep_notes, clients(id, name, package_type)")
      .eq("coach_id", coachId)
      .gte("date", todayStart)
      .lt("date", todayEnd)
      .order("date", { ascending: true });

    for (const s of sessionsRaw ?? []) {
      const clientRaw = s.clients;
      const client = (Array.isArray(clientRaw) ? clientRaw[0] : clientRaw) as { id: string; name: string; package_type: string | null } | null;
      if (!client) continue;

      // Get package info
      let sessionNumber = 1;
      let totalSessions = 1;
      try {
        const { data: pkgs } = await supabase
          .from("packages")
          .select("total_sessions, status")
          .eq("client_id", client.id);
        const activePkg = (pkgs ?? []).find((p: { status: string }) => p.status === "active") ?? (pkgs ?? [])[0];
        if (activePkg) {
          totalSessions = activePkg.total_sessions;
          const { count } = await supabase
            .from("sessions")
            .select("id", { count: "exact", head: true })
            .eq("client_id", client.id)
            .eq("coach_id", coachId)
            .eq("status", "completed");
          sessionNumber = (count ?? 0) + 1;
        }
      } catch { /* packages table may not exist */ }

      // Last session
      let lastSessionDate: string | null = null;
      let lastSessionNotes: string | null = null;
      try {
        const { data: lastS } = await supabase
          .from("sessions")
          .select("date, notes")
          .eq("client_id", client.id)
          .eq("coach_id", coachId)
          .eq("status", "completed")
          .order("date", { ascending: false })
          .limit(1);
        if (lastS?.[0]) {
          lastSessionDate = lastS[0].date;
          lastSessionNotes = lastS[0].notes;
        }
      } catch { /* ok */ }

      // Homework
      let homework: { title: string; status: string }[] = [];
      try {
        const { data: hw } = await supabase
          .from("homework")
          .select("title, status")
          .eq("client_id", client.id)
          .order("created_at", { ascending: false })
          .limit(5);
        homework = hw ?? [];
      } catch { /* ok */ }

      // Goals
      let goals: { title: string; progress: number }[] = [];
      try {
        const { data: g } = await supabase
          .from("goals")
          .select("title, progress")
          .eq("client_id", client.id)
          .eq("status", "active");
        goals = (g ?? []).map((x: { title: string; progress: number }) => ({ title: x.title, progress: x.progress }));
      } catch { /* ok */ }

      // Pending payment
      let pendingPayment: { id: string; amount: number } | null = null;
      try {
        const { data: pp } = await supabase
          .from("payments")
          .select("id, amount")
          .eq("client_id", client.id)
          .eq("coach_id", coachId)
          .in("status", ["pending", "overdue"])
          .order("due_date", { ascending: true })
          .limit(1);
        if (pp?.[0]) pendingPayment = { id: pp[0].id, amount: Number(pp[0].amount) };
      } catch { /* ok */ }

      todaySessions.push({
        id: s.id,
        date: s.date,
        duration: s.duration,
        type: s.type,
        status: s.status,
        notes: s.notes,
        prepNotes: s.prep_notes ?? null,
        clientId: client.id,
        clientName: client.name,
        packageName: client.package_type,
        sessionNumber,
        totalSessions,
        lastSessionDate,
        lastSessionNotes,
        homework,
        goals,
        pendingPayment,
      });
    }
  } catch { /* sessions query may fail */ }

  stats.sessionsToday = todaySessions.length;

  // --- Needs attention ---
  const today = now.toISOString().slice(0, 10);

  // Overdue follow-ups
  try {
    const { data } = await supabase
      .from("clients")
      .select("id, name, next_follow_up_date")
      .eq("coach_id", coachId)
      .in("lifecycle_stage", ["lead", "discovery", "proposal"])
      .lt("next_follow_up_date", today)
      .not("next_follow_up_date", "is", null);
    for (const c of data ?? []) {
      attention.push({
        type: "overdue_followup",
        label: `Follow-up overdue (${new Date(c.next_follow_up_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })})`,
        clientName: c.name,
        clientId: c.id,
        href: `/dashboard/clients/${c.id}`,
      });
    }
    stats.overdueFollowups = (data ?? []).length;
  } catch { /* next_follow_up_date column may not exist */ }

  // Overdue payments
  try {
    const { data } = await supabase
      .from("payments")
      .select("id, amount, clients(id, name)")
      .eq("coach_id", coachId)
      .eq("status", "overdue");
    for (const p of data ?? []) {
      const cRaw = p.clients;
      const c = (Array.isArray(cRaw) ? cRaw[0] : cRaw) as { id: string; name: string } | null;
      if (!c) continue;
      attention.push({
        type: "overdue_payment",
        label: `€${Number(p.amount).toLocaleString()} overdue`,
        clientName: c.name,
        clientId: c.id,
        href: "/dashboard/payments",
      });
    }
  } catch { /* ok */ }

  // Unscheduled sessions (clients with remaining sessions not booked)
  try {
    const { data: clients } = await supabase
      .from("clients")
      .select("id, name, packages(total_sessions, status)")
      .eq("coach_id", coachId)
      .eq("status", "active");
    for (const c of clients ?? []) {
      const pkgs = Array.isArray(c.packages) ? c.packages : [];
      const pkg = pkgs.find((p: { status: string }) => p.status === "active") ?? pkgs[0];
      if (!pkg) continue;
      const { count: completed } = await supabase
        .from("sessions")
        .select("id", { count: "exact", head: true })
        .eq("client_id", c.id)
        .eq("coach_id", coachId)
        .eq("status", "completed");
      const { count: scheduled } = await supabase
        .from("sessions")
        .select("id", { count: "exact", head: true })
        .eq("client_id", c.id)
        .eq("coach_id", coachId)
        .eq("status", "scheduled");
      const remaining = pkg.total_sessions - (completed ?? 0) - (scheduled ?? 0);
      if (remaining > 0) {
        attention.push({
          type: "unscheduled",
          label: `${remaining} session${remaining > 1 ? "s" : ""} to schedule`,
          clientName: c.name,
          clientId: c.id,
          href: "/dashboard/sessions",
        });
        stats.unscheduled++;
      }
    }
  } catch { /* ok */ }

  // Homework to review (pending/in-progress)
  try {
    const { data: clientIds } = await supabase
      .from("clients")
      .select("id")
      .eq("coach_id", coachId);
    if (clientIds && clientIds.length > 0) {
      const ids = clientIds.map((c) => c.id);
      const { count } = await supabase
        .from("homework")
        .select("id", { count: "exact", head: true })
        .in("client_id", ids)
        .in("status", ["pending", "in-progress"]);
      stats.homeworkToReview = count ?? 0;
    }
  } catch { /* ok */ }

  // --- This week ---
  for (let d = 0; d < 7; d++) {
    const day = new Date(now);
    day.setDate(day.getDate() + d);
    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate()).toISOString();
    const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1).toISOString();
    const dayLabel = d === 0 ? "Today" : d === 1 ? "Tomorrow" : day.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

    try {
      const { data: daySessions } = await supabase
        .from("sessions")
        .select("id, date, clients(name)")
        .eq("coach_id", coachId)
        .eq("status", "scheduled")
        .gte("date", dayStart)
        .lt("date", dayEnd)
        .order("date", { ascending: true });

      weekDays.push({
        label: dayLabel,
        dateKey: dayStart.slice(0, 10),
        sessions: (daySessions ?? []).map((s) => ({
          id: s.id,
          time: new Date(s.date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
          clientName: ((Array.isArray(s.clients) ? s.clients[0] : s.clients) as { name: string } | null)?.name ?? "Client",
        })),
      });
    } catch {
      weekDays.push({ label: dayLabel, dateKey: dayStart.slice(0, 10), sessions: [] });
    }
  }

  // --- Pipeline snapshot ---
  try {
    const { data } = await supabase
      .from("clients")
      .select("lifecycle_stage, proposal_price")
      .eq("coach_id", coachId);
    for (const c of data ?? []) {
      const stage = (c as { lifecycle_stage: string }).lifecycle_stage;
      if (stage === "lead" || stage === "discovery") pipelineSnapshot.leads++;
      else if (stage === "proposal") {
        pipelineSnapshot.proposals++;
        pipelineSnapshot.proposalValue += Number((c as { proposal_price: number | null }).proposal_price ?? 0);
      }
      else if (stage === "active") pipelineSnapshot.active++;
      else if (stage === "alumni") pipelineSnapshot.alumni++;
    }
  } catch { /* lifecycle columns may not exist */ }

  // --- Activities ---
  try {
    const { data } = await supabase
      .from("activity_log")
      .select("id, action, description, created_at, metadata")
      .eq("coach_id", coachId)
      .order("created_at", { ascending: false })
      .limit(20);
    activities = (data ?? []) as typeof activities;
  } catch { /* activity_log may not exist */ }

  const subtitle = now.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <Topbar title="Dashboard" subtitle={subtitle} />
      <div className="flex-1 p-4 lg:p-7">
        <TodayView
          coachName={coachName}
          todaySessions={todaySessions}
          attention={attention}
          weekDays={weekDays}
          pipelineSnapshot={pipelineSnapshot}
          activities={activities}
          stats={stats}
        />
      </div>
    </>
  );
}
