import type { LifecycleStage } from "@/lib/lifecycle";

export interface PipelineCard {
  id: string;
  name: string;
  email: string;
  package_type: string | null;
  source: string | null;
  lifecycle_stage: LifecycleStage;
  lifecycle_stage_updated_at: string | null;
  proposal_price: number | null;
  next_action: string | null;
}

export interface PipelineSummary {
  leadsThisMonth: number;
  inProposalCount: number;
  inProposalValue: number;
  activeCount: number;
  alumniCount: number;
}
