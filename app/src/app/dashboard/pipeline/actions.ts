"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { isLifecycleStage } from "@/lib/lifecycle";

async function getCoachId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: coach } = await supabase
      .from("coaches")
      .select("id")
      .eq("user_id", user.id)
      .single();
    return coach?.id ?? null;
  } catch {
    return null;
  }
}

async function verifyClientOwnership(clientId: string, coachId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("clients")
      .select("id")
      .eq("id", clientId)
      .eq("coach_id", coachId)
      .single();
    return !!data;
  } catch {
    return false;
  }
}

export async function moveClientStage(clientId: string, stage: string) {
  const coachId = await getCoachId();
  if (!coachId) return { success: false, error: "Not authenticated" };

  if (!isLifecycleStage(stage)) {
    return { success: false, error: "Invalid stage" };
  }
  if (!(await verifyClientOwnership(clientId, coachId))) {
    return { success: false, error: "Client not found" };
  }

  const updates: Record<string, unknown> = { lifecycle_stage: stage };
  if (stage === "alumni") {
    updates.alumni_since = new Date().toISOString().slice(0, 10);
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("clients")
      .update(updates)
      .eq("id", clientId)
      .eq("coach_id", coachId);
    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/pipeline");
    revalidatePath("/dashboard/clients");
    revalidatePath(`/dashboard/clients/${clientId}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    console.error("moveClientStage failed", e);
    return { success: false, error: "Something went wrong" };
  }
}

type OnboardingField =
  | "welcome_email_sent"
  | "agreement_sent"
  | "goals_set"
  | "first_session_scheduled"
  | "intake_homework_assigned";

const ONBOARDING_FIELDS: OnboardingField[] = [
  "welcome_email_sent",
  "agreement_sent",
  "goals_set",
  "first_session_scheduled",
  "intake_homework_assigned",
];

export async function toggleOnboardingItem(
  clientId: string,
  field: string,
  value: boolean
) {
  const coachId = await getCoachId();
  if (!coachId) return { success: false, error: "Not authenticated" };
  if (!(ONBOARDING_FIELDS as string[]).includes(field)) {
    return { success: false, error: "Invalid field" };
  }
  if (!(await verifyClientOwnership(clientId, coachId))) {
    return { success: false, error: "Client not found" };
  }

  try {
    const supabase = await createClient();
    const update: Record<string, unknown> = {
      [field]: value,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from("onboarding_checklists")
      .upsert(
        {
          client_id: clientId,
          coach_id: coachId,
          ...update,
        },
        { onConflict: "client_id" }
      );
    if (error) return { success: false, error: error.message };
    revalidatePath(`/dashboard/clients/${clientId}`);
    return { success: true };
  } catch (e) {
    console.error("toggleOnboardingItem failed", e);
    return { success: false, error: "Something went wrong" };
  }
}

export async function completeOnboarding(clientId: string) {
  const coachId = await getCoachId();
  if (!coachId) return { success: false, error: "Not authenticated" };
  if (!(await verifyClientOwnership(clientId, coachId))) {
    return { success: false, error: "Client not found" };
  }

  try {
    const supabase = await createClient();
    const now = new Date().toISOString();
    const { error: clErr } = await supabase
      .from("onboarding_checklists")
      .update({ completed_at: now, updated_at: now })
      .eq("client_id", clientId)
      .eq("coach_id", coachId);
    if (clErr) return { success: false, error: clErr.message };

    const { error: stageErr } = await supabase
      .from("clients")
      .update({
        lifecycle_stage: "active",
        onboarding_completed_at: now,
      })
      .eq("id", clientId)
      .eq("coach_id", coachId);
    if (stageErr) return { success: false, error: stageErr.message };

    revalidatePath(`/dashboard/clients/${clientId}`);
    revalidatePath("/dashboard/pipeline");
    return { success: true };
  } catch (e) {
    console.error("completeOnboarding failed", e);
    return { success: false, error: "Something went wrong" };
  }
}

type OffboardingField =
  | "results_summary_written"
  | "testimonial_requested"
  | "referral_asked"
  | "alumni_status_set"
  | "farewell_sent";

const OFFBOARDING_FIELDS: OffboardingField[] = [
  "results_summary_written",
  "testimonial_requested",
  "referral_asked",
  "alumni_status_set",
  "farewell_sent",
];

export async function toggleOffboardingItem(
  clientId: string,
  field: string,
  value: boolean
) {
  const coachId = await getCoachId();
  if (!coachId) return { success: false, error: "Not authenticated" };
  if (!(OFFBOARDING_FIELDS as string[]).includes(field)) {
    return { success: false, error: "Invalid field" };
  }
  if (!(await verifyClientOwnership(clientId, coachId))) {
    return { success: false, error: "Client not found" };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("offboarding_checklists")
      .upsert(
        {
          client_id: clientId,
          coach_id: coachId,
          [field]: value,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "client_id" }
      );
    if (error) return { success: false, error: error.message };
    revalidatePath(`/dashboard/clients/${clientId}`);
    return { success: true };
  } catch (e) {
    console.error("toggleOffboardingItem failed", e);
    return { success: false, error: "Something went wrong" };
  }
}

export async function saveResultsSummary(clientId: string, summary: string) {
  const coachId = await getCoachId();
  if (!coachId) return { success: false, error: "Not authenticated" };
  if (!(await verifyClientOwnership(clientId, coachId))) {
    return { success: false, error: "Client not found" };
  }
  const trimmed = (summary ?? "").slice(0, 5000);
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("offboarding_checklists")
      .upsert(
        {
          client_id: clientId,
          coach_id: coachId,
          results_summary: trimmed,
          results_summary_written: trimmed.trim().length > 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "client_id" }
      );
    if (error) return { success: false, error: error.message };
    revalidatePath(`/dashboard/clients/${clientId}`);
    return { success: true };
  } catch (e) {
    console.error("saveResultsSummary failed", e);
    return { success: false, error: "Something went wrong" };
  }
}

export async function completeOffboarding(clientId: string, exitReason: string) {
  const coachId = await getCoachId();
  if (!coachId) return { success: false, error: "Not authenticated" };
  if (!(await verifyClientOwnership(clientId, coachId))) {
    return { success: false, error: "Client not found" };
  }

  try {
    const supabase = await createClient();
    const now = new Date().toISOString();
    await supabase
      .from("offboarding_checklists")
      .update({ completed_at: now, updated_at: now })
      .eq("client_id", clientId)
      .eq("coach_id", coachId);

    const { error } = await supabase
      .from("clients")
      .update({
        lifecycle_stage: "alumni",
        offboarding_completed_at: now,
        alumni_since: now.slice(0, 10),
        exit_reason: (exitReason ?? "").slice(0, 500) || null,
      })
      .eq("id", clientId)
      .eq("coach_id", coachId);
    if (error) return { success: false, error: error.message };

    revalidatePath(`/dashboard/clients/${clientId}`);
    revalidatePath("/dashboard/pipeline");
    return { success: true };
  } catch (e) {
    console.error("completeOffboarding failed", e);
    return { success: false, error: "Something went wrong" };
  }
}

export async function reengageClient(clientId: string) {
  // Move alumni back to lead and stamp the reengagement_date.
  const coachId = await getCoachId();
  if (!coachId) return { success: false, error: "Not authenticated" };
  if (!(await verifyClientOwnership(clientId, coachId))) {
    return { success: false, error: "Client not found" };
  }
  try {
    const supabase = await createClient();
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await supabase
      .from("clients")
      .update({
        lifecycle_stage: "lead",
        reengagement_date: today,
        lead_date: today,
      })
      .eq("id", clientId)
      .eq("coach_id", coachId);
    if (error) return { success: false, error: error.message };
    revalidatePath(`/dashboard/clients/${clientId}`);
    revalidatePath("/dashboard/pipeline");
    return { success: true };
  } catch (e) {
    console.error("reengageClient failed", e);
    return { success: false, error: "Something went wrong" };
  }
}

export async function updateLeadFields(clientId: string, formData: FormData) {
  const coachId = await getCoachId();
  if (!coachId) return { success: false, error: "Not authenticated" };
  if (!(await verifyClientOwnership(clientId, coachId))) {
    return { success: false, error: "Client not found" };
  }

  const discoveryDate = (formData.get("discovery_call_date") as string) || null;
  const discoveryOutcome = (formData.get("discovery_call_outcome") as string) || null;
  const proposalSent = (formData.get("proposal_sent_date") as string) || null;
  const proposalPackage = ((formData.get("proposal_package") as string) || "").trim() || null;
  const proposalPriceRaw = (formData.get("proposal_price") as string) || "";
  const proposalPrice = proposalPriceRaw ? Number(proposalPriceRaw) : null;
  if (proposalPrice !== null && (Number.isNaN(proposalPrice) || proposalPrice < 0)) {
    return { success: false, error: "Invalid proposal price" };
  }
  const proposalStatus = (formData.get("proposal_status") as string) || null;
  const nextFollowUp = (formData.get("next_follow_up_date") as string) || null;

  const update: Record<string, unknown> = {
    discovery_call_date: discoveryDate,
    discovery_call_outcome: discoveryOutcome,
    proposal_sent_date: proposalSent,
    proposal_package: proposalPackage,
    proposal_price: proposalPrice,
    proposal_status: proposalStatus,
    next_follow_up_date: nextFollowUp,
  };

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("clients")
      .update(update)
      .eq("id", clientId)
      .eq("coach_id", coachId);
    if (error) return { success: false, error: error.message };
    revalidatePath(`/dashboard/clients/${clientId}`);
    return { success: true };
  } catch (e) {
    console.error("updateLeadFields failed", e);
    return { success: false, error: "Something went wrong" };
  }
}

export async function convertLeadToActive(clientId: string, formData: FormData) {
  const coachId = await getCoachId();
  if (!coachId) return { success: false, error: "Not authenticated" };
  if (!(await verifyClientOwnership(clientId, coachId))) {
    return { success: false, error: "Client not found" };
  }

  const totalSessionsRaw = (formData.get("total_sessions") as string) || "";
  const priceRaw = (formData.get("price") as string) || "";
  const packageType = ((formData.get("package_type") as string) || "").trim();

  const totalSessions = Number(totalSessionsRaw);
  const price = Number(priceRaw);
  if (!packageType) return { success: false, error: "Package name required" };
  if (!Number.isFinite(totalSessions) || totalSessions <= 0) {
    return { success: false, error: "Total sessions must be positive" };
  }
  if (!Number.isFinite(price) || price < 0) {
    return { success: false, error: "Invalid price" };
  }

  try {
    const supabase = await createClient();
    const today = new Date().toISOString().slice(0, 10);

    const { error: pkgErr } = await supabase.from("packages").insert({
      client_id: clientId,
      total_sessions: totalSessions,
      used_sessions: 0,
      price,
      paid_amount: 0,
      status: "active",
      start_date: today,
    });
    if (pkgErr) return { success: false, error: pkgErr.message };

    const { error: clErr } = await supabase
      .from("clients")
      .update({
        lifecycle_stage: "active",
        package_type: packageType,
        status: "active",
      })
      .eq("id", clientId)
      .eq("coach_id", coachId);
    if (clErr) return { success: false, error: clErr.message };

    revalidatePath(`/dashboard/clients/${clientId}`);
    revalidatePath("/dashboard/pipeline");
    revalidatePath("/dashboard/clients");
    return { success: true };
  } catch (e) {
    console.error("convertLeadToActive failed", e);
    return { success: false, error: "Something went wrong" };
  }
}

export type StageQuickActionResult = { success: boolean; error?: string };

// Used by the kanban quick-action buttons. Validates and dispatches.
export async function quickAdvance(
  clientId: string,
  fromStage: string
): Promise<StageQuickActionResult> {
  // Lead → Discovery
  if (fromStage === "lead") return moveClientStage(clientId, "discovery");
  // Discovery → Proposal
  if (fromStage === "discovery") return moveClientStage(clientId, "proposal");
  // Proposal → Active (mark accepted)
  if (fromStage === "proposal") {
    const coachId = await getCoachId();
    if (!coachId) return { success: false, error: "Not authenticated" };
    if (!(await verifyClientOwnership(clientId, coachId))) {
      return { success: false, error: "Client not found" };
    }
    try {
      const supabase = await createClient();
      const { error } = await supabase
        .from("clients")
        .update({
          lifecycle_stage: "active",
          proposal_status: "accepted",
        })
        .eq("id", clientId)
        .eq("coach_id", coachId);
      if (error) return { success: false, error: error.message };
      revalidatePath("/dashboard/pipeline");
      revalidatePath(`/dashboard/clients/${clientId}`);
      return { success: true };
    } catch (e) {
      console.error("quickAdvance(proposal) failed", e);
      return { success: false, error: "Something went wrong" };
    }
  }
  // Alumni → Lead (re-engage)
  if (fromStage === "alumni") return reengageClient(clientId);

  return { success: false, error: "No quick action for this stage" };
}
