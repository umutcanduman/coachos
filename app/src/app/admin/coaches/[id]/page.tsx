import { createClient } from "@/lib/supabase/server";
import { AVAILABLE_MODULES } from "@/lib/modules";
import { notFound } from "next/navigation";
import Link from "next/link";
import AdminModuleToggle from "./AdminModuleToggle";

export const dynamic = "force-dynamic";

export default async function AdminCoachDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const coachId = params.id;

  // Fetch coach
  const { data: coach } = await supabase
    .from("coaches")
    .select("id, name, email, created_at")
    .eq("id", coachId)
    .single();

  if (!coach) {
    notFound();
  }

  // Fetch coach's modules
  const moduleStatuses = new Map<
    string,
    { is_enabled: boolean; payment_status: string; activated_at: string | null }
  >();
  try {
    const { data } = await supabase
      .from("coach_modules")
      .select("module_key, is_enabled, payment_status, activated_at")
      .eq("coach_id", coachId);
    for (const row of data ?? []) {
      moduleStatuses.set(row.module_key, row);
    }
  } catch { /* */ }

  // Fetch payment history
  let payments: Array<{
    id: string;
    module_key: string;
    amount: number;
    status: string;
    created_at: string;
    stripe_session_id: string | null;
  }> = [];
  try {
    const { data } = await supabase
      .from("module_payments")
      .select("id, module_key, amount, status, created_at, stripe_session_id")
      .eq("coach_id", coachId)
      .order("created_at", { ascending: false });
    payments = (data ?? []) as typeof payments;
  } catch { /* */ }

  // Client count
  let clientCount = 0;
  try {
    const { count } = await supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("coach_id", coachId);
    clientCount = count ?? 0;
  } catch { /* */ }

  // Session count
  let sessionCount = 0;
  try {
    const { count } = await supabase
      .from("sessions")
      .select("*", { count: "exact", head: true })
      .eq("coach_id", coachId);
    sessionCount = count ?? 0;
  } catch { /* */ }

  const moduleNameMap = Object.fromEntries(
    AVAILABLE_MODULES.map((m) => [m.key, m.name])
  );

  return (
    <div className="flex-1 p-7">
      <Link
        href="/admin/coaches"
        className="mb-4 inline-flex items-center gap-1 text-[0.8125rem] text-text-2 hover:text-text"
      >
        ← Back to coaches
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl text-text">{coach.name}</h1>
          <p className="mt-1 text-[0.875rem] text-text-2">{coach.email}</p>
        </div>
        <span className="text-[0.8125rem] text-text-3">
          Joined {new Date(coach.created_at).toLocaleDateString()}
        </span>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-card border border-border bg-surface p-5">
          <p className="text-[0.75rem] font-medium uppercase tracking-wide text-text-3">Clients</p>
          <p className="mt-1 font-serif text-2xl text-text">{clientCount}</p>
        </div>
        <div className="rounded-card border border-border bg-surface p-5">
          <p className="text-[0.75rem] font-medium uppercase tracking-wide text-text-3">Sessions</p>
          <p className="mt-1 font-serif text-2xl text-text">{sessionCount}</p>
        </div>
        <div className="rounded-card border border-border bg-surface p-5">
          <p className="text-[0.75rem] font-medium uppercase tracking-wide text-text-3">Active Modules</p>
          <p className="mt-1 font-serif text-2xl text-text">
            {Array.from(moduleStatuses.values()).filter((m) => m.is_enabled).length}
          </p>
        </div>
      </div>

      {/* Module Toggles */}
      <div className="mt-8">
        <h2 className="text-[0.9375rem] font-semibold text-text">Module Management</h2>
        <p className="mt-1 text-[0.8125rem] text-text-3">
          Toggle modules on/off for this coach. Admin overrides bypass payment requirements.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {AVAILABLE_MODULES.filter((m) => m.available).map((mod) => {
            const status = moduleStatuses.get(mod.key);
            return (
              <AdminModuleToggle
                key={mod.key}
                coachId={coachId}
                moduleKey={mod.key}
                moduleName={mod.name}
                enabled={status?.is_enabled ?? false}
                paymentStatus={status?.payment_status ?? "unpaid"}
              />
            );
          })}
        </div>
      </div>

      {/* Payment History */}
      <div className="mt-8">
        <h2 className="text-[0.9375rem] font-semibold text-text">Payment History</h2>
        {payments.length === 0 ? (
          <p className="mt-4 text-[0.8125rem] text-text-3">No payments recorded.</p>
        ) : (
          <div className="mt-4 rounded-card border border-border bg-surface">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-[0.75rem] font-medium uppercase tracking-wide text-text-3">
                  <th className="px-6 py-3">Module</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-6 py-3 text-[0.8125rem] text-text">
                      {moduleNameMap[p.module_key] ?? p.module_key}
                    </td>
                    <td className="px-6 py-3 text-[0.8125rem] font-medium text-text">
                      €{p.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[0.7rem] font-medium ${
                          p.status === "paid"
                            ? "bg-accent-dim text-accent"
                            : p.status === "failed"
                            ? "bg-c-red-dim text-c-red"
                            : "bg-c-amber-dim text-c-amber"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-[0.8125rem] text-text-2">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
