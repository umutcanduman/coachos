"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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

export async function updateProfile(formData: FormData) {
  const coachId = await getCoachId();
  if (!coachId) return { success: false, error: "Not authenticated" };

  const name = (formData.get("name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || null;
  const bio = (formData.get("bio") as string)?.trim() || null;
  const timezone = (formData.get("timezone") as string)?.trim() || "Europe/Amsterdam";
  const photoUrl = (formData.get("photo_url") as string)?.trim() || null;

  if (!name) return { success: false, error: "Name is required" };

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("coaches")
      .update({ name, phone, bio, timezone, photo_url: photoUrl, updated_at: new Date().toISOString() })
      .eq("id", coachId);
    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard", "layout");
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function updatePractice(formData: FormData) {
  const coachId = await getCoachId();
  if (!coachId) return { success: false, error: "Not authenticated" };

  const practiceName = (formData.get("practice_name") as string)?.trim() || null;
  const websiteUrl = (formData.get("website_url") as string)?.trim() || null;
  const defaultSessionDuration = Number(formData.get("default_session_duration")) || 60;
  const defaultSessionType = (formData.get("default_session_type") as string) || "one-on-one";
  const currency = (formData.get("currency") as string) || "EUR";

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("coaches")
      .update({
        practice_name: practiceName,
        website_url: websiteUrl,
        default_session_duration: defaultSessionDuration,
        default_session_type: defaultSessionType,
        currency,
        updated_at: new Date().toISOString(),
      })
      .eq("id", coachId);
    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function updateNotifications(formData: FormData) {
  const coachId = await getCoachId();
  if (!coachId) return { success: false, error: "Not authenticated" };

  const notifySessionReminders = formData.get("notify_session_reminders") === "on";
  const notifyHomeworkCompleted = formData.get("notify_homework_completed") === "on";
  const notifyWeeklySummary = formData.get("notify_weekly_summary") === "on";

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("coaches")
      .update({
        notify_session_reminders: notifySessionReminders,
        notify_homework_completed: notifyHomeworkCompleted,
        notify_weekly_summary: notifyWeeklySummary,
        updated_at: new Date().toISOString(),
      })
      .eq("id", coachId);
    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function sendPasswordReset() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return { success: false, error: "No email found" };

    const { error } = await supabase.auth.resetPasswordForEmail(user.email);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function deleteAccount() {
  const coachId = await getCoachId();
  if (!coachId) return { success: false, error: "Not authenticated" };

  try {
    const supabase = await createClient();

    // Mark coach profile as inactive (full deletion requires service role)
    await supabase
      .from("coaches")
      .update({ status: "inactive", updated_at: new Date().toISOString() })
      .eq("id", coachId);

    // Deactivate all clients
    await supabase
      .from("clients")
      .update({ status: "archived" })
      .eq("coach_id", coachId);

    await supabase.auth.signOut();
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
