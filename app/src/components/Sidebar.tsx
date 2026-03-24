"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/dashboard/actions";

const mainNav = [
  { label: "Dashboard", icon: "◈", href: "/dashboard" },
  { label: "Clients", icon: "◉", href: "/dashboard/clients" },
  { label: "Sessions", icon: "◷", href: "/dashboard/sessions" },
  { label: "Payments", icon: "◎", href: "/dashboard/payments" },
  { label: "Referrals", icon: "◌", href: "/dashboard/referrals" },
];

const toolsNav = [
  { label: "Progress", icon: "◑", href: "/dashboard/progress" },
  { label: "Pro Tools", icon: "⊕", href: "/dashboard/pro-tools" },
  { label: "Settings", icon: "◧", href: "/dashboard/settings" },
];

interface SidebarProps {
  coachName: string;
  coachEmail: string;
  enabledModules?: string[];
}

export default function Sidebar({ coachName, coachEmail, enabledModules = [] }: SidebarProps) {
  const pathname = usePathname();
  const enabledSet = new Set(enabledModules);

  const initials = coachName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  // Build dynamic module nav items that appear under Main
  const moduleNavItems: { label: string; icon: string; href: string }[] = [];
  if (enabledSet.has("agreements")) {
    moduleNavItems.push({ label: "Agreements", icon: "📄", href: "/dashboard/agreements" });
  }

  return (
    <nav className="fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-border bg-surface overflow-y-auto overflow-x-hidden">
      {/* Logo */}
      <div className="flex items-center gap-2.5 border-b border-border px-5 py-5 pb-4">
        <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-lg bg-accent text-sm font-semibold text-white">
          C
        </div>
        <div>
          <span className="font-serif text-lg text-text">CoachOS</span>
          <span className="block font-sans text-xs text-text-3">Pro</span>
        </div>
      </div>

      {/* Main nav */}
      <div className="px-3 pt-4 pb-2">
        <div className="mb-1 px-2 text-[0.65rem] font-medium uppercase tracking-[0.12em] text-text-3">
          Main
        </div>
        {[...mainNav, ...moduleNavItems].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
              isActive(item.href)
                ? "bg-accent-lt font-medium text-accent"
                : "text-text-2 hover:bg-surface-2 hover:text-text"
            }`}
          >
            <span className="w-4 flex-shrink-0 text-center">{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Tools nav */}
      <div className="px-3 pt-2 pb-2">
        <div className="mb-1 px-2 text-[0.65rem] font-medium uppercase tracking-[0.12em] text-text-3">
          Tools
        </div>
        {toolsNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
              isActive(item.href)
                ? "bg-accent-lt font-medium text-accent"
                : "text-text-2 hover:bg-surface-2 hover:text-text"
            }`}
          >
            <span className="w-4 flex-shrink-0 text-center">{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-auto border-t border-border px-4 py-3.5">
        <div className="flex items-center gap-2.5 rounded-lg p-2">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.8125rem] font-medium text-text">{coachName}</p>
            <span className="truncate text-[0.7rem] text-text-3">{coachEmail}</span>
          </div>
          <form>
            <button
              formAction={logout}
              className="border-none bg-transparent text-xs text-text-3 transition-colors hover:text-c-red"
              title="Sign out"
            >
              ⏻
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
