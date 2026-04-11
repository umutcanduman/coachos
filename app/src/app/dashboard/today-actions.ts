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

export async function savePrepNotes(sessionId: string, notes: string) {
  const coachId = await getCoachId();
  if (!coachId) return { success: false, error: "Not authenticated" };

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("sessions")
      .update({ prep_notes: (notes ?? "").trim() || null })
      .eq("id", sessionId)
      .eq("coach_id", coachId);
    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    console.error("savePrepNotes failed", e);
    return { success: false, error: "Something went wrong" };
  }
}

export async function completeSessionFlow(
  sessionId: string,
  data: {
    notes: string;
    rating: number | null;
    homework?: { title: string; description: string; due_date: string } | null;
    nextSession?: { date: string; time: string; duration: number } | null;
    markPaymentPaid?: string | null; // payment id
  }
) {
  const coachId = await getCoachId();
  if (!coachId) return { success: false, error: "Not authenticated" };

  try {
    const supabase = await createClient();

    // Get session to find client_id
    const { data: session } = await supabase
      .from("sessions")
      .select("client_id")
      .eq("id", sessionId)
      .eq("coach_id", coachId)
      .single();
    if (!session) return { success: false, error: "Session not found" };

    // 1. Mark session completed with notes + rating
    const sessionUpdate: Record<string, unknown> = {
      status: "completed",
      notes: (data.notes ?? "").trim() || null,
    };
    if (data.rating && data.rating >= 1 && data.rating <= 5) {
      sessionUpdate.rating = data.rating;
    }
    const { error: sessErr } = await supabase
      .from("sessions")
      .update(sessionUpdate)
      .eq("id", sessionId)
      .eq("coach_id", coachId);
    if (sessErr) return { success: false, error: sessErr.message };

    // 2. Create homework if provided
    if (data.homework?.title?.trim()) {
      await supabase.from("homework").insert({
        client_id: session.client_id,
        session_id: sessionId,
        title: data.homework.title.trim(),
        description: data.homework.description?.trim() || null,
        due_date: data.homework.due_date || null,
        status: "pending",
      });
    }

    // 3. Schedule next session if provided
    if (data.nextSession?.date && data.nextSession?.time) {
      const dateTime = new Date(`${data.nextSession.date}T${data.nextSession.time}`).toISOString();
      await supabase.from("sessions").insert({
        client_id: session.client_id,
        coach_id: coachId,
        date: dateTime,
        duration: data.nextSession.duration || 60,
        type: "one-on-one",
        status: "scheduled",
      });
    }

    // 4. Mark payment as paid if requested
    if (data.markPaymentPaid) {
      await supabase
        .from("payments")
        .update({ status: "paid", paid_date: new Date().toISOString().slice(0, 10) })
        .eq("id", data.markPaymentPaid)
        .eq("coach_id", coachId);
    }

    // Log activity
    try {
      const { data: client } = await supabase
        .from("clients")
        .select("name")
        .eq("id", session.client_id)
        .single();
      await supabase.from("activity_log").insert({
        coach_id: coachId,
        client_id: session.client_id,
        action: "session_completed",
        description: `Session with ${client?.name ?? "client"} completed`,
      });
    } catch { /* non-critical */ }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/sessions");
    revalidatePath(`/dashboard/clients/${session.client_id}`);
    return { success: true };
  } catch (e) {
    console.error("completeSessionFlow failed", e);
    return { success: false, error: "Something went wrong" };
  }
}

export async function createLeadActivity(
  clientId: string,
  activityType: string,
  description: string,
  activityDate: string
) {
  const coachId = await getCoachId();
  if (!coachId) return { success: false, error: "Not authenticated" };

  const validTypes = ["note", "call", "email", "meeting", "proposal", "follow_up"];
  if (!validTypes.includes(activityType)) {
    return { success: false, error: "Invalid activity type" };
  }
  if (!description.trim()) {
    return { success: false, error: "Description required" };
  }

  try {
    const supabase = await createClient();
    // Verify ownership
    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("id", clientId)
      .eq("coach_id", coachId)
      .single();
    if (!client) return { success: false, error: "Client not found" };

    const { error } = await supabase.from("leads_activity").insert({
      client_id: clientId,
      coach_id: coachId,
      activity_type: activityType,
      description: description.trim().slice(0, 2000),
      activity_date: activityDate || new Date().toISOString().slice(0, 10),
    });
    if (error) return { success: false, error: error.message };
    revalidatePath(`/dashboard/clients/${clientId}`);
    revalidatePath("/dashboard/acquisition");
    return { success: true };
  } catch (e) {
    console.error("createLeadActivity failed", e);
    return { success: false, error: "Something went wrong" };
  }
}

export async function saveSessionTool(
  clientId: string,
  toolType: string,
  toolData: Record<string, unknown>,
  sessionId?: string
) {
  const coachId = await getCoachId();
  if (!coachId) return { success: false, error: "Not authenticated" };

  const validTools = ["wheel_of_life", "grow", "smart_goal", "values", "checkin"];
  if (!validTools.includes(toolType)) {
    return { success: false, error: "Invalid tool type" };
  }

  try {
    const supabase = await createClient();
    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("id", clientId)
      .eq("coach_id", coachId)
      .single();
    if (!client) return { success: false, error: "Client not found" };

    const { error } = await supabase.from("session_tools").insert({
      client_id: clientId,
      coach_id: coachId,
      session_id: sessionId || null,
      tool_type: toolType,
      data: toolData,
    });
    if (error) return { success: false, error: error.message };
    revalidatePath(`/dashboard/clients/${clientId}`);
    revalidatePath("/dashboard/tools");
    return { success: true };
  } catch (e) {
    console.error("saveSessionTool failed", e);
    return { success: false, error: "Something went wrong" };
  }
}

export async function createInvoice(formData: FormData) {
  const coachId = await getCoachId();
  if (!coachId) return { success: false, error: "Not authenticated" };

  const clientId = formData.get("client_id") as string;
  const paymentId = (formData.get("payment_id") as string) || null;
  const amount = Number(formData.get("amount"));
  const dueDate = (formData.get("due_date") as string) || null;
  const notes = ((formData.get("notes") as string) || "").trim() || null;
  const status = (formData.get("status") as string) || "draft";

  if (!clientId) return { success: false, error: "Client required" };
  if (!Number.isFinite(amount) || amount <= 0) return { success: false, error: "Invalid amount" };
  if (!["draft", "sent", "paid"].includes(status)) return { success: false, error: "Invalid status" };

  try {
    const supabase = await createClient();
    // Verify client ownership
    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("id", clientId)
      .eq("coach_id", coachId)
      .single();
    if (!client) return { success: false, error: "Client not found" };

    // Generate invoice number
    let invoiceNumber = `INV-${new Date().getFullYear()}-0001`;
    try {
      const { data: numData } = await supabase.rpc("generate_invoice_number");
      if (numData) invoiceNumber = numData;
    } catch {
      // Fallback: count existing invoices
      const { count } = await supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .eq("coach_id", coachId);
      invoiceNumber = `INV-${new Date().getFullYear()}-${String((count ?? 0) + 1).padStart(4, "0")}`;
    }

    const { error } = await supabase.from("invoices").insert({
      coach_id: coachId,
      client_id: clientId,
      payment_id: paymentId,
      invoice_number: invoiceNumber,
      amount,
      due_date: dueDate,
      status,
      notes,
    });
    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/invoices");
    revalidatePath("/dashboard/payments");
    return { success: true, invoiceNumber };
  } catch (e) {
    console.error("createInvoice failed", e);
    return { success: false, error: "Something went wrong" };
  }
}

export async function updateInvoiceStatus(invoiceId: string, status: string) {
  const coachId = await getCoachId();
  if (!coachId) return { success: false, error: "Not authenticated" };
  if (!["draft", "sent", "paid"].includes(status)) return { success: false, error: "Invalid status" };

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("invoices")
      .update({ status })
      .eq("id", invoiceId)
      .eq("coach_id", coachId);
    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/invoices");
    return { success: true };
  } catch (e) {
    console.error("updateInvoiceStatus failed", e);
    return { success: false, error: "Something went wrong" };
  }
}

export async function updateCoachSettings(formData: FormData) {
  const coachId = await getCoachId();
  if (!coachId) return { success: false, error: "Not authenticated" };

  const maxCapacity = Number(formData.get("max_client_capacity")) || 10;
  const targetRevenue = Number(formData.get("target_monthly_revenue")) || null;
  const currency = (formData.get("currency") as string) || "EUR";

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("coach_settings")
      .upsert(
        {
          coach_id: coachId,
          max_client_capacity: Math.max(1, Math.min(100, maxCapacity)),
          target_monthly_revenue: targetRevenue,
          currency,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "coach_id" }
      );
    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/acquisition");
    return { success: true };
  } catch (e) {
    console.error("updateCoachSettings failed", e);
    return { success: false, error: "Something went wrong" };
  }
}
