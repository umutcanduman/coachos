import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Topbar from "@/components/Topbar";
import StatCard from "@/components/StatCard";

export const dynamic = "force-dynamic";

type GoalRow = { id: string; title: string; progress: number; status: string; client_id: string };
type HomeworkRow = { id: string; status: string; client_id: string };
type SessionRow = { id: string; client_id: string; status: string };
type ClientRow = {
  id: string;
  name: string;
  package_type: string | null;
  goals: GoalRow[];
  homework: HomeworkRow[];
  sessions: SessionRow[];
};

const avatarColors = [
  "bg-accent-dim text-accent",
  "bg-c-blue-dim text-c-blue",
  "bg-c-amber-dim text-c-amber",
  "bg-c-red-dim text-c-red",
];

function getProgressBarColor(pct: number) {
  if (pct > 60) return "bg-accent";
  if (pct >= 30) return "bg-c-amber";
  return "bg-c-red";
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default async function ProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <>
        <Topbar title="Progress" />
        <div className="flex-1 p-7">
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

  let allClients: ClientRow[] = [];

  if (coachId) {
    try {
      const { data } = await supabase
        .from("clients")
        .select(`
          id, name, package_type,
          goals ( id, title, progress, status, client_id ),
          homework ( id, status, client_id ),
          sessions ( id, client_id, status )
        `)
        .eq("coach_id", coachId)
        .eq("status", "active")
        .order("name", { ascending: true });
      allClients = (data ?? []) as ClientRow[];
    } catch { /* query may fail */ }
  }

  const allGoals = allClients.flatMap((c) => (Array.isArray(c.goals) ? c.goals : []));
  const totalGoals = allGoals.length;
  const completedGoals = allGoals.filter((g) => g.status === "completed" || g.progress >= 100).length;
  const onTrackGoals = allGoals.filter((g) => g.status !== "completed" && g.progress < 100 && g.progress > 60).length;
  const needsAttentionGoals = allGoals.filter((g) => g.status !== "completed" && g.progress < 100 && g.progress <= 60).length;

  return (
    <>
      <Topbar title="Progress" subtitle="Goal tracking across all clients" />
      <div className="flex-1 p-7">
        {/* Stat cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Goals" value={totalGoals} delta={`Across ${allClients.length} clients`} deltaType="neutral" />
          <StatCard
            label="On Track"
            value={onTrackGoals}
            delta={totalGoals > 0 ? `${Math.round((onTrackGoals / totalGoals) * 100)}% of goals` : "No goals yet"}
            deltaType="up"
          />
          <StatCard
            label="Needs Attention"
            value={needsAttentionGoals}
            delta={needsAttentionGoals > 0 ? `${needsAttentionGoals} goals below 60%` : "All clear"}
            deltaType={needsAttentionGoals > 0 ? "down" : "neutral"}
          />
          <StatCard
            label="Completed"
            value={completedGoals}
            delta={totalGoals > 0 ? `${Math.round((completedGoals / totalGoals) * 100)}% completion rate` : "No goals yet"}
            deltaType="neutral"
          />
        </div>

        {/* Client progress cards */}
        {allClients.length === 0 ? (
          <div className="rounded-card border border-border bg-surface py-16 text-center">
            <div className="mb-3 text-2xl opacity-40">◎</div>
            <p className="text-sm text-text-3">No clients yet. Add your first client to start tracking progress.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-5">
            {allClients.map((client, idx) => {
              const initials = getInitials(client.name);
              const colorClass = avatarColors[idx % avatarColors.length];
              const goals = Array.isArray(client.goals) ? client.goals.slice(0, 3) : [];
              const homework = Array.isArray(client.homework) ? client.homework : [];
              const sessions = Array.isArray(client.sessions) ? client.sessions : [];

              const completedHomework = homework.filter((h) => h.status === "completed").length;
              const pendingHomework = homework.filter(
                (h) => h.status === "pending" || h.status === "in-progress" || h.status === "overdue"
              ).length;
              const sessionCount = sessions.length;

              return (
                <Link href={`/dashboard/clients/${client.id}`} key={client.id} className="flex flex-col overflow-hidden rounded-card border border-border bg-surface transition-shadow hover:shadow-sm">
                  <div className="flex items-center gap-3 border-b border-border px-5 py-4">
                    <div className={`flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${colorClass}`}>
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-text">{client.name}</div>
                    </div>
                    {client.package_type && (
                      <span className="inline-flex flex-shrink-0 rounded-full bg-accent-lt px-2.5 py-1 text-[0.7rem] font-medium text-accent">
                        {client.package_type}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 px-5 py-4">
                    {goals.length === 0 ? (
                      <div className="py-4 text-center text-xs text-text-3">No goals set</div>
                    ) : (
                      <div className="flex flex-col gap-3.5">
                        {goals.map((goal) => {
                          const pct = Math.min(Math.max(Math.round(goal.progress), 0), 100);
                          const barColor = getProgressBarColor(pct);
                          return (
                            <div key={goal.id}>
                              <div className="mb-1.5 flex items-center justify-between">
                                <span className="truncate text-[0.8125rem] text-text-2">{goal.title}</span>
                                <span className="ml-2 flex-shrink-0 text-xs font-medium text-text-3">{pct}%</span>
                              </div>
                              <div className="h-[5px] overflow-hidden rounded-full bg-surface-3">
                                <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 border-t border-border px-5 py-3">
                    <span className="inline-flex rounded-full bg-surface-3 px-2.5 py-1 text-[0.7rem] font-medium text-text-3">
                      {sessionCount} {sessionCount === 1 ? "session" : "sessions"}
                    </span>
                    <span className="text-[0.7rem] text-text-3">
                      {completedHomework > 0 && <span className="text-accent">{completedHomework} completed</span>}
                      {completedHomework > 0 && pendingHomework > 0 && " · "}
                      {pendingHomework > 0 && <span className="text-c-amber">{pendingHomework} pending</span>}
                      {completedHomework === 0 && pendingHomework === 0 && <span>No homework</span>}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
