import { createClient } from "@/lib/supabase/server";
import Topbar from "@/components/Topbar";
import { AVAILABLE_MODULES, getCoachModuleStatuses } from "@/lib/modules";
import ActivateButton from "./ActivateButton";
import ModuleToggle from "./ModuleToggle";

export const dynamic = "force-dynamic";

type ModuleUIStatus = "not_activated" | "pending" | "active" | "admin_deactivated";

function getModuleStatus(
  moduleKey: string,
  statuses: Map<string, { is_enabled: boolean; payment_status: string; activated_by: string | null }>
): ModuleUIStatus {
  const status = statuses.get(moduleKey);
  if (!status) return "not_activated";
  if (status.is_enabled && status.payment_status === "paid") return "active";
  if (!status.is_enabled && status.activated_by) return "admin_deactivated";
  if (status.payment_status === "paid" && !status.is_enabled) return "not_activated";
  return "not_activated";
}

export default async function ProToolsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let coachId: string | null = null;
  if (user) {
    try {
      const { data: coach } = await supabase
        .from("coaches")
        .select("id")
        .eq("user_id", user.id)
        .single();
      coachId = coach?.id ?? null;
    } catch { /* */ }
  }

  const moduleStatuses = coachId
    ? await getCoachModuleStatuses(coachId)
    : new Map();

  // Check for pending payments
  let pendingModules = new Set<string>();
  if (coachId) {
    try {
      const { data: pendingPayments } = await supabase
        .from("module_payments")
        .select("module_key")
        .eq("coach_id", coachId)
        .eq("status", "pending");
      pendingModules = new Set((pendingPayments ?? []).map((p) => p.module_key));
    } catch { /* */ }
  }

  const activeModules = AVAILABLE_MODULES.filter((m) => m.available);
  const comingSoonModules = AVAILABLE_MODULES.filter((m) => !m.available);

  return (
    <>
      <Topbar title="Professional Coaching Tools" />
      <div className="flex-1 p-7">
        {/* Hero */}
        <div className="mb-8 text-center">
          <h2 className="font-serif text-4xl text-text">Elevate your practice</h2>
          <p className="mx-auto mt-3 max-w-lg text-[0.9375rem] leading-relaxed text-text-2">
            Activate premium modules to expand your coaching toolkit. Pay only for what you need.
          </p>
        </div>

        {/* Active modules */}
        {activeModules.length > 0 && (
          <div className="mb-10">
            <h3 className="mb-4 text-xs font-medium uppercase tracking-[0.12em] text-text-3">
              Available Modules
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeModules.map((mod) => {
                const uiStatus: ModuleUIStatus = pendingModules.has(mod.key)
                  ? "pending"
                  : getModuleStatus(mod.key, moduleStatuses);
                const isActive = uiStatus === "active";

                return (
                  <div
                    key={mod.key}
                    className={`rounded-card border p-6 transition-shadow hover:shadow-sm ${
                      isActive
                        ? "border-accent/20 bg-accent-lt"
                        : "border-border bg-surface"
                    }`}
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div className="text-2xl">{mod.icon}</div>
                      <span className="text-[0.8125rem] font-semibold text-text">
                        €{mod.price}/mo
                      </span>
                    </div>
                    <h3 className="font-sans text-[0.9375rem] font-semibold text-text">
                      {mod.name}
                    </h3>
                    <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-text-2">
                      {mod.description}
                    </p>
                    <div className="mt-4">
                      <ActivateButton
                        moduleKey={mod.key}
                        status={uiStatus}
                        price={mod.price}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Coming soon modules */}
        {comingSoonModules.length > 0 && (
          <div className="mb-10">
            <h3 className="mb-4 text-xs font-medium uppercase tracking-[0.12em] text-text-3">
              Upcoming
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {comingSoonModules.map((mod) => (
                <div
                  key={mod.key}
                  className="rounded-card border border-border bg-surface p-6 opacity-60"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="text-2xl">{mod.icon}</div>
                    <ModuleToggle
                      moduleKey={mod.key}
                      enabled={false}
                      available={false}
                    />
                  </div>
                  <h3 className="font-sans text-[0.9375rem] font-semibold text-text">
                    {mod.name}
                  </h3>
                  <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-text-2">
                    {mod.description}
                  </p>
                  <p className="mt-3 text-[0.75rem] font-medium text-text-3">
                    €{mod.price}/mo when available
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
