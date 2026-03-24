"use client";

import { useState } from "react";
import NewAgreementModal from "./NewAgreementModal";

interface Client {
  id: string;
  name: string;
}

export default function AgreementActions({ clients }: { clients: Client[] }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-[0.8125rem] font-medium text-white transition-all hover:bg-accent-hover"
      >
        + New Agreement
      </button>
      <NewAgreementModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        clients={clients}
      />
    </>
  );
}
