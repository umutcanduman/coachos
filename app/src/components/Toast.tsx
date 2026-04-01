"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error";
  onClose: () => void;
}

export default function Toast({ message, type = "success", onClose }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-[300] rounded-lg border px-5 py-3 text-[0.8125rem] font-medium shadow-lg transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      } ${
        type === "success"
          ? "border-accent/20 bg-accent-lt text-accent"
          : "border-c-red/20 bg-c-red-dim text-c-red"
      }`}
    >
      {type === "success" ? "✓ " : "✕ "}{message}
    </div>
  );
}
