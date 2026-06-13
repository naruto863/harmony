# Release Process

本文档描述 Harmony Admin 的基础发布流程。当前阶段只做手动发布，不配置自动发布流水线。

## 版本策略

- 使用语义化版本号：`MAJOR.MINOR.PATCH`。
- Tag 使用 `vX.Y.Z`，例如 `v0.1.0`。
- 版本号以 `package.json` 为准。

## 首次开源版本

建议首次开源版本为 `v0.1.0`。

### 首次 GitHub Release 内容模板

```markdown
# Harmony Admin v0.1.0

首次开源准备版本，包含 React + TypeScript + Vite 管理台前端、演示 Mock 和基础开源协作文件。

## Highlights

- React + TypeScript + Vite 管理端
- Tailwind CSS + shadcn/ui 组件体系
- 用户、角色、权限、租户、菜单、审计日志等管理台界面
- 本地演示账号与 mock 数据
- README、CONTRIBUTING、SECURITY、Issue/PR 模板
- GitHub Actions 前端 CI

## Security Notes

- 演示账号仅用于本地 mock 模式。
- 示例配置仅使用占位值。
- 接入真实 API 前应关闭 `VITE_ENABLE_DEMO_MOCKS`。

## Known Issues

- 仓库不包含后端实现，需要使用方接入自己的 API。
```

## 发布前 Checklist

- [ ] `git status` 中没有误暂存系统文件、缓存文件、日志文件。
- [ ] 已扫描真实密钥、真实账号、Cookie、Token、内部 URL。
- [ ] README 中的启动步骤可执行。
- [ ] `CHANGELOG.md` 已更新。
- [ ] `LICENSE` 已使用 Apache License 2.0。
- [ ] `npm run lint` 通过。
- [ ] `npm run typecheck` 通过。
- [ ] `npm run test` 通过。
- [ ] `npm run build` 通过。
- [ ] GitHub Actions 在 PR 或主干上通过。

## 发布命令

```bash
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0
```

## 发布后 Checklist

- [ ] 从公开仓库重新 clone。
- [ ] 按 README 启动前端。
- [ ] 确认 GitHub Actions 状态正常。
- [ ] 确认 Issue/PR 模板可用。
- [ ] 确认 Release 页面、Tag、CHANGELOG 链接正确。
- [ ] 检查仓库页面未暴露真实密钥、真实账号或内部地址。
