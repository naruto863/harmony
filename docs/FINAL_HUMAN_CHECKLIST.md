# Final Human Checklist

Status: pending human verification. Automated validation is recorded in `docs/plans/codex_app/v1.0/RUNLOG.md`; unchecked items below must be confirmed by a human before tagging or publishing a release.

- [ ] 从干净 clone 执行 `npm ci` 成功。
- [ ] `npm run lint`、`npm run typecheck`、`npm run test`、`npm run build` 全部通过。
- [ ] 默认 `.env.example` 可直接启动演示模式。
- [ ] `admin@example.com`、`manager@example.com`、`viewer@example.com` 三个演示账号登录行为符合预期。
- [ ] 演示登录后能进入 Dashboard，并能加载租户、权限和菜单。
- [ ] `VITE_ENABLE_DEMO_MOCKS=false` 时不会继续使用演示登录数据。
- [ ] Docker Compose 只构建前端静态站点服务，不依赖仓库内置服务端或数据库目录。
- [ ] README、CONTRIBUTING、SECURITY、PR 模板和 Release 流程只要求 Node/npm 前端验证命令。
- [ ] `LICENSE` 已使用 Apache License 2.0。
- [ ] 发布前扫描仓库未暴露真实密钥、真实账号、Cookie、Token 或内部 URL。
