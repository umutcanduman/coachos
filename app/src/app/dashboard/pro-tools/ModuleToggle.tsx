"use client";

import { useTransition } from "react";
import { toggleModule } from "./actions";

interface ModuleToggleProps {
  moduleKey: string;
  enabled: boolean;
  available: boolean;
}

export default function ModuleToggle({
  moduleKey,
  enabled,
  available,
}: ModuleToggleProps) {
  const [isPending, startTransition] = useTransition();

  if (!available) {
    return (
      <span className="inline-flex rounded-full bg-surface-3 px-3 py-1 text-[0.75rem] font-medium text-text-3">
        Coming soon
      </span>
    );
  }

  function handleToggle() {
    startTransition(async () => {
      await toggleModule(moduleKey, !enabled);
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50"
      style={{ backgroundColor: enabled ? "#4A7C68" : "#F0EDE8" }}
      role="switch"
      aria-checked={enabled}
    >
      <span
        className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200"
        style={{ transform: enabled ? "translateX(20px)" : "translateX(0)" }}
      />
    </button>
  );
}
