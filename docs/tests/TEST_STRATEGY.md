# 测试策略

更新时间：2026-06-12

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
- P1 权限/菜单：不同角色菜单可见性、权限守卫放行/拒绝。
- P1 数据展示：列表空态、筛选、分页、加载失败提示。
- P2 UI 交互：弹窗确认、表单校验、主题/语言切换、响应式布局。

## 执行策略

- 每个 PR 至少运行 lint、typecheck、test、build。
- 新增服务层逻辑优先补单元测试。
- 新增页面交互优先补 React Testing Library 测试；复杂浏览器流程后续可补 Playwright。
- 演示 Mock 和真实 API 模式的边界必须清晰，不能让 demo 数据被误认为生产能力。
