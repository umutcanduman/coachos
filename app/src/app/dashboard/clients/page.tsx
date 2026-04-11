import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Topbar from "@/components/Topbar";
import ClientFilters from "./ClientFilters";
import ClientActions from "./ClientActions";
import {
  STAGE_LABELS,
  STAGE_BADGE_CLASS,
  isLifecycleStage,
  type LifecycleStage,
} from "@/lib/lifecycle";

export const dynamic = "force-dynamic";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Auth is handled by layout — if we get here, user exists
  // but guard just in case
  if (!user) {
    return (
      <>
        <Topbar title="Clients" />
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

  const filter = searchParams.filter ?? "all";

  type ClientRow = {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    status: string;
    package_type: string | null;
    created_at: string;
    lifecycle_stage: string | null;
    source: string | null;
    packages: { total_sessions: number; used_sessions: number; price: number; paid_amount: number; status: string }[];
    payments: { amount: number; status: string }[];
    sessions: { date: string; status: string }[];
  };

  let clients: ClientRow[] = [];

  if (coachId) {
    try {
      let query = supabase
        .from("clients")
        .select(`
          id, name, email, phone, status, package_type, created_at,
          lifecycle_stage, source,
          packages ( total_sessions, used_sessions, price, paid_amount, status ),
          payments ( amount, status ),
          sessions ( date, status )
        `)
        .eq("coach_id", coachId)
        .order("created_at", { ascending: false });

      if (filter === "leads") {
        query = query.in("lifecycle_stage", ["lead", "discovery", "proposal"]);
      } else if (filter === "active") {
        query = query.eq("lifecycle_stage", "active");
      } else if (filter === "alumni") {
        query = query.eq("lifecycle_stage", "alumni");
      }

      const { data } = await query;
      clients = (data ?? []) as ClientRow[];
    } catch { /* clients query may fail */ }
  }

  return (
    <>
      <Topbar title="Clients" subtitle={`${clients.length} total clients`} />
      <div className="flex-1 p-4 lg:p-7">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <ClientFilters activeFilter={filter} />
          <div className="ml-auto">
            <ClientActions existingClients={clients.map((c) => ({ id: c.id, name: c.name }))} />
          </div>
        </div>

        {/* Client table */}
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          <div className="flex flex-col overflow-x-auto">
            {/* Header */}
            <div className="grid min-w-[820px] grid-cols-[2.2fr_1.2fr_0.9fr_1.1fr_1.1fr_0.9fr_110px] items-center gap-4 px-5 py-2.5 text-[0.7rem] font-medium uppercase tracking-[0.1em] text-text-3">
              <div>Client</div>
              <div>Package</div>
              <div>Source</div>
              <div>Progress</div>
              <div>Payment</div>
              <div>Next session</div>
              <div>Stage</div>
            </div>

            {clients.length === 0 ? (
              <div className="py-16 text-center text-sm text-text-3">
                <div className="mb-3 text-2xl opacity-40">◉</div>
                No clients found
              </div>
            ) : (
              clients.map((client) => {
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

                const payments = Array.isArray(client.payments) ? client.payments : [];
                const paidAmount = payments
                  .filter((p: { status: string }) => p.status === "paid")
                  .reduce((sum: number, p: { amount: number }) => sum + Number(p.amount), 0);
                const totalAmount = payments.reduce(
                  (sum: number, p: { amount: number }) => sum + Number(p.amount),
                  0
                );
                const hasOverdue = payments.some((p: { status: string }) => p.status === "overdue");

                const nextSession = clientSessions
                  .filter(
                    (s: { date: string; status: string }) =>
                      new Date(s.date) > new Date() && s.status === "scheduled"
                  )
                  .sort(
                    (a: { date: string }, b: { date: string }) =>
                      new Date(a.date).getTime() - new Date(b.date).getTime()
                  )[0];

                const progressColor =
                  progress > 60 ? "bg-accent" : progress > 30 ? "bg-c-amber" : "bg-c-red";

                const stage: LifecycleStage = isLifecycleStage(client.lifecycle_stage)
                  ? client.lifecycle_stage
                  : "active";

                return (
                  <Link
                    key={client.id}
                    href={`/dashboard/clients/${client.id}`}
                    className="grid min-w-[820px] grid-cols-[2.2fr_1.2fr_0.9fr_1.1fr_1.1fr_0.9fr_110px] items-center gap-4 border-b border-border px-5 py-3.5 transition-colors last:border-b-0 hover:bg-surface-2"
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
                    <div className="text-[0.72rem] capitalize text-text-3">
                      {client.source ?? "—"}
                    </div>
                    <div className="min-w-[80px]">
                      <div className="h-[5px] overflow-hidden rounded-full bg-surface-3">
                        <div
                          className={`h-full rounded-full ${progressColor} transition-all`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="mt-1 text-[0.7rem] text-text-3">
                        {completedSessions}/{totalSessions} sessions
                      </div>
                    </div>
                    <div>
                      {hasOverdue ? (
                        <span className="inline-flex rounded-full bg-c-red-dim px-2.5 py-1 text-[0.7rem] font-medium text-c-red">
                          Overdue
                        </span>
                      ) : paidAmount >= totalAmount && totalAmount > 0 ? (
                        <span className="inline-flex rounded-full bg-accent-lt px-2.5 py-1 text-[0.7rem] font-medium text-accent">
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-c-amber-dim px-2.5 py-1 text-[0.7rem] font-medium text-c-amber">
                          €{paidAmount}/€{totalAmount}
                        </span>
                      )}
                    </div>
                    <div className="text-[0.8125rem] text-text-3">
                      {nextSession
                        ? new Date(nextSession.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </div>
                    <div>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[0.7rem] font-medium ${STAGE_BADGE_CLASS[stage]}`}
                      >
                        {STAGE_LABELS[stage]}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}
