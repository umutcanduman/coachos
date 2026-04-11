"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Payments", href: "/dashboard/finance/payments" },
  { label: "Referrals", href: "/dashboard/finance/referrals" },
];

export default function FinanceTabs() {
  const pathname = usePathname();

  return (
    <div className="border-b border-border bg-surface px-4 lg:px-7">
      <div className="flex gap-1 pt-2">
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`rounded-t-lg border-b-2 px-4 py-2.5 text-[0.8125rem] font-medium transition-colors ${
                active
                  ? "border-accent text-accent"
                  : "border-transparent text-text-3 hover:text-text-2"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
