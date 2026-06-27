# 测试报告

更新时间：2026-06-14

## 当前状态

- 前端测试框架已配置：Vitest + React Testing Library + jsdom。
- 已有测试覆盖 `apiClient`、`tokenStorage`、`AuthContext`、`TenantContext`、`PermissionContext`、`MenuContext`、`DataTable`、`PermissionGuard`、角色表单和关键页面 smoke。
- 后续验证以 npm 脚本为准，保持 frontend-only 验证口径。

## 本地验证命令

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run security:audit
```

## 2026-06-14 v1.0 自动验证结果

- `npm run lint`：PASS with warnings；退出码为 0，仍有 25 条既有 warning。
- `npm run typecheck`：PASS。
- `npm run test`：PASS；21 个测试文件、66 个用例通过。
- `npm run build`：PASS；构建完成，输出 Browserslist 数据过期和 Vite plugin timings 提示。
- `npm run security:audit`：PASS；`npm audit --audit-level=high` 未发现漏洞。

## 2026-06-14 v1.5 TASK-009 自动验证结果

- 文档静态检查：PASS；`rg -n "v1.5|scheduler|monitoring|OpenAPI|ModuleManifest|workflows|dynamic-forms|maintenance|saas" docs/tests docs/MANUAL_CHECKLIST.md docs/FINAL_HUMAN_CHECKLIST.md` 可检索 v1.5 测试策略、人工验收和最终人工清单。
- `npm run test`：PASS；35 个测试文件、90 个用例通过。Vitest 输出 `vite:react-swc` 性能建议，不影响结果。
- `npm run typecheck`：PASS。
- `npm run lint`：本任务未执行，留待 TASK-010 最终验证。
- `npm run build`：本任务未执行，留待 TASK-010 最终验证。
- `npm run security:audit`：本任务未执行，留待 TASK-010 最终验证。
- 人工验收：未执行；`docs/MANUAL_CHECKLIST.md` 与 `docs/FINAL_HUMAN_CHECKLIST.md` 中 v1.5 项保持待人工确认。

## 2026-06-14 v1.5 TASK-010 完整验证结果

- 协议静态检查：PASS；v1.5 协议包可检索 `v1.5`、`v1.x`、`frontend-only`、`external API` 和 `SEQUENTIAL_STRICT`。
- 计划包本地边界：PASS；`git check-ignore -v docs/plans/codex_app/v1.5/TASKS.md` 命中 `.gitignore:60:docs/plans/**`。
- `npm run lint`：PASS with warnings；退出码为 0，仍有 25 条既有 warning。
- `npm run typecheck`：PASS。
- `npm run test`：PASS；35 个测试文件、90 个用例通过。
- `npm run build`：PASS；构建完成，输出 Browserslist 数据过期和 Vite plugin timings 提示。
- `npm run security:audit`：PASS；`npm audit --audit-level=high` 未发现漏洞。
- 人工验收：未执行；v1.5 浏览器人工验收仍以 `docs/MANUAL_CHECKLIST.md` 和 `docs/FINAL_HUMAN_CHECKLIST.md` 为准。

## 待加强覆盖

- 菜单和权限上下文：不同角色菜单过滤和权限刷新事件。
- 页面级交互：用户列表批量操作、文件上传弹窗、消息模板编辑。
- E2E 冒烟：启动前端、登录演示账号、进入 Dashboard、打开核心页面。
- v1.5 浏览器级验收：任务调度、监控告警、OpenAPI 辅助、ModuleManifest、工作流/动态表单、数据维护和 SaaS 扩展仍需人工或后续 E2E 覆盖。

## 结论

当前仓库具备前端自动化验证入口。每次发布前必须重新执行本报告中的本地验证命令，并以当次输出为准。
