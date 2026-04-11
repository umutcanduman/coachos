"use client";

import Sidebar from "@/components/Sidebar";
import { useSidebar } from "@/components/SidebarContext";

interface SidebarWrapperProps {
  coachName: string;
  coachEmail: string;
}

export default function SidebarWrapper({
  coachName,
  coachEmail,
}: SidebarWrapperProps) {
  const { isOpen, close } = useSidebar();

  return (
    <Sidebar
      coachName={coachName}
      coachEmail={coachEmail}
      isOpen={isOpen}
      onClose={close}
    />
  );
}
