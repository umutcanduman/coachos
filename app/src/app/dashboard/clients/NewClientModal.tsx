"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

interface NewClientModalProps {
  open: boolean;
  onClose: () => void;
}

export default function NewClientModal({ open, onClose }: NewClientModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = (formData.get("name") as string).trim();
    const email = (formData.get("email") as string).trim();
    const phone = (formData.get("phone") as string).trim();
    const packageType = formData.get("package_type") as string;
    const location = (formData.get("location") as string).trim();

    if (!name || !email) {
      setError("Name and email are required.");
      return;
    }

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not authenticated.");
      return;
    }

    const { data: coach } = await supabase
      .from("coaches")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!coach) {
      setError("Coach profile not found.");
      return;
    }

    const { error: insertError } = await supabase.from("clients").insert({
      coach_id: coach.id,
      name,
      email,
      phone: phone || null,
      location: location || null,
      package_type: packageType || null,
      status: "active",
    });

    if (insertError) {
      setError("Failed to create client. Please try again.");
      console.error("Client insert error:", insertError);
      return;
    }

    startTransition(() => {
      router.refresh();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-8 backdrop-blur-sm">
      <div className="relative w-full max-w-[520px] rounded-[14px] border border-border-2 bg-surface p-7 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 border-none bg-transparent text-[1.125rem] text-text-3 transition-colors hover:text-text"
        >
          ✕
        </button>

        <h2 className="mb-1 font-serif text-2xl font-normal text-text">
          New Client
        </h2>
        <p className="mb-6 text-[0.8125rem] text-text-3">
          Add a client to your practice
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-[rgba(184,50,50,0.15)] bg-c-red-dim px-4 py-3 text-[0.8125rem] text-c-red">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.06em] text-text-2">
              Full name
            </label>
            <input
              name="name"
              type="text"
              required
              placeholder="Laura Martínez"
              className="w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 font-sans text-sm text-text outline-none transition-colors placeholder:text-text-3 focus:border-border-2"
            />
          </div>

          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.06em] text-text-2">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="laura@email.com"
                className="w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 font-sans text-sm text-text outline-none transition-colors placeholder:text-text-3 focus:border-border-2"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.06em] text-text-2">
                Phone
              </label>
              <input
                name="phone"
                type="tel"
                placeholder="+31 6 12345678"
                className="w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 font-sans text-sm text-text outline-none transition-colors placeholder:text-text-3 focus:border-border-2"
              />
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.06em] text-text-2">
                Package
              </label>
              <select
                name="package_type"
                className="w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 font-sans text-sm text-text outline-none transition-colors focus:border-border-2"
              >
                <option value="">Select package</option>
                <option value="Growth Journey">Growth Journey</option>
                <option value="Deep Transformation">Deep Transformation</option>
                <option value="Clarity Session">Clarity Session</option>
                <option value="Single Session">Single Session</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.06em] text-text-2">
                Location
              </label>
              <input
                name="location"
                type="text"
                placeholder="Rotterdam"
                className="w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 font-sans text-sm text-text outline-none transition-colors placeholder:text-text-3 focus:border-border-2"
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-4 py-2 text-[0.8125rem] font-medium text-text-2 transition-all hover:bg-surface-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-[0.8125rem] font-medium text-white transition-all hover:bg-accent-hover disabled:opacity-50"
            >
              {isPending ? "Adding…" : "Add Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
