import { apiClient } from "./apiClient";

export type FrontendErrorReport = {
  message: string;
  stack?: string;
  source?: string;
  traceId?: string | null;
  path?: string;
  userAgent?: string;
  timestamp: string;
};

const MAX_FIELD_LENGTH = 2000;

const normalizeField = (value?: string | null) => {
  if (!value) return undefined;
  return value.length > MAX_FIELD_LENGTH ? value.slice(0, MAX_FIELD_LENGTH) : value;
};

export const buildFrontendErrorReport = (
  error: unknown,
  extra: Partial<Omit<FrontendErrorReport, "message" | "timestamp">> = {}
): FrontendErrorReport => {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  return {
    message: normalizeField(message) || "Unknown frontend error",
    stack: normalizeField(extra.stack || stack),
    source: normalizeField(extra.source),
    traceId: extra.traceId ?? null,
    path: normalizeField(extra.path || window.location.pathname),
    userAgent: normalizeField(extra.userAgent || window.navigator.userAgent),
    timestamp: new Date().toISOString(),
  };
};

export const reportFrontendError = async (report: FrontendErrorReport): Promise<void> => {
  await apiClient.post<void>("/api/observability/frontend-errors", {
    ...report,
    message: normalizeField(report.message) || "Unknown frontend error",
    stack: normalizeField(report.stack),
    source: normalizeField(report.source),
    path: normalizeField(report.path),
    userAgent: normalizeField(report.userAgent),
  });
};
