"use client";

import Link from "next/link";

const filters = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Follow-up", value: "follow-up" },
  { label: "Completed", value: "completed" },
];

export default function ClientFilters({ activeFilter }: { activeFilter: string }) {
  return (
    <div className="mb-5 flex gap-1 rounded-full border border-border bg-surface-2 p-1">
      {filters.map((f) => (
        <Link
          key={f.value}
          href={f.value === "all" ? "/dashboard/clients" : `/dashboard/clients?filter=${f.value}`}
          className={`rounded-full px-3.5 py-1.5 text-[0.78rem] font-medium transition-all ${
            activeFilter === f.value
              ? "bg-surface-3 text-text"
              : "text-text-3 hover:text-text-2"
          }`}
        >
          {f.label}
        </Link>
      ))}
    </div>
  );
}
