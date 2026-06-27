import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DYNAMIC_FORM_FIELD_TYPES } from "@/services/dynamicFormService";

export const DynamicFormsPage = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold">动态表单</h1>
      <p className="text-muted-foreground">字段联动使用受限配置，不执行任意 JavaScript 表达式</p>
    </div>

    <div className="flex flex-wrap gap-2">
      <Badge variant="secondary">forms.schemas.read</Badge>
      <Badge variant="secondary">forms.schemas.preview</Badge>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>字段类型白名单</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {DYNAMIC_FORM_FIELD_TYPES.map((type) => (
          <Badge key={type} variant="outline">{type}</Badge>
        ))}
      </CardContent>
    </Card>
  </div>
);

export default DynamicFormsPage;
