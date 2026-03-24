import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Checks if the current user is an admin.
 * Returns the user ID if admin, otherwise redirects to /login.
 */
export async function requireAdmin(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!adminRow) {
    redirect("/login");
  }

  return user.id;
}

/**
 * Checks if a user_id is an admin (non-redirecting version).
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("admin_users")
      .select("id")
      .eq("user_id", userId)
      .single();
    return !!data;
  } catch {
    return false;
  }
}
