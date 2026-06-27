import { DYNAMIC_FORM_SCHEMAS } from "@/data/mock-data";
import type { ApiResponse } from "@/types";
import type { DynamicFormFieldType, DynamicFormPreview, DynamicFormSchema } from "@/types/workflow";
import { apiClient } from "./apiClient";
import { isDemoApiEnabled } from "./demoApi";

export const DYNAMIC_FORM_FIELD_TYPES: DynamicFormFieldType[] = [
  "text",
  "textarea",
  "number",
  "select",
  "date",
  "switch",
  "upload",
  "user-picker",
  "dept-picker",
];

export interface DynamicFormQueryParams {
  tenantId?: string;
}

export interface DynamicFormValidationResult {
  valid: boolean;
  issues: string[];
}

const wrapSuccess = <T>(data: T): ApiResponse<T> => ({ success: true, data });
const wrapError = (message: string): ApiResponse<never> => ({
  success: false,
  error: { code: "REQUEST_FAILED", message },
});

const queryString = (params: DynamicFormQueryParams) => {
  const query = new URLSearchParams();
  if (params.tenantId) query.set("tenantId", params.tenantId);
  return query.toString();
};

export const validateDynamicFormSchema = (schema: DynamicFormSchema): DynamicFormValidationResult => {
  const issues: string[] = [];
  schema.fields.forEach((field) => {
    if (!DYNAMIC_FORM_FIELD_TYPES.includes(field.type)) {
      issues.push(`field ${field.key} 使用了不允许的字段类型 ${field.type}`);
    }
    if (field.linkage && /\b(window|document|eval|Function|return)\b/.test(field.linkage)) {
      issues.push(`field ${field.key} 不允许执行任意 JavaScript 表达式`);
    }
  });
  return {
    valid: issues.length === 0,
    issues,
  };
};

export const getDynamicFormSchemas = async (
  params: DynamicFormQueryParams = {}
): Promise<ApiResponse<DynamicFormSchema[]>> => {
  try {
    if (isDemoApiEnabled()) return wrapSuccess(DYNAMIC_FORM_SCHEMAS);
    const query = queryString(params);
    const path = query ? `/api/dynamic-forms/schemas?${query}` : "/api/dynamic-forms/schemas";
    return wrapSuccess(await apiClient.get<DynamicFormSchema[]>(path));
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "加载动态表单失败");
  }
};

export const previewDynamicFormSchema = async (
  schemaId: string,
  params: DynamicFormQueryParams = {}
): Promise<ApiResponse<DynamicFormPreview>> => {
  try {
    if (isDemoApiEnabled()) {
      const schema = DYNAMIC_FORM_SCHEMAS.find((item) => item.id === schemaId);
      return wrapSuccess({ renderable: Boolean(schema), fieldCount: schema?.fields.length ?? 0, traceId: "demo-form-preview" });
    }
    return wrapSuccess(await apiClient.post<DynamicFormPreview>(
      `/api/dynamic-forms/schemas/${encodeURIComponent(schemaId)}/preview`,
      params
    ));
  } catch (error) {
    return wrapError(error instanceof Error ? error.message : "预览动态表单失败");
  }
};
