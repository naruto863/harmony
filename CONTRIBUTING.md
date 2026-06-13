# Contributing

感谢关注 Harmony Admin。当前项目是纯前端管理台示例，贡献流程以小步、可审查、安全为优先。

## 分支管理

- `main`：稳定主干，保持可构建、可发布。
- `develop`：可选集成分支。项目规模较小时可以直接通过 PR 合入 `main`。
- `feature/<topic>`：新功能分支。
- `fix/<topic>`：缺陷修复分支。
- `docs/<topic>`：文档更新分支。
- `release/<version>`：发布准备分支，例如 `release/v0.1.0`。

## 版本号规范

项目采用语义化版本号：`MAJOR.MINOR.PATCH`。

- `MAJOR`：不兼容变更。
- `MINOR`：向后兼容的新能力。
- `PATCH`：向后兼容的问题修复。

首次开源版本建议为 `0.1.0`，版本号以 `package.json` 为准。

## Tag 规范

- 使用 `vX.Y.Z` 格式，例如 `v0.1.0`。
- 使用 annotated tag：

```bash
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0
```

## GitHub Release 规范

Release 内容应包含：

- 版本摘要
- 主要变化
- 安全与配置提醒
- 升级或启动说明
- 已知问题
- 完整变更链接

不要在 Release 中写入真实账号、真实密钥、内部 URL 或生产环境信息。

## CHANGELOG 规范

`CHANGELOG.md` 使用以下分类：

- `Added`
- `Changed`
- `Deprecated`
- `Removed`
- `Fixed`
- `Security`
- `Known Issues`

每个版本发布前，应把 `[Unreleased]` 中的内容移动到对应版本号下。

## Commit Message 规范

提交格式：

```text
type(scope)!: subject
```

常用 type：

- `feat`
- `fix`
- `refactor`
- `docs`
- `style`
- `test`
- `perf`
- `build`
- `ci`
- `chore`
- `revert`

scope 可选，建议使用模块名，例如 `auth`、`dashboard`、`users`、`roles`、`services`、`components`、`config`。

示例：

```text
docs: add open source release guide
feat(auth): add demo login mode
ci: keep frontend checks only
```

## PR 规范

PR 应包含：

- 变更摘要
- 关联 Issue 或需求
- 测试结果
- 配置影响
- UI 改动截图或说明

提交 PR 前至少运行：

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Issue 规范

- Bug 请使用 Bug Report 模板。
- 新功能请使用 Feature Request 模板。
- 安全问题不要提交公开 Issue，请按 `SECURITY.md` 报告。

## 开源安全要求

- 不提交真实密钥、真实账号、Cookie、Token、内部 URL。
- 示例配置统一放入 `.env.example` 或 `.env.docker.example`。
- 本地环境配置不要写入 README 正文，只给占位值。
- 发现疑似敏感信息时，先在 PR 中列出风险，不直接扩大传播。
