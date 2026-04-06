"use client";

import Sidebar from "@/components/Sidebar";
import { useSidebar } from "@/components/SidebarContext";

interface SidebarWrapperProps {
  coachName: string;
  coachEmail: string;
  enabledModules: string[];
}

export default function SidebarWrapper({
  coachName,
  coachEmail,
  enabledModules,
}: SidebarWrapperProps) {
  const { isOpen, close } = useSidebar();

  return (
    <Sidebar
      coachName={coachName}
      coachEmail={coachEmail}
      enabledModules={enabledModules}
      isOpen={isOpen}
      onClose={close}
    />
  );
}
