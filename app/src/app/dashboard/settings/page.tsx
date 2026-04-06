import { createClient } from "@/lib/supabase/server";
import Topbar from "@/components/Topbar";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <>
        <Topbar title="Settings" />
        <div className="flex-1 p-4 lg:p-7">
          <div className="rounded-card border border-border bg-surface py-16 text-center text-sm text-text-3">
            Session expired. Please refresh.
          </div>
        </div>
      </>
    );
  }

  let coach = {
    name: "",
    email: user.email ?? "",
    phone: null as string | null,
    bio: null as string | null,
    timezone: "Europe/Amsterdam" as string | null,
    photo_url: null as string | null,
    practice_name: null as string | null,
    website_url: null as string | null,
    default_session_duration: 60 as number | null,
    default_session_type: "one-on-one" as string | null,
    currency: "EUR" as string | null,
    notify_session_reminders: true as boolean | null,
    notify_homework_completed: true as boolean | null,
    notify_weekly_summary: true as boolean | null,
  };

  try {
    const { data } = await supabase
      .from("coaches")
      .select("name, email, phone, bio, timezone, photo_url, practice_name, website_url, default_session_duration, default_session_type, currency, notify_session_reminders, notify_homework_completed, notify_weekly_summary")
      .eq("user_id", user.id)
      .single();
    if (data) {
      coach = { ...coach, ...data };
    }
  } catch { /* coach table may not have these columns yet */ }

  return (
    <>
      <Topbar title="Settings" />
      <div className="flex-1 p-4 lg:p-7">
        <div className="mx-auto max-w-2xl">
          <SettingsForm coach={coach} />
        </div>
      </div>
    </>
  );
}
