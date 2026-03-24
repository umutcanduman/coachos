import { createClient } from "@/lib/supabase/server";

// ────────────────────────────────────────────────────────────
// Module registry — single source of truth for all add-ons
// ────────────────────────────────────────────────────────────

export type ModuleCategory =
  | "client_management"
  | "communication"
  | "assessment"
  | "content";

export interface ModuleDefinition {
  key: string;
  name: string;
  description: string;
  icon: string;
  category: ModuleCategory;
  /** Route under /dashboard (null = no dedicated page) */
  route: string | null;
  /** False = shown as "Coming Soon" and cannot be toggled */
  available: boolean;
  /** Monthly price in EUR (0 = free) */
  price: number;
}

export const AVAILABLE_MODULES: ModuleDefinition[] = [
  {
    key: "agreements",
    name: "Client Agreements",
    description:
      "Store and manage coaching agreements with structured key terms, auto-expiry, and per-client tracking.",
    icon: "📄",
    category: "client_management",
    route: "/dashboard/agreements",
    available: true,
    price: 9,
  },
  {
    key: "whatsapp_reminders",
    name: "WhatsApp Reminders",
    description:
      "Automatic session reminders via WhatsApp. Configurable timing and message templates.",
    icon: "💬",
    category: "communication",
    route: null,
    available: true,
    price: 12,
  },
  {
    key: "journaling",
    name: "Journaling",
    description:
      "Guided journaling templates for clients between sessions.",
    icon: "📓",
    category: "content",
    route: null,
    available: false,
    price: 7,
  },
  {
    key: "assessments",
    name: "Assessments",
    description:
      "Validated coaching assessments: Wheel of Life, Values, Strengths.",
    icon: "📊",
    category: "assessment",
    route: null,
    available: false,
    price: 15,
  },
  {
    key: "group_coaching",
    name: "Group Coaching",
    description:
      "Manage group sessions, breakout rooms, shared homework.",
    icon: "👥",
    category: "client_management",
    route: null,
    available: false,
    price: 19,
  },
  {
    key: "resource_library",
    name: "Resource Library",
    description:
      "Curated worksheets, exercises, and reading lists for clients.",
    icon: "📚",
    category: "content",
    route: null,
    available: false,
    price: 9,
  },
  {
    key: "ai_session_prep",
    name: "AI Session Prep",
    description:
      "AI-generated session briefs based on client history and goals.",
    icon: "🤖",
    category: "client_management",
    route: null,
    available: false,
    price: 25,
  },
  {
    key: "integrations",
    name: "Integrations",
    description:
      "Connect with Calendly, Stripe, Zoom, and more.",
    icon: "🔗",
    category: "communication",
    route: null,
    available: false,
    price: 15,
  },
];

// ────────────────────────────────────────────────────────────
// Types for module status (returned from DB)
// ────────────────────────────────────────────────────────────

export interface CoachModuleStatus {
  module_key: string;
  is_enabled: boolean;
  payment_status: "unpaid" | "paid" | "refunded";
  activated_by: string | null;
}

// ────────────────────────────────────────────────────────────
// Helper functions (server-side only)
// ────────────────────────────────────────────────────────────

/**
 * Returns the set of enabled module keys for a coach.
 */
export async function getEnabledModules(
  coachId: string
): Promise<Set<string>> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("coach_modules")
      .select("module_key")
      .eq("coach_id", coachId)
      .eq("is_enabled", true);
    return new Set((data ?? []).map((r) => r.module_key));
  } catch {
    return new Set();
  }
}

/**
 * Returns detailed module status for all modules a coach has interacted with.
 */
export async function getCoachModuleStatuses(
  coachId: string
): Promise<Map<string, CoachModuleStatus>> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("coach_modules")
      .select("module_key, is_enabled, payment_status, activated_by")
      .eq("coach_id", coachId);
    const map = new Map<string, CoachModuleStatus>();
    for (const row of data ?? []) {
      map.set(row.module_key, row as CoachModuleStatus);
    }
    return map;
  } catch {
    return new Map();
  }
}

/**
 * Check if a specific module is enabled for a coach.
 */
export async function isModuleEnabled(
  coachId: string,
  moduleKey: string
): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("coach_modules")
      .select("is_enabled")
      .eq("coach_id", coachId)
      .eq("module_key", moduleKey)
      .single();
    return data?.is_enabled === true;
  } catch {
    return false;
  }
}

/**
 * Enable a module for a coach (upsert).
 */
export async function enableModule(
  coachId: string,
  moduleKey: string,
  settings: Record<string, unknown> = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("coach_modules").upsert(
      {
        coach_id: coachId,
        module_key: moduleKey,
        is_enabled: true,
        settings,
        activated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "coach_id,module_key" }
    );
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

/**
 * Disable a module for a coach.
 */
export async function disableModule(
  coachId: string,
  moduleKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("coach_modules")
      .update({
        is_enabled: false,
        deactivated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("coach_id", coachId)
      .eq("module_key", moduleKey);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
