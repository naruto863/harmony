# 测试任务拆分

更新时间：2026-06-12

## P0

### TASK-T001：演示登录服务测试

- 测试目标：验证演示账号登录成功、错误密码失败、禁用账号拒绝。
- 覆盖范围：`src/services/demoApi.ts`、`src/services/authService.ts`。
- 依赖/Mock 策略：Vitest + jsdom localStorage，不访问真实 API。
- 完成标准：`npm run test` 通过。

### TASK-T002：API Client 认证链路测试

- 测试目标：验证 Authorization 注入、401 refresh 成功后重试、refresh 失败后清理 token 并广播 logout。
- 覆盖范围：`src/services/apiClient.ts`、`src/services/tokenStorage.ts`、`src/lib/authEvents.ts`。
- 依赖/Mock 策略：Vitest fake `fetch`。
- 完成标准：覆盖成功、失败和事件广播。

### TASK-T003：AuthContext 状态测试

- 测试目标：验证登录后写入 session/user/token，登出后清理状态。
- 覆盖范围：`src/contexts/AuthContext.tsx`。
- 依赖/Mock 策略：React Testing Library + mocked services。
- 完成标准：登录/登出主路径可回归。

## P1

### TASK-T004：权限和菜单上下文测试

- 测试目标：验证不同角色权限加载、菜单树加载、权限刷新事件。
- 覆盖范围：`src/contexts/PermissionContext.tsx`、`src/contexts/MenuContext.tsx`。
- 依赖/Mock 策略：mock 服务层返回值。
- 完成标准：覆盖有权限、无权限、加载失败。

### TASK-T005：核心页面交互测试

- 测试目标：覆盖登录页、租户选择、用户列表、角色编辑、文件上传弹窗的关键交互。
- 覆盖范围：`src/pages/auth/Login.tsx`、`SelectTenant.tsx`、`UsersPage.tsx`、`RolesPage.tsx`、`FilesPage.tsx`。
- 依赖/Mock 策略：React Testing Library + mocked services。
- 完成标准：至少覆盖登录成功/失败、表单必填、弹窗确认。

## P2

### TASK-T006：主流程 E2E 冒烟测试

- 测试目标：验证前端启动、演示登录、进入 Dashboard、打开核心页面。
- 覆盖范围：浏览器端主流程。
- 依赖/Mock 策略：Playwright + 默认演示 Mock。
- 完成标准：CI 或发布前环境可稳定执行。
