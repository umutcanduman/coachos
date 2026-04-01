import { createClient } from "@/lib/supabase/server";
import { AVAILABLE_MODULES } from "@/lib/modules";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminCoachesPage() {
  const supabase = await createClient();

  // Fetch all coaches
  let coaches: Array<{
    id: string;
    name: string;
    email: string;
    created_at: string;
  }> = [];
  try {
    const { data } = await supabase
      .from("coaches")
      .select("id, name, email, created_at")
      .order("created_at", { ascending: false });
    coaches = data ?? [];
  } catch { /* */ }

  // Fetch all active modules grouped by coach
  const modulesByCoach = new Map<string, string[]>();
  try {
    const { data } = await supabase
      .from("coach_modules")
      .select("coach_id, module_key")
      .eq("is_enabled", true)
      .eq("payment_status", "paid");
    for (const row of data ?? []) {
      const existing = modulesByCoach.get(row.coach_id) ?? [];
      existing.push(row.module_key);
      modulesByCoach.set(row.coach_id, existing);
    }
  } catch { /* */ }

  // Calculate MRR per coach
  const moduleNameMap = Object.fromEntries(
    AVAILABLE_MODULES.map((m) => [m.key, m])
  );

  function getCoachMRR(coachId: string): number {
    const modules = modulesByCoach.get(coachId) ?? [];
    return modules.reduce((sum, key) => sum + (moduleNameMap[key]?.price ?? 0), 0);
  }

  return (
    <div className="flex-1 p-7">
      <h1 className="font-serif text-3xl text-text">Coaches</h1>
      <p className="mt-1 text-[0.875rem] text-text-2">
        {coaches.length} registered coach{coaches.length !== 1 ? "es" : ""}
      </p>

      <div className="mt-6 rounded-card border border-border bg-surface">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left text-[0.75rem] font-medium uppercase tracking-wide text-text-3">
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Signup Date</th>
              <th className="px-6 py-3">Active Modules</th>
              <th className="px-6 py-3">MRR</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {coaches.map((coach) => {
              const activeModules = modulesByCoach.get(coach.id) ?? [];
              const mrr = getCoachMRR(coach.id);
              return (
                <tr key={coach.id} className="border-b border-border last:border-0">
                  <td className="px-6 py-4 text-[0.8125rem] font-medium text-text">
                    {coach.name}
                  </td>
                  <td className="px-6 py-4 text-[0.8125rem] text-text-2">
                    {coach.email}
                  </td>
                  <td className="px-6 py-4 text-[0.8125rem] text-text-2">
                    {new Date(coach.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    {activeModules.length === 0 ? (
                      <span className="text-[0.8125rem] text-text-3">None</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {activeModules.map((key) => (
                          <span
                            key={key}
                            className="rounded-full bg-accent-dim px-2 py-0.5 text-[0.7rem] font-medium text-accent"
                          >
                            {moduleNameMap[key]?.name ?? key}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-[0.8125rem] font-medium text-text">
                    €{mrr.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/coaches/${coach.id}`}
                      className="text-[0.8125rem] font-medium text-accent hover:text-accent-hover"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              );
            })}
            {coaches.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-[0.8125rem] text-text-3">
                  No coaches registered yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
