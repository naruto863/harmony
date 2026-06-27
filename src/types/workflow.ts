export type WorkflowDefinitionStatus = "draft" | "active" | "disabled";
export type WorkflowInstanceStatus = "running" | "approved" | "rejected" | "cancelled";
export type DynamicFormStatus = "draft" | "active" | "disabled";

export interface WorkflowDefinition {
  id: string;
  name: string;
  status: WorkflowDefinitionStatus;
  version: number;
  description?: string;
}

export interface WorkflowInstance {
  id: string;
  definitionId: string;
  title: string;
  status: WorkflowInstanceStatus;
  currentNodeName?: string;
  traceId?: string | null;
}

export interface WorkflowCommandResult {
  accepted: boolean;
  traceId?: string | null;
}

export type DynamicFormFieldType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "date"
  | "switch"
  | "upload"
  | "user-picker"
  | "dept-picker";

export interface DynamicFormField {
  key: string;
  label: string;
  type: DynamicFormFieldType;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
  linkage?: string;
}

export interface DynamicFormSchema {
  id: string;
  name: string;
  version: number;
  status: DynamicFormStatus;
  fields: DynamicFormField[];
}

export interface DynamicFormPreview {
  renderable: boolean;
  fieldCount: number;
  traceId?: string | null;
}
