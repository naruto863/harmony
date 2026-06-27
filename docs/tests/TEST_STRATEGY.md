# 测试策略

更新时间：2026-06-14

## 当前测试入口

- `npm run lint`：ESLint 静态检查。
- `npm run typecheck`：TypeScript 项目引用检查。
- `npm run test`：Vitest + React Testing Library 单元测试。
- `npm run build`：Vite 生产构建。

## 测试范围

- 服务层：`apiClient`、`authService`、`tokenStorage`、演示 Mock 边界。
- Context：`AuthContext`、`TenantContext`、`PermissionContext`、`MenuContext`。
- 组件：表格、权限守卫、表单弹窗和关键 UI 状态。
- 页面：登录、租户选择、Dashboard、用户/角色/审计等核心页面。

## 高价值测试点

- P0 登录链路：演示账号成功登录、错误密码失败、禁用账号拒绝。
- P0 Token 链路：登录后集中写入 token，登出后清理 token。
- P0 API 错误契约：401 refresh、403 权限事件、5xx 安全错误文案。
- P0 Context 空状态：未认证、未选择租户、菜单加载失败、权限加载失败时应有稳定状态。
- P1 权限/菜单：不同角色菜单可见性、权限守卫放行/拒绝。
- P1 数据展示：列表空态、筛选、分页、加载失败提示。
- P2 UI 交互：弹窗确认、表单校验、主题/语言切换、响应式布局。

## v1.0 基础设施测试基线

- `src/services/apiClient.test.ts`：覆盖 envelope 解包、401 refresh、403 权限事件、422 字段错误和 5xx TraceId 脱敏。
- `src/services/tokenStorage.test.ts`：覆盖 token 集中读写、清理和 localStorage 风险说明。
- `src/contexts/AuthContext.test.tsx`：覆盖登录持久化、有效 session 恢复、坏 session 清理、登录失败和登出清理。
- `src/contexts/TenantContext.test.tsx`：覆盖未认证空状态、单租户自动选择和切换租户 token 更新。
- `src/contexts/PermissionContext.test.tsx`：覆盖未认证空状态、普通权限加载和超级管理员前端权限放行。
- `src/contexts/MenuContext.test.tsx`：覆盖未认证 idle、菜单加载成功和菜单加载失败。
- `src/components/guards/PermissionGuard.test.tsx`：覆盖单权限、多权限任意匹配、多权限全部匹配、fallback 和重定向。

## v1.0 页面与组件测试基线

- `src/components/roles/RoleFormDialog.test.tsx`：覆盖角色创建/编辑提交、权限选择、`ALL` 与 `CUSTOM` 数据范围。
- `src/components/crud/DataTable.test.tsx`：覆盖表格渲染、搜索空态、接口错误 TraceId/字段错误和批量部分失败。
- `src/pages/auth/AuthPages.test.tsx`：覆盖登录页 Demo 账号提示和租户选择页渲染。
- `src/pages/page-smoke.test.tsx`：覆盖用户、角色、文件和消息中心页面的最小渲染 smoke，服务层使用 mock，避免真实网络依赖。

## v1.5 长期增强测试矩阵

v1.5 模块仍按 frontend-only + external API 边界测试，不接入真实调度器、监控平台、工作流引擎、插件运行时、支付计费或 SaaS 计量后端。

| 模块 | 自动化测试入口 | 文档静态检查 | 人工验收重点 |
| --- | --- | --- | --- |
| 任务调度 | `src/services/schedulerService.test.ts`、`src/pages/scheduler/scheduler-pages.test.tsx` | `/api/scheduler`、`scheduler.*`、任务执行边界 | `/scheduler/jobs` 与 `/scheduler/executions` 的读写入口、二次确认和外部 API 错误 |
| 监控告警 | `src/services/monitoringService.test.ts`、`src/pages/monitoring/monitoring-pages.test.tsx` | `/api/monitoring`、`monitoring.*`、TraceId、可观测性 | 健康状态、告警历史、确认/解决/静默入口和脱敏展示 |
| OpenAPI 辅助 | `src/services/openapiDraftService.test.ts`、`src/pages/developer/openapi.test.tsx` | OpenAPI、Swagger、`developer.openapi.*`、codegen 边界 | 草稿预览不会写文件、不会执行远程脚本、敏感 schema 需脱敏 |
| ModuleManifest | `src/modules/module-manifest.test.ts`、`src/pages/modules/modules-page.test.tsx` | `ModuleManifest`、`/api/modules`、`modules.*`、远程插件边界 | 只支持 compile-time/配置型入口，不加载远程 JS/CSS/React 组件 |
| 工作流/动态表单 | `src/services/workflowService.test.ts`、`src/services/dynamicFormService.test.ts`、`src/pages/workflows/workflows-page.test.tsx` | `/api/workflows`、`/api/dynamic-forms`、`workflows.*`、`forms.*`、字段联动 | 字段白名单、`fieldErrors`、审批执行和历史真实性由 external API 负责 |
| 数据维护/SaaS | `src/services/maintenanceService.test.ts`、`src/services/saasService.test.ts`、`src/pages/maintenance/maintenance-page.test.tsx` | `/api/maintenance`、`/api/saas`、`maintenance.*`、`saas.*`、审计留存 | 不提供 SQL 控制台、任意缓存 key 删除、支付账单或真实配额强制执行 |

## v1.5 文档静态检查

新增或调整 v1.5 模块时，至少执行：

```bash
rg -n "v1.5|scheduler|monitoring|OpenAPI|ModuleManifest|workflows|dynamic-forms|maintenance|saas" docs/tests docs/MANUAL_CHECKLIST.md docs/FINAL_HUMAN_CHECKLIST.md
rg -n "/api/scheduler|/api/monitoring|/api/modules|/api/workflows|/api/dynamic-forms|/api/maintenance|/api/saas" docs
rg -n "scheduler\\.|monitoring\\.|developer\\.openapi|modules\\.|workflows\\.|forms\\.|maintenance\\.|saas\\." docs src
```

人工验收项必须保持 `pending` 或待确认；未人工执行的 UI、真实 API、权限关闭和生产环境检查不得写成通过。

## 执行策略

- 每个 PR 至少运行 lint、typecheck、test、build。
- 新增服务层逻辑优先补单元测试。
- 新增页面交互优先补 React Testing Library 测试；复杂浏览器流程后续可补 Playwright。
- 演示 Mock 和真实 API 模式的边界必须清晰，不能让 demo 数据被误认为生产能力。
