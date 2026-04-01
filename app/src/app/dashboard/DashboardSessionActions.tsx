"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Toast from "@/components/Toast";

interface Props {
  sessionId: string;
}

export default function DashboardSessionActions({ sessionId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleComplete() {
    setLoading(true);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { error } = await supabase
        .from("sessions")
        .update({ status: "completed" })
        .eq("id", sessionId);
      if (error) {
        setToast({ message: "Failed to update", type: "error" });
      } else {
        setToast({ message: "Session marked complete", type: "success" });
        router.refresh();
      }
    } catch {
      setToast({ message: "Something went wrong", type: "error" });
    }
    setLoading(false);
    setOpen(false);
  }

  async function handleCancel() {
    setLoading(true);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { error } = await supabase
        .from("sessions")
        .update({ status: "cancelled" })
        .eq("id", sessionId);
      if (error) {
        setToast({ message: "Failed to cancel", type: "error" });
      } else {
        setToast({ message: "Session cancelled", type: "success" });
        router.refresh();
      }
    } catch {
      setToast({ message: "Something went wrong", type: "error" });
    }
    setLoading(false);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-6 w-6 items-center justify-center rounded text-text-3 transition-colors hover:bg-surface-3 hover:text-text"
      >
        ⋯
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
            <button
              onClick={handleComplete}
              disabled={loading}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[0.8125rem] text-text-2 transition-colors hover:bg-surface-2 disabled:opacity-50"
            >
              ✓ Complete
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[0.8125rem] text-c-red transition-colors hover:bg-c-red-dim disabled:opacity-50"
            >
              ✕ Cancel
            </button>
          </div>
        </>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
