"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

interface TopbarProps {
  title: string;
  subtitle?: string;
}

interface SearchResult {
  id: string;
  name: string;
  email: string;
  status: string;
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSearch(value: string) {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!value.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data } = await supabase
          .from("clients")
          .select("id, name, email, status")
          .or(`name.ilike.%${value}%,email.ilike.%${value}%,phone.ilike.%${value}%`)
          .limit(6);
        setResults((data ?? []) as SearchResult[]);
        setShowResults(true);
      } catch {
        setResults([]);
      }
      setSearching(false);
    }, 300);
  }

  return (
    <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-bg px-7 py-4">
      <div>
        <h1 className="font-serif text-[1.375rem] font-normal text-text">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[0.8125rem] text-text-3">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div ref={wrapperRef} className="relative">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3.5 py-[0.45rem]">
            <span className="text-sm text-text-3">{searching ? "…" : "⌕"}</span>
            <input
              type="text"
              placeholder="Search clients…"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => { if (results.length > 0) setShowResults(true); }}
              className="w-[180px] border-none bg-transparent font-sans text-[0.8125rem] text-text outline-none placeholder:text-text-3"
            />
          </div>
          {showResults && (
            <div className="absolute right-0 top-full mt-1 w-[320px] overflow-hidden rounded-card border border-border bg-surface shadow-lg">
              {results.length === 0 ? (
                <div className="px-4 py-6 text-center text-[0.8125rem] text-text-3">No clients found</div>
              ) : (
                results.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => {
                      setShowResults(false);
                      setQuery("");
                      router.push(`/dashboard/clients/${client.id}`);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2"
                  >
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-accent-dim text-[0.7rem] font-semibold text-accent">
                      {client.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[0.8125rem] font-medium text-text">{client.name}</div>
                      <div className="truncate text-[0.72rem] text-text-3">{client.email}</div>
                    </div>
                    <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-medium ${
                      client.status === "active" ? "bg-accent-lt text-accent" : "bg-surface-3 text-text-3"
                    }`}>{client.status}</span>
                  </button>
                ))
              )}
            </div>
          )}
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
