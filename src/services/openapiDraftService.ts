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

/**
 * HTTP 方法到权限动作的保守映射，只生成常见 CRUD 建议。
 * 例如 POST 可能是 create、execute、approve 等业务语义，这里无法自动判断，
 * 所以输出只能作为接入草稿，不能直接当成最终权限模型。
 */
const actionByMethod: Record<(typeof HTTP_METHODS)[number], string> = {
  get: "read",
  post: "create",
  put: "update",
  patch: "update",
  delete: "delete",
};

/**
 * 方法名用于草稿预览，不直接写文件。
 * 命名偏向前端 service 函数的可读性，后续落地时仍应结合真实资源名和团队规范人工调整。
 */
const verbByMethod: Record<(typeof HTTP_METHODS)[number], string> = {
  get: "list",
  post: "create",
  put: "update",
  patch: "update",
  delete: "delete",
};

/**
 * 解析 OpenAPI 文本时只校验草稿生成依赖的最小字段。
 * 这里不做完整 OpenAPI Schema validation，是为了让用户能先用不完整草稿预览模块形态。
 */
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

/**
 * 路由前缀统一成前导斜杠形式。
 * 空前缀保留为根路径，方便用户明确看到输入为空时的草稿结果。
 */
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

// 简单英文复数还原只服务于方法名可读性，不作为业务实体命名的最终权威。
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
  // 遍历 paths 下的标准 HTTP 方法，忽略 parameters、summary 等非 operation 字段。
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
  // 只根据实际出现的方法生成权限建议，避免为只读接口凭空生成写权限。
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
  // servers.url 可能包含真实内网域名或环境地址，公开 Demo/文档前需要人工脱敏。
  if (document.servers?.some((server) => Boolean(server.url))) {
    warnings.push("检测到 servers.url，请在公开文档或 Demo 中使用脱敏占位值。");
  }
  // 草稿生成保持只读，是为了避免把用户粘贴的 schema 直接变成仓库文件或远程副作用。
  warnings.push("草稿仅用于预览和人工确认，不会自动写入文件或执行远程脚本。");
  return warnings;
};

/**
 * 根据用户粘贴的 OpenAPI JSON 生成“模块接入草稿”。
 * 该函数只做预览建议：不会写文件、不会拉远程资源，也不会执行任何生成脚本。
 */
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
