import { requireAdmin } from "@/lib/admin";
import Link from "next/link";
import AdminNav from "./AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Admin Sidebar */}
      <nav className="fixed top-0 left-0 bottom-0 z-50 flex w-[240px] flex-col border-r border-border bg-surface">
        {/* Logo */}
        <div className="flex items-center gap-2.5 border-b border-border px-5 py-5 pb-4">
          <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-lg bg-c-red text-sm font-semibold text-white">
            A
          </div>
          <div>
            <span className="font-serif text-lg text-text">CoachOS</span>
            <span className="block font-sans text-xs text-c-red">Admin</span>
          </div>
        </div>

        <AdminNav />

        {/* Footer */}
        <div className="mt-auto border-t border-border px-4 py-3.5">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-text-2 transition-colors hover:bg-surface-2 hover:text-text"
          >
            <span className="w-4 flex-shrink-0 text-center">←</span>
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </nav>

      <div className="ml-[240px] flex flex-1 flex-col">{children}</div>
    </div>
  );
}
