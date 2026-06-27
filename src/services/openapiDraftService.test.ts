import { describe, expect, it } from "vitest";
import { buildOpenApiModuleDraft } from "./openapiDraftService";

const sampleSpec = {
  openapi: "3.0.3",
  info: { title: "Orders API", version: "1.0.0" },
  servers: [{ url: "https://internal.example.local" }],
  paths: {
    "/api/orders": {
      get: { summary: "List orders", tags: ["orders"] },
      post: { summary: "Create order", tags: ["orders"] },
    },
    "/api/orders/{orderId}": {
      put: { summary: "Update order", tags: ["orders"] },
      delete: { summary: "Delete order", tags: ["orders"] },
    },
  },
};

describe("openapiDraftService", () => {
  it("builds route, permission, menu and service drafts from an OpenAPI document", () => {
    const draft = buildOpenApiModuleDraft({
      schemaText: JSON.stringify(sampleSpec),
      moduleKey: "orders",
      moduleName: "订单管理",
      routePrefix: "/orders",
      permissionPrefix: "orders",
    });

    expect(draft.moduleKey).toBe("orders");
    expect(draft.routeSuggestions).toEqual(["/orders"]);
    expect(draft.permissionSuggestions).toEqual([
      "orders.read",
      "orders.create",
      "orders.update",
      "orders.delete",
    ]);
    expect(draft.menuDraft).toMatchObject({
      label: "订单管理",
      path: "/orders",
      permission: "orders.read",
    });
    expect(draft.serviceMethods.map((method) => method.name)).toEqual([
      "listOrders",
      "createOrder",
      "updateOrder",
      "deleteOrder",
    ]);
    expect(draft.warnings).toContain("检测到 servers.url，请在公开文档或 Demo 中使用脱敏占位值。");
    expect(draft.writePolicy).toBe("preview-only");
  });

  it("rejects invalid OpenAPI input with a readable error", () => {
    expect(() => buildOpenApiModuleDraft({
      schemaText: "{ broken json",
      moduleKey: "orders",
      moduleName: "订单管理",
      routePrefix: "/orders",
      permissionPrefix: "orders",
    })).toThrow("OpenAPI JSON 解析失败");
  });
});
