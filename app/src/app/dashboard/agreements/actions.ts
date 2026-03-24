"use server";

import { createClient } from "@/lib/supabase/server";
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

export async function createAgreement(formData: FormData) {
  const coachId = await getCoachId();
  if (!coachId) return { success: false, error: "Not authenticated" };

  const clientId = formData.get("client_id") as string;
  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();
  const status = (formData.get("status") as string) || "draft";

  // Key terms from structured fields
  const keyTerms = {
    start_date: formData.get("start_date") || null,
    end_date: formData.get("end_date") || null,
    session_count: formData.get("session_count") || null,
    cancellation_policy: formData.get("cancellation_policy") || null,
    payment_terms: formData.get("payment_terms") || null,
  };

  if (!clientId || !title) {
    return { success: false, error: "Client and title are required." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("agreements").insert({
      coach_id: coachId,
      client_id: clientId,
      title,
      content: content || null,
      key_terms: keyTerms,
      status,
      signed_at: status === "active" ? new Date().toISOString() : null,
      expires_at: keyTerms.end_date
        ? new Date(keyTerms.end_date as string).toISOString()
        : null,
    });

    if (error) return { success: false, error: error.message };

    revalidatePath("/dashboard/agreements");
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
