import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { buildOpenApiModuleDraft } from "@/services/openapiDraftService";

const sampleSchema = JSON.stringify({
  openapi: "3.0.3",
  info: { title: "Orders API", version: "1.0.0" },
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
}, null, 2);

export const OpenApiDraftPage = () => {
  const [schemaText, setSchemaText] = useState(sampleSchema);

  const draft = useMemo(() => {
    try {
      return buildOpenApiModuleDraft({
        schemaText,
        moduleKey: "orders",
        moduleName: "订单管理",
        routePrefix: "/orders",
        permissionPrefix: "orders",
      });
    } catch {
      return null;
    }
  }, [schemaText]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">OpenAPI 辅助</h1>
        <p className="text-muted-foreground">只生成草稿预览，不自动写入文件或执行远程脚本</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">developer.openapi.read</Badge>
        <Badge variant="secondary">developer.openapi.manage</Badge>
        <Badge variant="secondary">preview-only</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <Card>
          <CardHeader>
            <CardTitle>OpenAPI / Swagger JSON</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={schemaText}
              onChange={(event) => setSchemaText(event.target.value)}
              className="min-h-[360px] font-mono text-sm"
              aria-label="OpenAPI JSON"
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>权限码建议</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {draft?.permissionSuggestions.map((permission) => (
                <Badge key={permission} variant="outline">{permission}</Badge>
              )) || <p className="text-sm text-muted-foreground">等待有效 OpenAPI JSON</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>菜单草稿</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {draft ? (
                <>
                  <div>label: {draft.menuDraft.label}</div>
                  <div>path: {draft.menuDraft.path}</div>
                  <div>permission: {draft.menuDraft.permission}</div>
                </>
              ) : (
                <p className="text-muted-foreground">等待有效 OpenAPI JSON</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service 草稿</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {draft?.serviceMethods.map((method) => (
                <div key={`${method.httpMethod}-${method.path}`} className="rounded-md border p-2">
                  <div className="font-medium">{method.name}</div>
                  <div className="text-muted-foreground">{method.httpMethod} {method.path}</div>
                </div>
              )) || <p className="text-muted-foreground">等待有效 OpenAPI JSON</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OpenApiDraftPage;
