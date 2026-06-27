import { describe, expect, it } from "vitest";
import { validateModuleManifest } from "./module-manifest";
import type { ModuleManifest } from "./module-manifest";

const validManifest: ModuleManifest = {
  key: "orders",
  name: "订单管理",
  version: "1.0.0",
  routes: [{ path: "/orders", label: "订单列表" }],
  menuItems: [{ id: "orders", label: "订单管理", path: "/orders", permission: "orders.read" }],
  permissions: ["orders.read", "orders.create", "orders.update", "orders.delete"],
  dictGroups: ["order_status"],
  auditEvents: ["orders.create", "orders.update"],
  featureFlag: "orders.enabled",
  apiPrefixes: ["/api/orders"],
  demoBoundary: "Demo only stores sample orders locally.",
  remoteRuntime: false,
};

describe("ModuleManifest validation", () => {
  it("accepts a compile-time manifest whose routes and permissions are declared", () => {
    const result = validateModuleManifest(validManifest, {
      declaredRoutes: new Set(["/orders"]),
    });

    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("rejects unknown routes and runtime remote plugin loading", () => {
    const result = validateModuleManifest({
      ...validManifest,
      routes: [{ path: "/remote/orders", label: "远程订单" }],
      remoteRuntime: true,
      remoteEntry: "https://plugins.example.com/orders.js",
    }, {
      declaredRoutes: new Set(["/orders"]),
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(expect.arrayContaining([
      "route /remote/orders 未在 ROUTE_COMPONENTS 白名单中声明",
      "不支持运行时远程插件或远程 JS 加载",
    ]));
  });
});
