# 演示模块边界

## 开关

本仓库是纯前端项目，默认启用演示 Mock，便于 clone 后直接预览：

```env
VITE_ENABLE_DEMO_MOCKS=true
```

接入真实 API 时必须关闭演示 Mock：

```env
VITE_ENABLE_DEMO_MOCKS=false
```

## 演示账号

```text
admin@example.com / local-demo-admin
manager@example.com / local-demo-manager
viewer@example.com / local-demo-viewer
```

## 存储命名空间

演示 LocalStorage 统一使用 `ha_demo:` 前缀。核心 token 仍只允许通过 `src/services/tokenStorage.ts` 读写。

## 默认从真实 API 模式菜单隐藏的演示路由

- `/projects`
- `/data-screen`
- `/settings/notifications`
- `/settings/security`
- `/settings/features`

## 当前使用本地演示数据的服务

- `authService`
- `tenantService`
- `permissionService`
- `roleService` 的查询能力
- `menuService` 的菜单树查询
- `projectService`
- `filterService`
- `importExportService` 中的导入写入逻辑
- `securityService` 中的 2FA 演示逻辑

这些服务在 `VITE_ENABLE_DEMO_MOCKS=false` 时会回到真实 API 模式或拒绝执行，避免被误认为生产实现。
