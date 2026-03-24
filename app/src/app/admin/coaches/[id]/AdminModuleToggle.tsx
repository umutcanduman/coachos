"use client";

import { useTransition } from "react";
import { adminToggleModule } from "../../actions";

interface AdminModuleToggleProps {
  coachId: string;
  moduleKey: string;
  moduleName: string;
  enabled: boolean;
  paymentStatus: string;
}

export default function AdminModuleToggle({
  coachId,
  moduleKey,
  moduleName,
  enabled,
  paymentStatus,
}: AdminModuleToggleProps) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await adminToggleModule(coachId, moduleKey, !enabled);
    });
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-4 py-3">
      <div>
        <p className="text-[0.8125rem] font-medium text-text">{moduleName}</p>
        <p className="text-[0.7rem] text-text-3">
          Payment: {paymentStatus}
        </p>
      </div>
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
    </div>
  );
}
