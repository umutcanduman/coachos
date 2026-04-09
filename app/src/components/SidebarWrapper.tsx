"use client";

import Sidebar from "@/components/Sidebar";
import { useSidebar } from "@/components/SidebarContext";

interface SidebarWrapperProps {
  coachName: string;
  coachEmail: string;
  enabledModules: string[];
  pipelineBadgeCount?: number;
}

export default function SidebarWrapper({
  coachName,
  coachEmail,
  enabledModules,
  pipelineBadgeCount = 0,
}: SidebarWrapperProps) {
  const { isOpen, close } = useSidebar();

  return (
    <Sidebar
      coachName={coachName}
      coachEmail={coachEmail}
      enabledModules={enabledModules}
      pipelineBadgeCount={pipelineBadgeCount}
      isOpen={isOpen}
      onClose={close}
    />
  );
}
