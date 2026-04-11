"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Toast from "@/components/Toast";
import {
  LIFECYCLE_STAGES,
  STAGE_LABELS,
  SOURCE_OPTIONS,
  SOURCE_LABELS,
  isLifecycleStage,
} from "@/lib/lifecycle";

interface ClientOption {
  id: string;
  name: string;
}

interface NewClientModalProps {
  open: boolean;
  onClose: () => void;
  existingClients: ClientOption[];
}

const inputClass = "w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 font-sans text-sm text-text outline-none transition-colors placeholder:text-text-3 focus:border-border-2";
const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-[0.06em] text-text-2";

export default function NewClientModal({ open, onClose, existingClients }: NewClientModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [stage, setStage] = useState<string>("lead");

  if (!open) return null;

  const isLeadLike = stage === "lead" || stage === "discovery" || stage === "proposal";
  const isActiveLike = stage === "active";

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
    const referredBy = formData.get("referred_by") as string;
    const lifecycleStageRaw = (formData.get("lifecycle_stage") as string) || "lead";
    const lifecycleStage = isLifecycleStage(lifecycleStageRaw) ? lifecycleStageRaw : "lead";
    const source = ((formData.get("source") as string) || "").trim() || null;
    const leadDate = (formData.get("lead_date") as string) || null;

    if (!name || !email) {
      setError("Name and email are required.");
      return;
    }

    let supabase;
    try {
      supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
    } catch {
      setError("Failed to connect. Please refresh and try again.");
      return;
    }

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

    const { data: newClient, error: insertError } = await supabase
      .from("clients")
      .insert({
        coach_id: coach.id,
        name,
        email,
        phone: phone || null,
        location: location || null,
        package_type: packageType || null,
        status: "active",
        lifecycle_stage: lifecycleStage,
        source,
        lead_date: leadDate,
        referred_by: referredBy || null,
      })
      .select("id")
      .single();

    if (insertError) {
      setError("Failed to create client. Please try again.");
      return;
    }

    // Auto-create referral record if referred_by is set
    if (referredBy && newClient) {
      try {
        const { data: referrerData } = await supabase
          .from("clients")
          .select("name, email")
          .eq("id", referredBy)
          .eq("coach_id", coach.id)
          .single();
        if (!referrerData) {
          // Referrer doesn't belong to this coach — skip referral creation
          throw new Error("Invalid referrer");
        }
        await supabase.from("referrals").insert({
          referrer_id: referredBy,
          referred_client_id: newClient.id,
          coach_id: coach.id,
          referrer_name: referrerData?.name ?? "",
          referrer_email: referrerData?.email ?? "",
          referred_name: name,
          referred_email: email,
          status: "converted",
        });
      } catch {
        // Non-critical — referral record is supplementary
      }
    }

    setToast({ message: "Client created", type: "success" });
    startTransition(() => {
      router.refresh();
      onClose();
    });
  }

  return (
    <>
      <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-8">
        <div className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-[14px] border border-border-2 bg-surface p-5 shadow-2xl sm:max-w-[520px] sm:rounded-[14px] sm:p-7">
          <button
            onClick={onClose}
            className="absolute right-5 top-5 border-none bg-transparent text-[1.125rem] text-text-3 transition-colors hover:text-text"
          >
            ✕
          </button>

          <h2 className="mb-1 font-serif text-2xl font-normal text-text">New Client</h2>
          <p className="mb-6 text-[0.8125rem] text-text-3">Add a client to your practice</p>

          {error && (
            <div className="mb-4 rounded-lg border border-[rgba(184,50,50,0.15)] bg-c-red-dim px-4 py-3 text-[0.8125rem] text-c-red">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className={labelClass}>Full name</label>
              <input name="name" type="text" required placeholder="Laura Martínez" className={inputClass} />
            </div>

            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Email</label>
                <input name="email" type="email" required placeholder="laura@email.com" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input name="phone" type="tel" placeholder="+31 6 12345678" className={inputClass} />
              </div>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Lifecycle stage</label>
                <select
                  name="lifecycle_stage"
                  className={inputClass}
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                >
                  {LIFECYCLE_STAGES.map((s) => (
                    <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Source</label>
                <select name="source" className={inputClass} defaultValue="">
                  <option value="">Select source</option>
                  {SOURCE_OPTIONS.map((s) => (
                    <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
                  ))}
                </select>
              </div>
            </div>

            {isLeadLike && (
              <div className="mb-4">
                <label className={labelClass}>Lead date</label>
                <input
                  name="lead_date"
                  type="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  className={inputClass}
                />
              </div>
            )}

            {isActiveLike && (
              <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Package</label>
                  <select name="package_type" className={inputClass}>
                    <option value="">Select package</option>
                    <option value="Growth Journey">Growth Journey</option>
                    <option value="Deep Transformation">Deep Transformation</option>
                    <option value="Clarity Session">Clarity Session</option>
                    <option value="Single Session">Single Session</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Location</label>
                  <input name="location" type="text" placeholder="Rotterdam" className={inputClass} />
                </div>
              </div>
            )}

            {!isActiveLike && (
              <div className="mb-4">
                <label className={labelClass}>Location</label>
                <input name="location" type="text" placeholder="Rotterdam" className={inputClass} />
              </div>
            )}

            <div className="mb-4">
              <label className={labelClass}>Referred by</label>
              <select name="referred_by" className={inputClass}>
                <option value="">No referral</option>
                {existingClients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-4 py-2 text-[0.8125rem] font-medium text-text-2 transition-all hover:bg-surface-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-[0.8125rem] font-medium text-white transition-all hover:bg-accent-hover disabled:opacity-50"
              >
                {isPending ? "Adding…" : "Add Client"}
              </button>
            </div>
          </form>
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
