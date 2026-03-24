"use client";

import { useState, useTransition } from "react";
import { deactivateModule } from "./actions";

interface ActivateButtonProps {
  moduleKey: string;
  status: "not_activated" | "pending" | "active" | "admin_deactivated";
  price: number;
}

export default function ActivateButton({
  moduleKey,
  status,
  price,
}: ActivateButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleActivate() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleKey }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setIsLoading(false);
    }
  }

  function handleDeactivate() {
    startTransition(async () => {
      await deactivateModule(moduleKey);
    });
  }

  if (status === "admin_deactivated") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-c-red-dim px-3 py-1.5 text-[0.75rem] font-medium text-c-red">
        Contact support
      </span>
    );
  }

  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-c-amber-dim px-3 py-1.5 text-[0.75rem] font-medium text-c-amber">
        ◷ Payment pending
      </span>
    );
  }

  if (status === "active") {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-dim px-3 py-1.5 text-[0.75rem] font-medium text-accent">
          ✓ Active
        </span>
        <button
          onClick={handleDeactivate}
          disabled={isPending}
          className="rounded-full px-3 py-1.5 text-[0.75rem] font-medium text-text-3 transition-colors hover:bg-c-red-dim hover:text-c-red disabled:opacity-50"
        >
          Deactivate
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleActivate}
      disabled={isLoading}
      className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-[0.8125rem] font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
    >
      {isLoading ? (
        "Redirecting…"
      ) : (
        <>Activate €{price}/mo</>
      )}
    </button>
  );
}
