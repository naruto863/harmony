# Changelog

本项目遵循 [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) 的结构，并使用语义化版本号。

## [Unreleased]

## [0.5.0] - 2026-06-13

### Added

- 补齐岗位管理 Demo 闭环：菜单入口、权限码、本地演示数据和 CRUD 行为。
- 补齐用户组管理 Demo 闭环：菜单入口、权限码、本地演示数据、成员读取和成员更新。
- 增加岗位、用户组、组织树、租户用户和 Mock 数据的 v0.5 自动化测试覆盖。
- 补充岗位、用户组、成员接口和角色数据范围的外部 API 契约说明。

### Changed

- 明确数据范围由前端配置和提交，真实过滤、越权拒绝和跨租户隔离由外部 API 兜底。
- 更新 Demo 边界、功能实现对照和手动验收清单，保持 pure frontend + external API contract 口径。

## [0.1.0] - 2026-06-13

### Added

- 首次开源准备版本。
- React + TypeScript + Vite 管理端基础能力。
- 用户、角色、权限、租户、菜单、审计日志等管理台模块。
- 本地演示登录、租户、权限、角色和菜单数据兜底。
- README、LICENSE、CONTRIBUTING、SECURITY、Issue/PR 模板和基础 CI。
- Vitest、React Testing Library 和 jsdom 的基础测试配置。

### Changed

- 移除仓库内后端实现，项目定位调整为纯前端管理台示例。
- CI、Docker、README、贡献指南、安全策略和发布流程改为前端项目口径。
- 默认启用演示 Mock，方便本地直接预览。
- 清理公开 HTML 元信息中的模板残留，并修正 README、用户手册和协作指南中的开源发布口径。

### Removed

- 删除 `backend/` 下的 Spring Boot、数据库迁移和后端测试代码。

### Security

- 使用 Apache License 2.0。
- 增加开源前安全配置说明。

### Known Issues

- 仓库不包含后端实现，需要使用方接入自己的 API。
