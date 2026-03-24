import { createClient } from "@/lib/supabase/server";
import { AVAILABLE_MODULES } from "@/lib/modules";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  // Total coaches
  let totalCoaches = 0;
  try {
    const { count } = await supabase
      .from("coaches")
      .select("*", { count: "exact", head: true });
    totalCoaches = count ?? 0;
  } catch { /* */ }

  // Active module subscriptions
  let activeSubscriptions = 0;
  try {
    const { count } = await supabase
      .from("coach_modules")
      .select("*", { count: "exact", head: true })
      .eq("is_enabled", true)
      .eq("payment_status", "paid");
    activeSubscriptions = count ?? 0;
  } catch { /* */ }

  // Total paid revenue
  let totalRevenue = 0;
  try {
    const { data: payments } = await supabase
      .from("module_payments")
      .select("amount")
      .eq("status", "paid");
    totalRevenue = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  } catch { /* */ }

  // Recent activations
  let recentActivations: Array<{
    id: string;
    module_key: string;
    activated_at: string;
    coach_id: string;
    coach_name: string;
  }> = [];
  try {
    const { data } = await supabase
      .from("coach_modules")
      .select("id, module_key, activated_at, coach_id, coaches(name)")
      .eq("is_enabled", true)
      .order("activated_at", { ascending: false })
      .limit(10);
    recentActivations = (data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      module_key: r.module_key as string,
      activated_at: r.activated_at as string,
      coach_id: r.coach_id as string,
      coach_name: ((r.coaches as Record<string, unknown>)?.name as string) ?? "Unknown",
    }));
  } catch { /* */ }

  // Recent payments
  let recentPayments: Array<{
    id: string;
    module_key: string;
    amount: number;
    status: string;
    created_at: string;
    coach_name: string;
  }> = [];
  try {
    const { data } = await supabase
      .from("module_payments")
      .select("id, module_key, amount, status, created_at, coach_id, coaches(name)")
      .order("created_at", { ascending: false })
      .limit(10);
    recentPayments = (data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      module_key: r.module_key as string,
      amount: Number(r.amount),
      status: r.status as string,
      created_at: r.created_at as string,
      coach_name: ((r.coaches as Record<string, unknown>)?.name as string) ?? "Unknown",
    }));
  } catch { /* */ }

  const moduleNameMap = Object.fromEntries(
    AVAILABLE_MODULES.map((m) => [m.key, m.name])
  );

  return (
    <div className="flex-1 p-7">
      <h1 className="font-serif text-3xl text-text">Admin Overview</h1>
      <p className="mt-1 text-[0.875rem] text-text-2">Platform metrics and recent activity.</p>

      {/* KPI Cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-card border border-border bg-surface p-6">
          <p className="text-[0.75rem] font-medium uppercase tracking-wide text-text-3">Total Coaches</p>
          <p className="mt-2 font-serif text-3xl text-text">{totalCoaches}</p>
        </div>
        <div className="rounded-card border border-border bg-surface p-6">
          <p className="text-[0.75rem] font-medium uppercase tracking-wide text-text-3">Active Subscriptions</p>
          <p className="mt-2 font-serif text-3xl text-text">{activeSubscriptions}</p>
        </div>
        <div className="rounded-card border border-border bg-surface p-6">
          <p className="text-[0.75rem] font-medium uppercase tracking-wide text-text-3">Total Revenue</p>
          <p className="mt-2 font-serif text-3xl text-text">€{totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activations */}
        <div className="rounded-card border border-border bg-surface p-6">
          <h2 className="text-[0.9375rem] font-semibold text-text">Recent Activations</h2>
          {recentActivations.length === 0 ? (
            <p className="mt-4 text-[0.8125rem] text-text-3">No activations yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {recentActivations.map((a) => (
                <div key={a.id} className="flex items-center justify-between text-[0.8125rem]">
                  <div>
                    <span className="font-medium text-text">{a.coach_name}</span>
                    <span className="text-text-3"> activated </span>
                    <span className="font-medium text-text">{moduleNameMap[a.module_key] ?? a.module_key}</span>
                  </div>
                  {a.activated_at && (
                    <span className="text-text-3">
                      {new Date(a.activated_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="rounded-card border border-border bg-surface p-6">
          <h2 className="text-[0.9375rem] font-semibold text-text">Recent Payments</h2>
          {recentPayments.length === 0 ? (
            <p className="mt-4 text-[0.8125rem] text-text-3">No payments yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {recentPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-[0.8125rem]">
                  <div>
                    <span className="font-medium text-text">{p.coach_name}</span>
                    <span className="text-text-3"> — </span>
                    <span className="text-text">{moduleNameMap[p.module_key] ?? p.module_key}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2 py-0.5 text-[0.7rem] font-medium ${
                      p.status === "paid"
                        ? "bg-accent-dim text-accent"
                        : p.status === "failed"
                        ? "bg-c-red-dim text-c-red"
                        : "bg-c-amber-dim text-c-amber"
                    }`}>
                      {p.status}
                    </span>
                    <span className="font-medium text-text">€{p.amount.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
