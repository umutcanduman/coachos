"use client";

import { useState } from "react";
import NewClientModal from "./NewClientModal";

interface ClientOption {
  id: string;
  name: string;
}

export default function ClientActions({ existingClients = [] }: { existingClients?: ClientOption[] }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-[0.8125rem] font-medium text-white transition-all hover:bg-accent-hover"
      >
        + New Client
      </button>
      <NewClientModal open={modalOpen} onClose={() => setModalOpen(false)} existingClients={existingClients} />
    </>
  );
}
