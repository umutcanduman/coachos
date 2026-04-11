"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/dashboard/actions";

const navItems = [
  { label: "Dashboard", icon: "◈", href: "/dashboard" },
  { label: "Clients",   icon: "◉", href: "/dashboard/clients" },
  { label: "Sessions",  icon: "◷", href: "/dashboard/sessions" },
  { label: "Finance",   icon: "◎", href: "/dashboard/finance" },
  { label: "Settings",  icon: "◧", href: "/dashboard/settings" },
];

interface SidebarProps {
  coachName: string;
  coachEmail: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({
  coachName,
  coachEmail,
  isOpen,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();

  const initials = coachName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    // Finance: highlight for /dashboard/finance, /dashboard/payments, /dashboard/referrals
    if (href === "/dashboard/finance") {
      return pathname.startsWith("/dashboard/finance") ||
        pathname.startsWith("/dashboard/payments") ||
        pathname.startsWith("/dashboard/referrals");
    }
    // Settings: highlight for /dashboard/settings, /dashboard/pro-tools
    if (href === "/dashboard/settings") {
      return pathname.startsWith("/dashboard/settings") ||
        pathname.startsWith("/dashboard/pro-tools");
    }
    // Clients: highlight for /dashboard/clients, /dashboard/pipeline, /dashboard/acquisition
    if (href === "/dashboard/clients") {
      return pathname.startsWith("/dashboard/clients") ||
        pathname.startsWith("/dashboard/pipeline") ||
        pathname.startsWith("/dashboard/acquisition");
    }
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Backdrop - mobile only */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <nav
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-border bg-surface overflow-y-auto overflow-x-hidden transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Mobile close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-md text-text-3 transition-colors hover:bg-surface-2 hover:text-text lg:hidden"
          aria-label="Close sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2.5 border-b border-border px-5 py-5 pb-4">
          <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-lg bg-accent text-sm font-semibold text-white">C</div>
          <div>
            <span className="font-serif text-lg text-text">CoachOS</span>
            <span className="block font-sans text-xs text-text-3">Pro</span>
          </div>
        </div>

        {/* Nav */}
        <div className="px-3 pt-4 pb-2 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex min-h-[44px] items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors lg:min-h-0 ${
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
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">{initials}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.8125rem] font-medium text-text">{coachName}</p>
              <span className="truncate text-[0.7rem] text-text-3">{coachEmail}</span>
            </div>
            <form>
              <button formAction={logout} className="border-none bg-transparent text-xs text-text-3 transition-colors hover:text-c-red" title="Sign out">⏻</button>
            </form>
          </div>
        </div>
      </nav>
    </>
  );
}
