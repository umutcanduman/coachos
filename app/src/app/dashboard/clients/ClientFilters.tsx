"use client";

import Link from "next/link";

const filters = [
  { label: "All",        value: "all" },
  { label: "Leads",      value: "leads" },
  { label: "Active",     value: "active" },
  { label: "Completing", value: "completing" },
  { label: "Alumni",     value: "alumni" },
];

export default function ClientFilters({ activeFilter }: { activeFilter: string }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-full border border-border bg-surface-2 p-1">
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
