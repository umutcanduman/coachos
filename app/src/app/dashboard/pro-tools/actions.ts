"use server";

import { createClient } from "@/lib/supabase/server";
import { enableModule, disableModule } from "@/lib/modules";
import { revalidatePath } from "next/cache";

async function getCoachId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
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

export async function toggleModule(moduleKey: string, enable: boolean) {
  const coachId = await getCoachId();
  if (!coachId) return { success: false, error: "Not authenticated" };

  const result = enable
    ? await enableModule(coachId, moduleKey)
    : await disableModule(coachId, moduleKey);

  revalidatePath("/dashboard", "layout");
  return result;
}

export async function deactivateModule(moduleKey: string) {
  const coachId = await getCoachId();
  if (!coachId) return { success: false, error: "Not authenticated" };

  const result = await disableModule(coachId, moduleKey);
  revalidatePath("/dashboard", "layout");
  return result;
}
