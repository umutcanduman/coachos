import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Topbar from "@/components/Topbar";
import StatCard from "@/components/StatCard";
import RevenueChart from "@/components/RevenueChart";
import DashboardSessionActions from "./DashboardSessionActions";
import NoteIndicator from "./NoteIndicator";

export const dynamic = "force-dynamic";

type ClientWithRelations = {
  id: string;
  name: string;
  email: string;
  status: string;
  package_type: string | null;
  created_at: string;
  packages: { total_sessions: number; used_sessions: number; status: string }[];
  payments: { amount: number; status: string }[];
  sessions: { date: string; status: string }[];
};

type Referral = {
  id: string;
  referrer_name: string;
  referrer_email: string;
  referred_name: string;
  status: string;
  gift_status: string;
};

async function getDashboardData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get or create coach profile
  let coachId: string | null = null;
  try {
    const { data: coach } = await supabase
      .from("coaches")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (coach) {
      coachId = coach.id;
    } else {
      const { data: newCoach } = await supabase
        .from("coaches")
        .insert({
          user_id: user.id,
          email: user.email ?? "",
          name: user.user_metadata?.name ?? user.email ?? "Coach",
        })
        .select("id")
        .single();
      coachId = newCoach?.id ?? null;
    }
  } catch {
    // coaches table may not exist yet
  }

  if (!coachId) {
    return {
      user,
      activeClients: 0,
      upcomingSessions: [] as { id: string; date: string; duration: number; type: string; status: string; notes: string | null; clientName: string }[],
      openHomework: 0,
      totalRevenue: 0,
      monthlyRevenue: [] as { month: string; revenue: number }[],
      allClients: [] as ClientWithRelations[],
      referrals: [] as Referral[],
    };
  }

  // Fetch all data — each query is independent, catch individually
  let activeClients = 0;
  let upcomingSessions: { id: string; date: string; duration: number; type: string; status: string; notes: string | null; clientName: string }[] = [];
  let openHomework = 0;
  let totalRevenue = 0;
  let monthlyRevenue: { month: string; revenue: number }[] = [];
  let allClients: ClientWithRelations[] = [];
  let referrals: Referral[] = [];

  try {
    const { count } = await supabase
      .from("clients")
      .select("id", { count: "exact" })
      .eq("coach_id", coachId)
      .eq("status", "active");
    activeClients = count ?? 0;
  } catch { /* clients table may not exist */ }

  try {
    const { data } = await supabase
      .from("sessions")
      .select("id, client_id, date, duration, type, status, notes, clients(name)")
      .eq("coach_id", coachId)
      .gte("date", new Date().toISOString())
      .order("date", { ascending: true })
      .limit(5);
    upcomingSessions = (data ?? []).map((s: Record<string, unknown>) => ({
      id: s.id as string,
      date: s.date as string,
      duration: s.duration as number,
      type: s.type as string,
      status: s.status as string,
      notes: (s.notes as string) ?? null,
      clientName: ((s.clients as Record<string, unknown>)?.name as string) ?? "Client",
    }));
  } catch { /* sessions table may not exist */ }

  try {
    // Get client IDs for this coach, then filter homework
    const { data: coachClients } = await supabase
      .from("clients")
      .select("id")
      .eq("coach_id", coachId);
    const clientIds = (coachClients ?? []).map((c) => c.id);
    if (clientIds.length > 0) {
      const { count } = await supabase
        .from("homework")
        .select("id", { count: "exact" })
        .in("client_id", clientIds)
        .in("status", ["pending", "in-progress", "overdue"]);
      openHomework = count ?? 0;
    }
  } catch { /* homework table may not exist */ }

  try {
    const { data } = await supabase
      .from("payments")
      .select("id, amount, status, paid_date")
      .eq("coach_id", coachId)
      .eq("status", "paid");
    const paidPayments = data ?? [];
    totalRevenue = paidPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    // Compute monthly revenue for last 6 months
    const now = new Date();
    const months: { month: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("en-US", { month: "short" });
      const year = d.getFullYear();
      const month = d.getMonth();
      const rev = paidPayments
        .filter((p) => {
          if (!p.paid_date) return false;
          const pd = new Date(p.paid_date);
          return pd.getFullYear() === year && pd.getMonth() === month;
        })
        .reduce((sum, p) => sum + Number(p.amount), 0);
      months.push({ month: label, revenue: rev });
    }
    monthlyRevenue = months;
  } catch { /* payments table may not exist */ }

  try {
    const { data } = await supabase
      .from("clients")
      .select(`
        id, name, email, status, package_type, created_at,
        packages ( total_sessions, used_sessions, status ),
        payments ( amount, status ),
        sessions ( date, status )
      `)
      .eq("coach_id", coachId)
      .order("created_at", { ascending: false })
      .limit(5);
    allClients = (data ?? []) as ClientWithRelations[];
  } catch { /* clients query may fail */ }

  try {
    const { data } = await supabase
      .from("referrals")
      .select("id, referrer_name, referrer_email, referred_name, status, gift_status")
      .eq("coach_id", coachId)
      .order("created_at", { ascending: false })
      .limit(10);
    referrals = (data ?? []) as Referral[];
  } catch { /* referrals table may not exist */ }

  return {
    user,
    activeClients,
    upcomingSessions,
    openHomework,
    totalRevenue,
    monthlyRevenue,
    allClients,
    referrals,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  // data is null only if auth completely failed — layout already handles redirect
  const {
    activeClients = 0,
    upcomingSessions = [],
    openHomework = 0,
    totalRevenue = 0,
    monthlyRevenue = [],
    allClients = [],
    referrals = [],
  } = data ?? {};

  const today = new Date();
  const subtitle = today.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Build top referrers from referral data
  const referrerMap = new Map<
    string,
    { name: string; count: number; giftStatus: string }
  >();
  for (const r of referrals) {
    const existing = referrerMap.get(r.referrer_email);
    if (existing) {
      existing.count += 1;
      if (r.gift_status === "pending") existing.giftStatus = "pending";
    } else {
      referrerMap.set(r.referrer_email, {
        name: r.referrer_name,
        count: 1,
        giftStatus: r.gift_status ?? "pending",
      });
    }
  }
  const topReferrers = Array.from(referrerMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return (
    <>
      <Topbar title="Dashboard" subtitle={subtitle} />
      <div className="flex-1 p-7">
        {/* Stat cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Active Clients"
            value={activeClients}
            delta={`${activeClients} total`}
            deltaType="neutral"
          />
          <StatCard
            label="Revenue"
            value={`€${totalRevenue.toLocaleString()}`}
            delta="All time paid"
            deltaType="up"
          />
          <StatCard
            label="Upcoming Sessions"
            value={upcomingSessions.length}
            delta="Scheduled"
            deltaType="neutral"
          />
          <StatCard
            label="Open Homeworks"
            value={openHomework}
            delta={openHomework > 0 ? "Needs attention" : "All clear"}
            deltaType={openHomework > 3 ? "down" : "neutral"}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_340px]">
          {/* Left column */}
          <div className="flex flex-col gap-5">
            {/* Upcoming Sessions */}
            <div className="overflow-hidden rounded-card border border-border bg-surface">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                  <div className="text-sm font-medium text-text">Upcoming Sessions</div>
                  <div className="mt-0.5 text-xs text-text-3">Next 14 days</div>
                </div>
                <Link href="/dashboard/sessions" className="text-xs text-accent hover:underline">
                  View all →
                </Link>
              </div>
              <div className="px-1 py-3">
                {upcomingSessions.length === 0 ? (
                  <div className="py-12 text-center text-sm text-text-3">
                    <div className="mb-3 text-2xl opacity-40">◷</div>
                    No upcoming sessions
                  </div>
                ) : (
                  upcomingSessions.map((session) => {
                    const date = new Date(session.date);
                    return (
                      <div
                        key={session.id}
                        className="flex items-start gap-4 border-b border-border px-4 py-3.5 last:border-b-0"
                      >
                        <div className="flex-shrink-0 rounded-lg bg-surface-2 px-3 py-2 text-center">
                          <div className="font-serif text-[1.375rem] leading-none text-text">
                            {date.getDate()}
                          </div>
                          <div className="mt-0.5 text-[0.65rem] uppercase tracking-[0.1em] text-text-3">
                            {date.toLocaleDateString("en-US", { month: "short" })}
                          </div>
                        </div>
                        <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-accent" />
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-text">{session.clientName}</h4>
                          <p className="text-xs text-text-3">
                            {session.type} · {session.duration} min
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <div className="text-sm font-medium text-text">
                            {date.toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            })}
                          </div>
                          <div className="text-[0.7rem] text-text-3">{session.duration} min</div>
                        </div>
                        {session.notes && <NoteIndicator notes={session.notes} />}
                        <DashboardSessionActions sessionId={session.id} />
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Client Pulse */}
            <div className="overflow-hidden rounded-card border border-border bg-surface">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                  <div className="text-sm font-medium text-text">Client Pulse</div>
                  <div className="mt-0.5 text-xs text-text-3">Engagement & package status</div>
                </div>
                <Link href="/dashboard/clients" className="text-xs text-accent hover:underline">
                  All clients →
                </Link>
              </div>
              <div className="flex flex-col">
                <div className="grid grid-cols-[2.5fr_1.5fr_1.25fr_1.25fr_1fr_80px] items-center gap-4 px-5 py-2.5 text-[0.7rem] font-medium uppercase tracking-[0.1em] text-text-3">
                  <div>Client</div>
                  <div>Package</div>
                  <div>Progress</div>
                  <div>Payment</div>
                  <div>Last session</div>
                  <div></div>
                </div>
                {allClients.length === 0 ? (
                  <div className="py-12 text-center text-sm text-text-3">
                    <div className="mb-3 text-2xl opacity-40">◉</div>
                    No clients yet. Add your first client to get started.
                  </div>
                ) : (
                  allClients.map((client) => {
                    const initials = client.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2);
                    const pkgArr = Array.isArray(client.packages) ? client.packages : (client.packages ? [client.packages] : []);
                    const pkg = pkgArr.find((p: { status: string }) => p.status === "active") ?? pkgArr[0] ?? null;
                    const totalSessions = pkg?.total_sessions ?? 0;
                    const clientSessions = Array.isArray(client.sessions) ? client.sessions : [];
                    const completedSessions = clientSessions.filter((s: { status: string }) => s.status === "completed").length;
                    const progress = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
                    const paidPayments = Array.isArray(client.payments)
                      ? client.payments.filter((p: { status: string }) => p.status === "paid")
                      : [];
                    const lastSession = Array.isArray(client.sessions)
                      ? client.sessions.sort(
                          (a: { date: string }, b: { date: string }) =>
                            new Date(b.date).getTime() - new Date(a.date).getTime()
                        )[0]
                      : null;

                    return (
                      <Link
                        key={client.id}
                        href={`/dashboard/clients/${client.id}`}
                        className="grid grid-cols-[2.5fr_1.5fr_1.25fr_1.25fr_1fr_80px] items-center gap-4 border-b border-border px-5 py-3.5 transition-colors last:border-b-0 hover:bg-surface-2"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full bg-accent-dim text-xs font-semibold text-accent">
                            {initials}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-text">{client.name}</div>
                            <div className="text-xs text-text-3">{client.email}</div>
                          </div>
                        </div>
                        <div>
                          <span className="inline-flex rounded-full bg-accent-lt px-2.5 py-1 text-[0.7rem] font-medium text-accent">
                            {client.package_type ?? "—"}
                          </span>
                        </div>
                        <div className="min-w-[80px]">
                          <div className="h-[5px] overflow-hidden rounded-full bg-surface-3">
                            <div
                              className="h-full rounded-full bg-accent transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="mt-1 text-[0.7rem] text-text-3">
                            {completedSessions}/{totalSessions} sessions
                          </div>
                        </div>
                        <div>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[0.7rem] font-medium ${
                              paidPayments.length > 0
                                ? "bg-accent-lt text-accent"
                                : "bg-c-amber-dim text-c-amber"
                            }`}
                          >
                            {paidPayments.length > 0 ? "Paid" : "Pending"}
                          </span>
                        </div>
                        <div className="text-[0.8125rem] text-text-3">
                          {lastSession
                            ? new Date(lastSession.date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })
                            : "—"}
                        </div>
                        <div>
                          <span className="inline-flex rounded-full bg-surface-3 px-2.5 py-1 text-[0.7rem] font-medium text-text-3">
                            {client.status}
                          </span>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-5">
            <RevenueChart data={monthlyRevenue} />

            {/* Activity Feed */}
            <div className="overflow-hidden rounded-card border border-border bg-surface">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                  <div className="text-sm font-medium text-text">Activity</div>
                  <div className="mt-0.5 text-xs text-text-3">Recent events</div>
                </div>
              </div>
              <div className="px-5 py-2">
                {upcomingSessions.length === 0 && allClients.length === 0 ? (
                  <div className="py-8 text-center text-sm text-text-3">No activity yet</div>
                ) : (
                  <div className="flex flex-col">
                    {allClients.slice(0, 4).map((client) => (
                      <div
                        key={client.id}
                        className="flex items-start gap-3.5 border-b border-border py-3 last:border-b-0"
                      >
                        <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-accent-lt text-xs text-accent">
                          ✓
                        </div>
                        <div>
                          <p className="text-[0.8125rem] leading-relaxed text-text-2">
                            <strong className="font-medium text-text">{client.name}</strong> was
                            added as a client
                          </p>
                          <time className="text-[0.7rem] text-text-3">
                            {new Date(client.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </time>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Top Referrers */}
            <div className="overflow-hidden rounded-card border border-border bg-surface">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div className="text-sm font-medium text-text">Top Referrers</div>
                <Link href="/dashboard/referrals" className="text-xs text-accent hover:underline">
                  All →
                </Link>
              </div>
              <div className="px-5 py-3">
                {topReferrers.length === 0 ? (
                  <div className="py-6 text-center text-sm text-text-3">No referrals yet</div>
                ) : (
                  <div className="flex flex-col gap-3.5">
                    {topReferrers.map((referrer) => {
                      const initials = referrer.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2);
                      return (
                        <div key={referrer.name} className="flex items-center gap-3.5">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent-dim text-[0.8rem] font-semibold text-accent">
                            {initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-text">{referrer.name}</div>
                            <div className="text-xs text-text-3">
                              {referrer.count} {referrer.count === 1 ? "referral" : "referrals"} sent
                            </div>
                          </div>
                          {referrer.giftStatus === "pending" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(109,40,217,0.10)] bg-c-purple-dim px-2.5 py-1 text-[0.72rem] font-medium text-c-purple">
                              Gift pending
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-accent-lt px-2.5 py-1 text-[0.7rem] font-medium text-accent">
                              Rewarded ✓
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
