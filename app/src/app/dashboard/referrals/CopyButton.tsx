"use client";

import { useState } from "react";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-2 text-[0.75rem] font-medium text-text-2 transition-all hover:bg-surface-3"
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}
