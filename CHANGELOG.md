# Changelog

本项目遵循 [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) 的结构，并使用语义化版本号。

## [Unreleased]

### Changed

- 移除仓库内后端实现，项目定位调整为纯前端管理台示例。
- CI、Docker、README、贡献指南、安全策略和发布流程改为前端项目口径。
- 默认启用演示 Mock，方便本地直接预览。
- 清理公开 HTML 元信息中的模板残留，并修正 README、用户手册和协作指南中的开源发布口径。

### Added

- 新增演示登录、租户、权限、角色和菜单数据兜底。
- 补齐 Vitest、React Testing Library 和 jsdom 的 lockfile 依赖。

### Removed

- 删除 `backend/` 下的 Spring Boot、数据库迁移和后端测试代码。

## [0.1.0] - 2026-05-05

### Added

- 首次开源准备版本。
- React + TypeScript + Vite 管理端基础能力。
- 用户、角色、权限、租户、菜单、审计日志等管理台模块。
- README、LICENSE、CONTRIBUTING、SECURITY、Issue/PR 模板和基础 CI。

### Security

- 增加开源前安全配置说明。

### Known Issues

- 仓库不包含后端实现，需要使用方接入自己的 API。
- `LICENSE` 版权主体仍为 TODO，公开发布前必须确认。
