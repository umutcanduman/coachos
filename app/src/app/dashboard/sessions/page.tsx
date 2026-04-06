import { createClient } from "@/lib/supabase/server";
import Topbar from "@/components/Topbar";
import SessionsTabs from "./SessionsTabs";
import { isModuleEnabled } from "@/lib/modules";

export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <>
        <Topbar title="Sessions" />
        <div className="flex-1 p-4 lg:p-7">
          <div className="rounded-card border border-border bg-surface py-16 text-center text-sm text-text-3">
            Session expired. Please refresh.
          </div>
        </div>
      </>
    );
  }

  let coachId: string | null = null;
  try {
    const { data: coach } = await supabase
      .from("coaches")
      .select("id")
      .eq("user_id", user.id)
      .single();
    coachId = coach?.id ?? null;
  } catch { /* coaches table may not exist */ }

  type SessionItem = {
    id: string;
    date: string;
    duration: number;
    type: string;
    status: string;
    notes: string | null;
    clientName: string;
    clientId: string;
    packageType: string;
    reminderStatus: string | null;
  };

  type ToScheduleItem = {
    id: string;
    name: string;
    packageType: string;
    totalSessions: number;
    completedCount: number;
    scheduledCount: number;
    remaining: number;
  };

  let allSessions: SessionItem[] = [];
  let scheduled: SessionItem[] = [];
  let past: SessionItem[] = [];
  let toSchedule: ToScheduleItem[] = [];
  let whatsappEnabled = false;

  if (coachId) {
    whatsappEnabled = await isModuleEnabled(coachId, "whatsapp_reminders");

    try {
      const [sessionsRes, clientsRes] = await Promise.all([
        supabase
          .from("sessions")
          .select("id, client_id, date, duration, type, status, notes")
          .eq("coach_id", coachId)
          .order("date", { ascending: true }),
        supabase
          .from("clients")
          .select(`
            id, name, email, package_type, status,
            packages ( total_sessions, used_sessions, status )
          `)
          .eq("coach_id", coachId),
      ]);

      const sessions = sessionsRes.data ?? [];
      const clients = clientsRes.data ?? [];
      const clientMap = new Map(clients.map((c) => [c.id, c]));

      // Fetch WhatsApp reminders if module enabled
      const reminderMap = new Map<string, string>();
      if (whatsappEnabled) {
        try {
          const { data: reminders } = await supabase
            .from("whatsapp_reminders")
            .select("session_id, status")
            .eq("coach_id", coachId);
          for (const r of reminders ?? []) {
            reminderMap.set(r.session_id, r.status);
          }
        } catch { /* table may not exist */ }
      }

      const now = new Date();

      allSessions = sessions.map((s) => {
        const client = clientMap.get(s.client_id);
        return {
          id: s.id,
          date: s.date,
          duration: s.duration,
          type: s.type,
          status: s.status,
          notes: s.notes ?? null,
          clientName: client?.name ?? "Unknown",
          clientId: s.client_id,
          packageType: client?.package_type ?? "—",
          reminderStatus: reminderMap.get(s.id) ?? null,
        };
      });

      scheduled = allSessions.filter(
        (s) => new Date(s.date) >= now && s.status === "scheduled"
      );
      past = allSessions.filter(
        (s) => new Date(s.date) < now || s.status === "completed"
      );

      toSchedule = clients
        .map((client) => {
          // Find the active package — might be multiple, pick the active one
          const packages = Array.isArray(client.packages) ? client.packages : (client.packages ? [client.packages] : []);
          const pkg = packages.find((p: { status: string }) => p.status === "active") ?? packages[0] ?? null;
          if (!pkg) return null;
          const total = pkg.total_sessions ?? 0;
          if (total <= 0) return null;

          // Count from actual session records — ALL sessions for this client
          const clientSessions = sessions.filter((s) => s.client_id === client.id);
          const completedCount = clientSessions.filter((s) => s.status === "completed").length;
          const schedCount = clientSessions.filter(
            (s) => s.status === "scheduled" && new Date(s.date) >= now
          ).length;
          const remaining = total - completedCount - schedCount;
          if (remaining <= 0) return null;
          return {
            id: client.id,
            name: client.name,
            packageType: client.package_type ?? "—",
            totalSessions: total,
            completedCount,
            scheduledCount: schedCount,
            remaining,
          };
        })
        .filter((x): x is ToScheduleItem => x !== null);
    } catch {
      // sessions/clients query failed — show empty
    }
  }

  // Build client list for the Add Session dropdown
  let clientOptions: { id: string; name: string }[] = [];
  if (coachId) {
    try {
      const { data } = await supabase
        .from("clients")
        .select("id, name")
        .eq("coach_id", coachId)
        .order("name");
      clientOptions = data ?? [];
    } catch { /* */ }
  }

  return (
    <>
      <Topbar title="Sessions" subtitle={`${allSessions.length} total sessions`} />
      <SessionsTabs
        scheduled={scheduled}
        toSchedule={toSchedule}
        past={past}
        showReminders={whatsappEnabled}
        clients={clientOptions}
      />
    </>
  );
}
