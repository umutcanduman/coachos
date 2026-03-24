"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin";
import { revalidatePath } from "next/cache";

export async function adminToggleModule(
  coachId: string,
  moduleKey: string,
  enable: boolean
) {
  const adminUserId = await requireAdmin();
  const supabase = await createClient();

  if (enable) {
    const { error } = await supabase.from("coach_modules").upsert(
      {
        coach_id: coachId,
        module_key: moduleKey,
        is_enabled: true,
        payment_status: "paid",
        activated_at: new Date().toISOString(),
        deactivated_at: null,
        activated_by: adminUserId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "coach_id,module_key" }
    );
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase
      .from("coach_modules")
      .update({
        is_enabled: false,
        deactivated_at: new Date().toISOString(),
        activated_by: adminUserId,
        updated_at: new Date().toISOString(),
      })
      .eq("coach_id", coachId)
      .eq("module_key", moduleKey);
    if (error) return { success: false, error: error.message };
  }

  revalidatePath(`/admin/coaches/${coachId}`);
  revalidatePath("/admin");
  return { success: true };
}

export async function updateCoachNotes(coachId: string, notes: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("coaches")
    .update({ admin_notes: notes })
    .eq("id", coachId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/admin/coaches/${coachId}`);
  return { success: true };
}
