export interface OpenApiDraftInput {
  schemaText: string;
  moduleKey: string;
  moduleName: string;
  routePrefix: string;
  permissionPrefix: string;
}

export interface OpenApiServiceMethodDraft {
  name: string;
  httpMethod: string;
  path: string;
  summary?: string;
}

export interface OpenApiMenuDraft {
  label: string;
  path: string;
  permission: string;
}

export interface OpenApiModuleDraft {
  moduleKey: string;
  moduleName: string;
  routeSuggestions: string[];
  permissionSuggestions: string[];
  menuDraft: OpenApiMenuDraft;
  serviceMethods: OpenApiServiceMethodDraft[];
  warnings: string[];
  writePolicy: "preview-only";
}
