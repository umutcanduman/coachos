"use client";

import { useState } from "react";
import EditClientModal from "./EditClientModal";
import AddSessionModal from "./AddSessionModal";

interface ClientData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  location: string | null;
  package_type: string | null;
  status: string;
}

export default function ProfileActions({ client }: { client: ClientData }) {
  const [editOpen, setEditOpen] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);

  return (
    <>
      <div className="flex gap-2.5">
        <button
          onClick={() => setEditOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-4 py-2 text-[0.8125rem] font-medium text-text-2 transition-all hover:bg-surface-3"
        >
          Edit
        </button>
        <button
          onClick={() => setSessionOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-[0.8125rem] font-medium text-white transition-all hover:bg-accent-hover"
        >
          + Session
        </button>
      </div>
      <EditClientModal open={editOpen} onClose={() => setEditOpen(false)} client={client} />
      <AddSessionModal open={sessionOpen} onClose={() => setSessionOpen(false)} clientId={client.id} clientName={client.name} />
    </>
  );
}
