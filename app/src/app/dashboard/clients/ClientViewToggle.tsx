"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function ClientViewToggle() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view") ?? "list";

  return (
    <div className="flex gap-1 rounded-lg border border-border bg-surface-2 p-1">
      <Link
        href="/dashboard/clients"
        className={`rounded-md px-3 py-1.5 text-[0.75rem] font-medium transition-colors ${
          view !== "pipeline" ? "bg-surface-3 text-text" : "text-text-3 hover:text-text-2"
        }`}
      >
        Clients
      </Link>
      <Link
        href="/dashboard/clients?view=pipeline"
        className={`rounded-md px-3 py-1.5 text-[0.75rem] font-medium transition-colors ${
          view === "pipeline" ? "bg-surface-3 text-text" : "text-text-3 hover:text-text-2"
        }`}
      >
        Pipeline
      </Link>
    </div>
  );
}
