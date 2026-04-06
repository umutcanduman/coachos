"use server";

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
      emailRedirectTo: "https://coachos-app.vercel.app/auth/callback",
    },
  });

  if (authError) {
    const msg = authError.message;
    if (msg.includes("already registered") || msg.includes("already been registered")) {
      return { error: "An account with this email already exists. Try signing in instead." };
    }
    if (msg.includes("at least 6 characters")) {
      return { error: "Password must be at least 6 characters." };
    }
    return { error: msg };
  }

  // Create the coach profile linked to the auth user
  if (authData.user) {
    const { error: profileError } = await supabase
      .from("coaches")
      .insert({ user_id: authData.user.id, email, name });

    if (profileError && !profileError.message.includes("duplicate")) {
      return { error: "Account created but profile setup failed. Please contact support." };
    }
  }

  return { success: true, email };
}
