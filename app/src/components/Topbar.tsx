"use client";

import Link from "next/link";

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  return (
    <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-bg px-7 py-4">
      <div>
        <h1 className="font-serif text-[1.375rem] font-normal text-text">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[0.8125rem] text-text-3">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3.5 py-[0.45rem]">
          <span className="text-sm text-text-3">⌕</span>
          <input
            type="text"
            placeholder="Search clients…"
            className="w-[180px] border-none bg-transparent font-sans text-[0.8125rem] text-text outline-none placeholder:text-text-3"
          />
        </div>
        <Link
          href="/dashboard/sessions"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-4 py-2 font-sans text-[0.8125rem] font-medium text-text-2 transition-all hover:border-border-2 hover:bg-surface-3 hover:text-text"
        >
          + Session
        </Link>
        <Link
          href="/dashboard/clients"
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 font-sans text-[0.8125rem] font-medium text-white transition-all hover:bg-accent-hover"
        >
          + New Client
        </Link>
      </div>
    </div>
  );
}
