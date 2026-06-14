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

## 执行策略

- 每个 PR 至少运行 lint、typecheck、test、build。
- 新增服务层逻辑优先补单元测试。
- 新增页面交互优先补 React Testing Library 测试；复杂浏览器流程后续可补 Playwright。
- 演示 Mock 和真实 API 模式的边界必须清晰，不能让 demo 数据被误认为生产能力。
