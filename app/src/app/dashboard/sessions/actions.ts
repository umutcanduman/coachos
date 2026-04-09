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

async function verifyClientOwnership(clientId: string, coachId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("coach_id", coachId)
    .single();
  return !!data;
}

export async function addSession(formData: FormData) {
  const coachId = await getCoachId();
  if (!coachId) return { success: false, error: "Not authenticated" };

  const clientId = formData.get("client_id") as string;
  const date = formData.get("date") as string;
  const time = formData.get("time") as string;
  const type = (formData.get("type") as string) || "one-on-one";
  const duration = Number(formData.get("duration")) || 60;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!clientId) return { success: false, error: "Client is required" };
  if (!date || !time) return { success: false, error: "Date and time are required" };

  if (!(await verifyClientOwnership(clientId, coachId))) {
    return { success: false, error: "Client not found" };
  }

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
    revalidatePath("/dashboard/sessions");
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function editSession(sessionId: string, formData: FormData) {
  const coachId = await getCoachId();
  if (!coachId) return { success: false, error: "Not authenticated" };

  const date = formData.get("date") as string;
  const time = formData.get("time") as string;
  const type = (formData.get("type") as string) || "one-on-one";
  const duration = Number(formData.get("duration")) || 60;
  const status = (formData.get("status") as string) || "scheduled";
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!date || !time) return { success: false, error: "Date and time are required" };

  const dateTime = new Date(`${date}T${time}`).toISOString();

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("sessions")
      .update({ date: dateTime, duration, type, status, notes })
      .eq("id", sessionId)
      .eq("coach_id", coachId);
    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/sessions");
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function setSessionStatus(sessionId: string, status: "completed" | "cancelled" | "scheduled") {
  const coachId = await getCoachId();
  if (!coachId) return { success: false, error: "Not authenticated" };

  if (!sessionId) return { success: false, error: "Session id required" };

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("sessions")
      .update({ status })
      .eq("id", sessionId)
      .eq("coach_id", coachId);
    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/sessions");
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function scheduleSession(clientId: string, formData: FormData) {
  const coachId = await getCoachId();
  if (!coachId) return { success: false, error: "Not authenticated" };

  const date = formData.get("date") as string;
  const time = formData.get("time") as string;
  const type = (formData.get("type") as string) || "one-on-one";
  const duration = Number(formData.get("duration")) || 60;

  if (!date || !time) return { success: false, error: "Date and time are required" };

  if (!(await verifyClientOwnership(clientId, coachId))) {
    return { success: false, error: "Client not found" };
  }

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
    });
    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/sessions");
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
