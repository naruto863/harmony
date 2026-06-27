export type SchedulerJobStatus = "enabled" | "disabled" | "paused";
export type SchedulerExecutionStatus = "pending" | "running" | "success" | "failed" | "cancelled";
export type SchedulerTriggerType = "cron" | "fixed-rate" | "manual";

export interface SchedulerJob {
  id: string;
  name: string;
  status: SchedulerJobStatus;
  triggerType: SchedulerTriggerType;
  triggerExpression: string;
  ownerName?: string;
  lastResult?: "success" | "failed" | "none";
  lastRunAt?: string | null;
  nextRunAt?: string | null;
  alertEnabled?: boolean;
}

export interface SchedulerExecution {
  id: string;
  jobId: string;
  jobName: string;
  status: SchedulerExecutionStatus;
  startedAt?: string | null;
  finishedAt?: string | null;
  durationMs?: number | null;
  traceId?: string | null;
  errorSummary?: string | null;
  retryable?: boolean;
}

export interface SchedulerCommandResult {
  accepted: boolean;
  traceId?: string | null;
}
