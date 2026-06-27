import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CORE_MODULE_MANIFESTS, DECLARED_MODULE_ROUTES, validateModuleManifest } from "@/modules/module-manifest";

export const ModulesPage = () => {
  const rows = CORE_MODULE_MANIFESTS.map((manifest) => ({
    manifest,
    validation: validateModuleManifest(manifest, { declaredRoutes: DECLARED_MODULE_ROUTES }),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">模块清单</h1>
        <p className="text-muted-foreground">远程插件与运行时远程插件不在默认支持范围</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">modules.read</Badge>
        <Badge variant="secondary">modules.manage</Badge>
        <Badge variant="secondary">compile-time</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ModuleManifest</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>模块</TableHead>
                  <TableHead>路由</TableHead>
                  <TableHead>权限</TableHead>
                  <TableHead>API 前缀</TableHead>
                  <TableHead>校验</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ manifest, validation }) => (
                  <TableRow key={manifest.key}>
                    <TableCell>
                      <div className="font-medium">{manifest.name}</div>
                      <div className="text-xs text-muted-foreground">{manifest.key} / {manifest.version}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {manifest.routes.map((route) => route.path).join(", ")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {manifest.permissions.slice(0, 3).join(", ")}
                      {manifest.permissions.length > 3 ? " ..." : ""}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {manifest.apiPrefixes.join(", ") || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={validation.valid ? "default" : "destructive"}>
                        {validation.valid ? "通过" : "需处理"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModulesPage;
