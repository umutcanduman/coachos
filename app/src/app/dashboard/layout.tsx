import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { getEnabledModules } from "@/lib/modules";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    redirect("/login");
  }

  if (!user) {
    redirect("/login");
  }

  let coachName = "Coach";
  let coachEmail = user.email ?? "";
  let coachId: string | null = null;

  try {
    const supabase = await createClient();
    const { data: coach } = await supabase
      .from("coaches")
      .select("id, name, email")
      .eq("user_id", user.id)
      .single();

    if (coach) {
      coachId = coach.id;
      coachName = coach.name ?? coachName;
      coachEmail = coach.email ?? coachEmail;
    }
  } catch {
    // Coach profile query failed — use defaults from auth
  }

  // Fetch enabled modules for sidebar
  let enabledModuleKeys: string[] = [];
  if (coachId) {
    try {
      const modules = await getEnabledModules(coachId);
      enabledModuleKeys = Array.from(modules);
    } catch {
      // modules table may not exist yet
    }
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar
        coachName={coachName}
        coachEmail={coachEmail}
        enabledModules={enabledModuleKeys}
      />
      <div className="ml-[260px] flex flex-1 flex-col">{children}</div>
    </div>
  );
}
