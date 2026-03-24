import { createClient } from "@/lib/supabase/server";
import { AVAILABLE_MODULES } from "@/lib/modules";

export const dynamic = "force-dynamic";

export default async function AdminModulesPage() {
  const supabase = await createClient();

  // Fetch counts per module
  const moduleCounts = new Map<string, number>();
  const moduleRevenue = new Map<string, number>();

  try {
    const { data } = await supabase
      .from("coach_modules")
      .select("module_key, is_enabled, payment_status")
      .eq("is_enabled", true);

    for (const row of data ?? []) {
      moduleCounts.set(
        row.module_key,
        (moduleCounts.get(row.module_key) ?? 0) + 1
      );
    }
  } catch { /* */ }

  // Calculate revenue per module from payments
  try {
    const { data } = await supabase
      .from("module_payments")
      .select("module_key, amount")
      .eq("status", "paid");

    for (const row of data ?? []) {
      moduleRevenue.set(
        row.module_key,
        (moduleRevenue.get(row.module_key) ?? 0) + Number(row.amount)
      );
    }
  } catch { /* */ }

  return (
    <div className="flex-1 p-7">
      <h1 className="font-serif text-3xl text-text">Modules</h1>
      <p className="mt-1 text-[0.875rem] text-text-2">
        Overview of all available modules and their usage.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {AVAILABLE_MODULES.map((mod) => {
          const activeCoaches = moduleCounts.get(mod.key) ?? 0;
          const revenue = moduleRevenue.get(mod.key) ?? 0;

          return (
            <div
              key={mod.key}
              className={`rounded-card border p-6 ${
                mod.available
                  ? "border-border bg-surface"
                  : "border-border bg-surface opacity-60"
              }`}
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="text-2xl">{mod.icon}</div>
                {!mod.available && (
                  <span className="rounded-full bg-surface-3 px-2 py-0.5 text-[0.7rem] font-medium text-text-3">
                    Coming soon
                  </span>
                )}
              </div>
              <h3 className="font-sans text-[0.9375rem] font-semibold text-text">
                {mod.name}
              </h3>
              <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-text-2">
                {mod.description}
              </p>

              <div className="mt-4 flex items-center gap-4 border-t border-border pt-4">
                <div>
                  <p className="text-[0.7rem] font-medium uppercase tracking-wide text-text-3">
                    Active Coaches
                  </p>
                  <p className="font-serif text-xl text-text">{activeCoaches}</p>
                </div>
                <div>
                  <p className="text-[0.7rem] font-medium uppercase tracking-wide text-text-3">
                    Revenue
                  </p>
                  <p className="font-serif text-xl text-text">€{revenue.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[0.7rem] font-medium uppercase tracking-wide text-text-3">
                    Price
                  </p>
                  <p className="font-serif text-xl text-text">€{mod.price}/mo</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
