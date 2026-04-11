"use client";

import Link from "next/link";

const tabs = [
  { label: "General", value: "general", href: "/dashboard/settings" },
  { label: "Modules", value: "modules", href: "/dashboard/settings?tab=modules" },
];

export default function SettingsTabs({ activeTab }: { activeTab: string }) {
  return (
    <div className="border-b border-border bg-surface px-4 lg:px-7">
      <div className="flex gap-1 pt-2">
        {tabs.map((tab) => (
          <Link
            key={tab.value}
            href={tab.href}
            className={`rounded-t-lg border-b-2 px-4 py-2.5 text-[0.8125rem] font-medium transition-colors ${
              activeTab === tab.value
                ? "border-accent text-accent"
                : "border-transparent text-text-3 hover:text-text-2"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
