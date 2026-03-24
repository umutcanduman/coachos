"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  });

  if (authError) {
    redirect("/signup?error=Could+not+create+account");
  }

  // Create the coach profile linked to the auth user
  if (authData.user) {
    const { error: profileError } = await supabase
      .from("coaches")
      .insert({ user_id: authData.user.id, email, name });

    if (profileError) {
      redirect("/signup?error=Could+not+create+profile");
    }
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
