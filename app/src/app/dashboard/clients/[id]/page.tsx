import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Topbar from "@/components/Topbar";
import ProfileTabs from "./ProfileTabs";
import ProfileActions from "./ProfileActions";

export const dynamic = "force-dynamic";

export default async function ClientProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <>
        <Topbar title="Client Profile" />
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

  if (!coachId) notFound();

  // Fetch client with related data
  let client: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    location: string | null;
    package_type: string | null;
    status: string;
    created_at: string;
    packages: { id: string; total_sessions: number; used_sessions: number; price: number; paid_amount: number; status: string; start_date: string | null; end_date: string | null }[];
  } | null = null;

  try {
    const { data } = await supabase
      .from("clients")
      .select(`
        id, name, email, phone, location, package_type, status, created_at,
        packages ( id, total_sessions, used_sessions, price, paid_amount, status, start_date, end_date )
      `)
      .eq("id", params.id)
      .eq("coach_id", coachId)
      .single();
    client = data;
  } catch { /* client query may fail */ }

  if (!client) notFound();

  // Fetch sessions, homework, payments, goals — each in try/catch
  let sessions: { id: string; date: string; duration: number; type: string; status: string; notes: string | null }[] = [];
  let homework: { id: string; title: string; description: string | null; due_date: string | null; status: string; category: string | null }[] = [];
  let payments: { id: string; amount: number; status: string; due_date: string | null; paid_date: string | null; description: string | null }[] = [];
  let goals: { id: string; title: string; progress: number; status: string }[] = [];

  try {
    const { data } = await supabase
      .from("sessions")
      .select("id, date, duration, type, status, notes")
      .eq("client_id", client.id)
      .eq("coach_id", coachId)
      .order("date", { ascending: false });
    sessions = data ?? [];
  } catch { /* sessions table may not exist */ }

  try {
    const { data } = await supabase
      .from("homework")
      .select("id, title, description, due_date, status, category")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false });
    homework = data ?? [];
  } catch { /* homework table may not exist */ }

  try {
    const { data } = await supabase
      .from("payments")
      .select("id, amount, status, due_date, paid_date, description")
      .eq("client_id", client.id)
      .eq("coach_id", coachId)
      .order("created_at", { ascending: false });
    payments = data ?? [];
  } catch { /* payments table may not exist */ }

  try {
    const { data } = await supabase
      .from("goals")
      .select("id, title, progress, status")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false });
    goals = data ?? [];
  } catch { /* goals table may not exist */ }

  const initials = client.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const pkg = Array.isArray(client.packages) ? client.packages[0] : client.packages;

  function getProgressBarColor(pct: number) {
    if (pct > 60) return "bg-accent";
    if (pct >= 30) return "bg-c-amber";
    return "bg-c-red";
  }

  return (
    <>
      <Topbar title="Client Profile" />
      <div className="flex-1 p-7">
        {/* Back link */}
        <Link
          href="/dashboard/clients"
          className="mb-4 inline-flex items-center gap-1 text-sm text-text-3 hover:text-text-2"
        >
          ← Back to clients
        </Link>

        {/* Profile Header */}
        <div className="mb-5 flex items-center gap-6 rounded-card border border-border bg-surface p-6">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-accent-dim text-[1.375rem] font-semibold text-accent">
            {initials}
          </div>
          <div className="flex-1">
            <h2 className="mb-1 font-serif text-2xl text-text">{client.name}</h2>
            <p className="mb-2.5 text-[0.8125rem] text-text-3">
              {client.email}
              {client.phone && ` · ${client.phone}`}
              {client.location && ` · ${client.location}`}
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex rounded-full bg-accent-lt px-2.5 py-1 text-[0.7rem] font-medium text-accent">
                {client.status}
              </span>
              {client.package_type && (
                <span className="inline-flex rounded-full bg-c-blue-dim px-2.5 py-1 text-[0.7rem] font-medium text-c-blue">
                  {client.package_type}
                </span>
              )}
              {pkg && (
                <span className="inline-flex rounded-full bg-surface-3 px-2.5 py-1 text-[0.7rem] font-medium text-text-3">
                  {pkg.used_sessions}/{pkg.total_sessions} sessions
                </span>
              )}
            </div>
          </div>
          <ProfileActions client={{
            id: client.id,
            name: client.name,
            email: client.email,
            phone: client.phone,
            location: client.location,
            package_type: client.package_type,
            status: client.status,
          }} />
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-[280px_1fr] gap-5">
          {/* Sidebar */}
          <div className="flex flex-col gap-5">
            {/* Package card */}
            {pkg ? (
              <div className="rounded-card border border-border bg-surface">
                <div className="border-b border-border px-5 py-4">
                  <div className="text-sm font-medium text-text">Package Overview</div>
                </div>
                <div className="flex flex-col">
                  <InfoRow label="Package" value={client.package_type ?? "—"} />
                  <InfoRow label="Sessions" value={`${pkg.used_sessions} / ${pkg.total_sessions} used`} />
                  <InfoRow label="Price" value={`€${Number(pkg.price).toLocaleString()}`} />
                  <InfoRow label="Paid" value={`€${Number(pkg.paid_amount).toLocaleString()}`} />
                  <InfoRow label="Status" value={pkg.status} />
                  {pkg.start_date && (
                    <InfoRow
                      label="Started"
                      value={new Date(pkg.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    />
                  )}
                  {pkg.end_date && (
                    <InfoRow
                      label="Ends"
                      value={new Date(pkg.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    />
                  )}
                </div>
                {/* Session dot tracker */}
                <div className="px-5 py-4">
                  <div className="mb-2 text-[0.72rem] uppercase tracking-[0.08em] text-text-3">
                    Session progress
                  </div>
                  <div className="mb-3 flex gap-[5px]">
                    {Array.from({ length: pkg.total_sessions }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-2.5 w-2.5 rounded-full ${
                          i < pkg.used_sessions
                            ? "bg-accent"
                            : i === pkg.used_sessions
                            ? "bg-c-amber"
                            : "bg-surface-3"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="h-[5px] overflow-hidden rounded-full bg-surface-3">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${Math.round((pkg.used_sessions / pkg.total_sessions) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-card border border-border bg-surface p-5 text-center text-sm text-text-3">
                No package assigned
              </div>
            )}

            {/* Client info */}
            <div className="rounded-card border border-border bg-surface">
              <div className="border-b border-border px-5 py-4">
                <div className="text-sm font-medium text-text">Client Info</div>
              </div>
              <div className="flex flex-col">
                <InfoRow label="Email" value={client.email ?? "—"} />
                <InfoRow label="Phone" value={client.phone ?? "—"} />
                <InfoRow label="Location" value={client.location ?? "—"} />
                <InfoRow
                  label="Since"
                  value={new Date(client.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                />
              </div>
            </div>

            {/* Goals & Focus Areas */}
            <div className="rounded-card border border-border bg-surface">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div className="text-sm font-medium text-text">Goals & Focus Areas</div>
              </div>
              <div className="p-5">
                {goals.length === 0 ? (
                  <div className="py-4 text-center text-xs text-text-3">No goals set yet</div>
                ) : (
                  <div className="flex flex-col gap-3.5">
                    {goals.slice(0, 5).map((goal) => {
                      const pct = Math.min(Math.max(Math.round(goal.progress), 0), 100);
                      const barColor = getProgressBarColor(pct);
                      return (
                        <div key={goal.id}>
                          <div className="mb-1.5 flex items-center justify-between">
                            <span className="truncate text-[0.8125rem] text-text-2">{goal.title}</span>
                            <span
                              className={`ml-2 flex-shrink-0 text-xs font-medium ${
                                pct > 60 ? "text-accent" : pct >= 30 ? "text-c-amber" : "text-c-red"
                              }`}
                            >
                              {pct}%
                            </span>
                          </div>
                          <div className="h-[5px] overflow-hidden rounded-full bg-surface-3">
                            <div
                              className={`h-full rounded-full ${barColor} transition-all`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main content - Tabs */}
          <ProfileTabs
            sessions={sessions}
            homework={homework}
            payments={payments}
            goals={goals}
            clientId={client.id}
            clientCreatedAt={client.created_at}
          />
        </div>
      </div>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-3 last:border-b-0">
      <span className="flex-shrink-0 text-xs font-medium text-text-3">{label}</span>
      <span className="text-right text-[0.8125rem] text-text-2">{value}</span>
    </div>
  );
}
