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

export async function updateClient(clientId: string, formData: FormData) {
  const coachId = await getCoachId();
  if (!coachId) return { success: false, error: "Not authenticated" };

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || null;
  const location = (formData.get("location") as string)?.trim() || null;
  const packageType = (formData.get("package_type") as string) || null;
  const status = (formData.get("status") as string) || "active";

  if (!name || !email) return { success: false, error: "Name and email are required" };

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("clients")
      .update({ name, email, phone, location, package_type: packageType, status })
      .eq("id", clientId)
      .eq("coach_id", coachId);
    if (error) return { success: false, error: error.message };
    revalidatePath(`/dashboard/clients/${clientId}`);
    revalidatePath("/dashboard/clients");
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function createHomework(clientId: string, formData: FormData) {
  const coachId = await getCoachId();
  if (!coachId) return { success: false, error: "Not authenticated" };

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const dueDate = (formData.get("due_date") as string) || null;
  const category = (formData.get("category") as string) || null;

  if (!title) return { success: false, error: "Title is required" };

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("homework").insert({
      client_id: clientId,
      title,
      description,
      due_date: dueDate || null,
      status: "pending",
      category,
    });
    if (error) return { success: false, error: error.message };
    revalidatePath(`/dashboard/clients/${clientId}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function toggleHomeworkStatus(homeworkId: string, clientId: string, newStatus: string) {
  const coachId = await getCoachId();
  if (!coachId) return { success: false, error: "Not authenticated" };

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("homework")
      .update({ status: newStatus })
      .eq("id", homeworkId);
    if (error) return { success: false, error: error.message };
    revalidatePath(`/dashboard/clients/${clientId}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function createGoal(clientId: string, formData: FormData) {
  const coachId = await getCoachId();
  if (!coachId) return { success: false, error: "Not authenticated" };

  const title = (formData.get("title") as string)?.trim();
  if (!title) return { success: false, error: "Title is required" };

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("goals").insert({
      client_id: clientId,
      title,
      progress: 0,
      status: "active",
    });
    if (error) return { success: false, error: error.message };
    revalidatePath(`/dashboard/clients/${clientId}`);
    revalidatePath("/dashboard/progress");
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function updateGoalProgress(goalId: string, clientId: string, progress: number) {
  const coachId = await getCoachId();
  if (!coachId) return { success: false, error: "Not authenticated" };

  const clampedProgress = Math.min(Math.max(Math.round(progress), 0), 100);
  const status = clampedProgress >= 100 ? "completed" : "active";

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("goals")
      .update({ progress: clampedProgress, status })
      .eq("id", goalId);
    if (error) return { success: false, error: error.message };
    revalidatePath(`/dashboard/clients/${clientId}`);
    revalidatePath("/dashboard/progress");
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function updateSessionNotes(sessionId: string, clientId: string, notes: string) {
  const coachId = await getCoachId();
  if (!coachId) return { success: false, error: "Not authenticated" };

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("sessions")
      .update({ notes: notes.trim() || null })
      .eq("id", sessionId)
      .eq("coach_id", coachId);
    if (error) return { success: false, error: error.message };
    revalidatePath(`/dashboard/clients/${clientId}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function createSession(clientId: string, formData: FormData) {
  const coachId = await getCoachId();
  if (!coachId) return { success: false, error: "Not authenticated" };

  const date = formData.get("date") as string;
  const time = formData.get("time") as string;
  const type = (formData.get("type") as string) || "one-on-one";
  const duration = Number(formData.get("duration")) || 60;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!date || !time) return { success: false, error: "Date and time are required" };

  const dateTime = new Date(`${date}T${time}`).toISOString();

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("sessions").insert({
      client_id: clientId,
      coach_id: coachId,
      date: dateTime,
      duration,
      type,
      status: "scheduled",
      notes,
    });
    if (error) return { success: false, error: error.message };
    revalidatePath(`/dashboard/clients/${clientId}`);
    revalidatePath("/dashboard/sessions");
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
