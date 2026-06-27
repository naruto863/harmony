export type MaintenanceResourceType = "cache" | "reference-data" | "region" | "industry";

export type MaintenanceResourceStatus = "healthy" | "stale" | "locked";

export type MaintenanceOperation = "refresh" | "clear" | "sync";

export interface MaintenanceResource {
  id: string;
  name: string;
  type: MaintenanceResourceType;
  status: MaintenanceResourceStatus;
  scope: "tenant" | "global";
  updatedAt: string;
  ownerName?: string;
  description?: string;
  auditRequired: boolean;
  allowedOperations: MaintenanceOperation[];
}

export interface MaintenanceCommandOptions {
  tenantId?: string;
  reason: string;
  confirmationText: string;
}

export interface MaintenanceCommandResult {
  accepted: boolean;
  traceId: string;
  auditLogId?: string;
  message?: string;
}
