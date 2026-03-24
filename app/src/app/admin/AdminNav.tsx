"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Overview", icon: "◈", href: "/admin" },
  { label: "Coaches", icon: "◉", href: "/admin/coaches" },
  { label: "Modules", icon: "⊕", href: "/admin/modules" },
];

export default function AdminNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <div className="px-3 pt-4 pb-2">
      <div className="mb-1 px-2 text-[0.65rem] font-medium uppercase tracking-[0.12em] text-text-3">
        Admin
      </div>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
            isActive(item.href)
              ? "bg-c-red-dim font-medium text-c-red"
              : "text-text-2 hover:bg-surface-2 hover:text-text"
          }`}
        >
          <span className="w-4 flex-shrink-0 text-center">{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </div>
  );
}
