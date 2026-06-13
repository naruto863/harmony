# 测试报告

更新时间：2026-06-12

## 当前状态

- 前端测试框架已配置：Vitest + React Testing Library + jsdom。
- 已有测试覆盖 `apiClient`、`AuthContext`、`DataTable`、`PermissionGuard` 等关键单元。
- 后续验证以 npm 脚本为准，不再包含后端 Maven 测试。

## 本地验证命令

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## 待加强覆盖

- 演示登录服务：成功登录、错误密码、禁用账号、租户切换。
- 菜单和权限上下文：不同角色菜单过滤和权限刷新。
- 页面级交互：登录页、租户选择、用户列表、角色编辑、文件上传弹窗。
- E2E 冒烟：启动前端、登录演示账号、进入 Dashboard、打开核心页面。

## 结论

当前仓库具备前端自动化验证入口。每次发布前必须重新执行本报告中的本地验证命令，并以当次输出为准。
