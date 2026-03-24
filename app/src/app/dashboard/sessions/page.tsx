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
        <div className="flex-1 p-7">
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
    usedSessions: number;
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
          const pkg = Array.isArray(client.packages) ? client.packages[0] : client.packages;
          if (!pkg || pkg.status !== "active") return null;
          const total = pkg.total_sessions ?? 0;
          const used = pkg.used_sessions ?? 0;
          const schedCount = scheduled.filter((s) => s.clientId === client.id).length;
          const remaining = total - used - schedCount;
          if (remaining <= 0) return null;
          return {
            id: client.id,
            name: client.name,
            packageType: client.package_type ?? "—",
            totalSessions: total,
            usedSessions: used,
            scheduledCount: schedCount,
            remaining,
          };
        })
        .filter((x): x is ToScheduleItem => x !== null);
    } catch {
      // sessions/clients query failed — show empty
    }
  }

  return (
    <>
      <Topbar title="Sessions" subtitle={`${allSessions.length} total sessions`} />
      <SessionsTabs
        scheduled={scheduled}
        toSchedule={toSchedule}
        past={past}
        showReminders={whatsappEnabled}
      />
    </>
  );
}
