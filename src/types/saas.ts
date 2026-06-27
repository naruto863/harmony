export type SaasPlanTier = "free" | "pro" | "enterprise";

export interface SaasQuotaUsage {
  key: string;
  label: string;
  used: number;
  limit: number | null;
  unit: string;
  enforcedBy: "external-api";
}

export interface SaasPlan {
  id: string;
  name: string;
  tier: SaasPlanTier;
  priceLabel: string;
  auditRetentionDays: number;
  quotas: SaasQuotaUsage[];
  moduleCodes: string[];
}

export interface SaasModuleToggle {
  moduleCode: string;
  moduleName: string;
  enabled: boolean;
  planRequired?: SaasPlanTier;
  controlledBy: "external-api";
}

export interface SaasCommandOptions {
  tenantId?: string;
  enabled: boolean;
  reason: string;
  confirmationText: string;
}

export interface SaasCommandResult {
  accepted: boolean;
  traceId: string;
  auditLogId?: string;
  message?: string;
}
