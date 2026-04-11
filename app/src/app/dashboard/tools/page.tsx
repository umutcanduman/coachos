import { createClient } from "@/lib/supabase/server";
import Topbar from "@/components/Topbar";
import ToolsView from "./ToolsView";

export const dynamic = "force-dynamic";

export default async function ToolsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (<><Topbar title="Tools" /><div className="flex-1 p-4 lg:p-7"><div className="rounded-card border border-border bg-surface py-16 text-center text-sm text-text-3">Session expired.</div></div></>);
  }

  let coachId: string | null = null;
  try {
    const { data: coach } = await supabase.from("coaches").select("id").eq("user_id", user.id).single();
    coachId = coach?.id ?? null;
  } catch { /* ok */ }

  let clients: { id: string; name: string }[] = [];
  if (coachId) {
    try {
      const { data } = await supabase.from("clients").select("id, name").eq("coach_id", coachId).eq("status", "active").order("name");
      clients = data ?? [];
    } catch { /* ok */ }
  }

  return (
    <>
      <Topbar title="Coaching Tools" subtitle="Use during or between sessions" />
      <div className="flex-1 p-4 lg:p-7">
        <ToolsView clients={clients} />
      </div>
    </>
  );
}
