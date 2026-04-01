"use client";

import { useState, useRef, useEffect } from "react";

export default function NoteIndicator({ notes }: { notes: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-6 w-6 items-center justify-center rounded text-sm transition-colors hover:bg-surface-3"
        title="View notes"
      >
        📝
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-64 rounded-lg border border-border bg-surface p-3 shadow-lg">
          <p className="text-[0.8125rem] leading-relaxed text-text-2">{notes}</p>
        </div>
      )}
    </div>
  );
}
