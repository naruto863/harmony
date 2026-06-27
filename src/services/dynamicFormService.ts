import { DYNAMIC_FORM_SCHEMAS } from "@/data/mock-data";
import type { ApiResponse } from "@/types";
import type { DynamicFormFieldType, DynamicFormPreview, DynamicFormSchema } from "@/types/workflow";
import { apiClient } from "./apiClient";
import { isDemoApiEnabled } from "./demoApi";

/**
 * 动态表单字段类型使用显式白名单。
 * 新增字段类型时必须先在这里登记，再补对应渲染组件和校验规则，避免 schema 随意扩张。
 */
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
    /**
     * linkage 当前只作为声明式联动配置展示，不能执行任意 JS。
     * 这里用保守关键词拦截高风险表达式，后续若要支持复杂联动，应接入受限表达式解析器。
     */
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
    // Demo schema 是静态样例，目的是验证渲染边界，而不是让前端成为表单设计器后端。
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
      // 预览只返回是否可渲染和字段数量，不在 Demo 中执行 schema 保存或发布。
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
