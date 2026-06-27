import type { OpenApiDraftInput, OpenApiModuleDraft, OpenApiServiceMethodDraft } from "@/types/openapi";

type OpenApiOperation = {
  summary?: string;
  tags?: string[];
};

type OpenApiDocument = {
  openapi?: string;
  swagger?: string;
  servers?: Array<{ url?: string }>;
  paths?: Record<string, Partial<Record<string, OpenApiOperation>>>;
};

const HTTP_METHODS = ["get", "post", "put", "patch", "delete"] as const;

const actionByMethod: Record<(typeof HTTP_METHODS)[number], string> = {
  get: "read",
  post: "create",
  put: "update",
  patch: "update",
  delete: "delete",
};

const verbByMethod: Record<(typeof HTTP_METHODS)[number], string> = {
  get: "list",
  post: "create",
  put: "update",
  patch: "update",
  delete: "delete",
};

const parseOpenApiDocument = (schemaText: string): OpenApiDocument => {
  try {
    const value = JSON.parse(schemaText);
    if (!value || typeof value !== "object") {
      throw new Error("OpenAPI JSON 必须是对象");
    }
    const document = value as OpenApiDocument;
    if (!document.openapi && !document.swagger) {
      throw new Error("缺少 openapi 或 swagger 字段");
    }
    if (!document.paths || typeof document.paths !== "object") {
      throw new Error("缺少 paths 字段");
    }
    return document;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("OpenAPI JSON 解析失败");
    }
    throw error;
  }
};

const normalizeRoutePrefix = (routePrefix: string) => {
  const trimmed = routePrefix.trim();
  if (!trimmed) return "/";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
};

const toPascalCase = (value: string) => value
  .split(/[-_\s/{}]+/)
  .filter(Boolean)
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join("");

const singularize = (value: string) => {
  if (value.endsWith("ies")) return `${value.slice(0, -3)}y`;
  if (value.endsWith("s")) return value.slice(0, -1);
  return value;
};

const buildMethodName = (method: (typeof HTTP_METHODS)[number], moduleKey: string) => {
  const base = method === "get" ? moduleKey : singularize(moduleKey);
  return `${verbByMethod[method]}${toPascalCase(base)}`;
};

const collectServiceMethods = (
  paths: NonNullable<OpenApiDocument["paths"]>,
  moduleKey: string
): OpenApiServiceMethodDraft[] => {
  const drafts: OpenApiServiceMethodDraft[] = [];
  Object.entries(paths).forEach(([path, operations]) => {
    HTTP_METHODS.forEach((method) => {
      const operation = operations[method];
      if (!operation) return;
      drafts.push({
        name: buildMethodName(method, moduleKey),
        httpMethod: method.toUpperCase(),
        path,
        summary: operation.summary,
      });
    });
  });
  return drafts;
};

const collectPermissions = (
  methods: OpenApiServiceMethodDraft[],
  permissionPrefix: string
) => {
  const seen = new Set<string>();
  methods.forEach((method) => {
    const action = actionByMethod[method.httpMethod.toLowerCase() as keyof typeof actionByMethod];
    if (action) seen.add(`${permissionPrefix}.${action}`);
  });
  return ["read", "create", "update", "delete"]
    .map((action) => `${permissionPrefix}.${action}`)
    .filter((permission) => seen.has(permission));
};

const collectWarnings = (document: OpenApiDocument) => {
  const warnings: string[] = [];
  if (document.servers?.some((server) => Boolean(server.url))) {
    warnings.push("检测到 servers.url，请在公开文档或 Demo 中使用脱敏占位值。");
  }
  warnings.push("草稿仅用于预览和人工确认，不会自动写入文件或执行远程脚本。");
  return warnings;
};

export const buildOpenApiModuleDraft = (input: OpenApiDraftInput): OpenApiModuleDraft => {
  const document = parseOpenApiDocument(input.schemaText);
  const route = normalizeRoutePrefix(input.routePrefix);
  const serviceMethods = collectServiceMethods(document.paths!, input.moduleKey);
  const permissionSuggestions = collectPermissions(serviceMethods, input.permissionPrefix);

  return {
    moduleKey: input.moduleKey,
    moduleName: input.moduleName,
    routeSuggestions: [route],
    permissionSuggestions,
    menuDraft: {
      label: input.moduleName,
      path: route,
      permission: `${input.permissionPrefix}.read`,
    },
    serviceMethods,
    warnings: collectWarnings(document),
    writePolicy: "preview-only",
  };
};
