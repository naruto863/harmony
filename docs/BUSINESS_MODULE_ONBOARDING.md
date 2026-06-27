# 前端业务模块接入模板

本模板用于把新业务模块接入 Harmony Admin 前端项目。目标是复用现有路由、布局、权限守卫、菜单、字典、审计展示、分页组件、错误处理和 API client，不为单个模块另起一套框架。

## 1. 接入前信息

| 项 | 示例 | 说明 |
| --- | --- | --- |
| 模块 key | `orders` | 小写 kebab 或单词形式，作为权限、菜单、路由前缀 |
| 模块名称 | 订单管理 | 展示名，可进入菜单和审计日志 |
| 路由 | `/orders` | 页面入口 |
| 权限前缀 | `orders` | 建议使用 `<module>.<action>` |
| 字典组 | `order_status` | 业务枚举统一进入字典数据 |
| Demo 数据 | `src/data/mock-data.ts` 或模块内 mock | 仅用于本地演示 |
| API 契约 | `docs/FRONTEND_API_CONTRACT.md` | 接入真实服务时遵守统一 envelope 和错误处理 |

## 2. 前端目录模板

现有模块可以继续使用当前结构：

```text
src/pages/<module>/
src/services/<module>Service.ts
src/types/<module>.ts
```

新模块优先按小闭环组织：

```text
src/modules/<module>/
├── pages
├── components
├── api.ts
├── types.ts
└── hooks.ts
```

最低要求：

- API 调用统一走 `apiClient` 或已有 service 层。
- 页面操作入口使用 `PermissionGuard`、`usePermission` 或等价权限判断。
- 不在页面组件里直接读写 token、用户、租户、权限等认证状态。
- Demo-only 数据隔离在 demo 边界，不混入生产 API client。
- 列表页复用现有筛选、分页、表格、空状态和错误展示模式。
- 新增环境变量时同步 `.env.example`、README 和相关文档。

## 2.1 OpenAPI 草稿辅助

v1.5 提供 `/developer/openapi` 作为可选草稿辅助入口。它可以根据用户粘贴的 OpenAPI/Swagger JSON 生成 route、权限码、菜单和 service 方法建议，但只用于预览和人工确认。

使用边界：

- 不自动写入 `src/` 或 `docs/`。
- 不执行 schema 中的脚本或示例代码。
- 不默认引入 OpenAPI codegen 依赖。
- 生成结果仍必须按本模板补齐路由、菜单、权限、Demo 数据、API 契约和测试。
- OpenAPI 示例中的真实内网地址、账号、手机号、邮箱、token 或密钥必须先脱敏。

## 2.2 ModuleManifest 约束

v1.5 提供 `/modules` 作为模块清单入口。新模块可用 `ModuleManifest` 描述路由、菜单、权限、字典、审计事件、功能开关、API 前缀和 Demo 边界。

最低约束：

- `routes[].path` 必须已经在前端 `ROUTE_COMPONENTS` 中声明。
- `menuItems[].permission` 必须进入模块权限集合。
- `apiPrefixes[]` 只描述 external API 前缀，页面仍通过 service 层和 `apiClient` 调用。
- `remoteRuntime` 必须默认为 `false`。
- 不支持运行时远程插件、远程 JS/CSS/React 组件或插件市场。
- 模块关闭后不能影响 v1.0 核心页面和默认菜单。

## 2.3 工作流与动态表单模板

如业务模块需要审批流或动态表单，优先复用 v1.5 的 `/workflows` 与 `/dynamic-forms` 接入模板。

边界：

- 审批流执行、节点权限、会签、抄送、超时和历史真实性由 external API 或工作流平台负责。
- 动态表单字段类型只允许 `text`、`textarea`、`number`、`select`、`date`、`switch`、`upload`、`user-picker`、`dept-picker`。
- 字段联动只能使用受限配置，不执行任意 JavaScript。
- 表单提交错误继续使用服务层 `fieldErrors`。
- 新模块必须同步 `workflows.*`、`forms.*` 权限码、Demo 边界和人工验收清单。

## 2.4 数据维护与 SaaS 扩展模板

如业务模块需要缓存刷新、基础数据同步、地区/行业分类维护、套餐门槛、配额展示或模块启停，优先复用 v1.5 的 `/maintenance/cache` 与 `/saas/plans` 接入模板。

边界：

- 维护资源必须由 external API 预注册，前端只提交资源 ID、原因和二次确认文本。
- 不提供 SQL 控制台、任意脚本、任意缓存 key 删除或绕过审计的维护入口。
- 套餐、配额、模块启停和审计留存周期只在前端展示；真实强制执行由 external API 或 SaaS 平台负责。
- 新模块必须同步 `maintenance.*`、`saas.*` 权限码、Demo 边界、API 契约和人工验收清单。

## 3. 权限、菜单与字典

权限码建议：

```text
<module>.read
<module>.create
<module>.update
<module>.delete
<module>.export
```

菜单接入：

- 菜单路径与模块路由一致，例如 `/orders`。
- 菜单可见性依赖 `<module>.read`。
- 按钮可见性依赖 create/update/delete/export 等细粒度权限。
- 本地演示模式下，菜单和权限来自 `src/data/mock-data.ts`。
- 前端权限只做展示级控制；真实授权、租户隔离和数据范围过滤必须由外部 API 执行。
- 如模块需要数据范围配置，优先复用角色表单中的 `dataScopeType` 与 `dataScopeDeptIds` 语义，不在业务页面内自定义另一套授权模型。

字典接入：

- 字典组 key 使用 `<module>_<field>`，例如 `order_status`。
- 前端只依赖稳定 key 和 label，不把展示文案写死在业务逻辑里。

## 4. API 接入边界

仓库不包含服务端实现。真实项目接入 API 时，应由使用方提供服务端能力，并保持：

- 统一响应 envelope：`{ code, message, data, traceId, timestamp }`。
- 认证失败返回 `401`，权限不足返回 `403`，表单错误返回明确字段提示。
- 所有租户、权限和数据隔离必须由服务端兜底，前端权限守卫只负责展示和体验。
- 写操作失败时返回可读错误信息；如有 `traceId`，前端应保留并展示给排障人员。

## 5. 最小验收清单

- 页面路由、菜单入口、按钮权限已接入。
- 列表、空状态、加载态、错误态完整。
- 表单校验与提交错误处理完整。
- API 调用集中在 service/api 文件中。
- Demo 数据与真实 API 路径边界清晰。
- `npm run lint`、`npm run typecheck`、`npm run test`、`npm run build` 通过。
