import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DYNAMIC_FORM_FIELD_TYPES,
  getDynamicFormSchemas,
  previewDynamicFormSchema,
  validateDynamicFormSchema,
} from "./dynamicFormService";

const jsonResponse = (data: unknown) => new Response(JSON.stringify({
  code: 0,
  message: "OK",
  data,
  traceId: "trace-form",
  timestamp: "2026-06-14T00:00:00Z",
}), { status: 200 });

describe("dynamicFormService external API contract", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_ENABLE_DEMO_MOCKS", "false");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("loads schemas and previews through external API", async () => {
    const fetchMock = vi.fn(async (url: RequestInfo | URL) => {
      const requestUrl = String(url);
      if (requestUrl.includes("/api/dynamic-forms/schemas?")) {
        return jsonResponse([{ id: "form_leave", name: "请假表单", version: 1, status: "active", fields: [] }]);
      }
      return jsonResponse({ renderable: true, fieldCount: 1, traceId: "trace-form-preview" });
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(getDynamicFormSchemas({ tenantId: "tenant_demo" })).resolves.toMatchObject({
      success: true,
      data: [expect.objectContaining({ id: "form_leave" })],
    });
    await previewDynamicFormSchema("form_leave", { tenantId: "tenant_demo" });

    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      "http://localhost:9080/api/dynamic-forms/schemas?tenantId=tenant_demo",
      "http://localhost:9080/api/dynamic-forms/schemas/form_leave/preview",
    ]);
  });

  it("keeps dynamic form field types on a whitelist and rejects script expressions", () => {
    expect(DYNAMIC_FORM_FIELD_TYPES).toEqual([
      "text",
      "textarea",
      "number",
      "select",
      "date",
      "switch",
      "upload",
      "user-picker",
      "dept-picker",
    ]);

    const result = validateDynamicFormSchema({
      id: "form_bad",
      name: "危险表单",
      version: 1,
      status: "draft",
      fields: [
        { key: "total", label: "总价", type: "script" as never, linkage: "return window.localStorage.token" },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(expect.arrayContaining([
      "field total 使用了不允许的字段类型 script",
      "field total 不允许执行任意 JavaScript 表达式",
    ]));
  });
});
