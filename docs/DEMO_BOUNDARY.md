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
- `deptService` 的只读组织树查询
- `userService` 的租户演示用户查询
- `positionService` 的岗位 Demo CRUD
- `userGroupService` 的用户组和成员 Demo CRUD
- `projectService`
- `filterService`
- `importExportService` 中的导入写入逻辑
- `securityService` 中的 2FA 演示逻辑

这些服务在 `VITE_ENABLE_DEMO_MOCKS=false` 时会回到真实 API 模式或拒绝执行，避免被误认为生产实现。

## v0.5 当前可本地演示的系统管理闭环

岗位/用户组闭环属于 frontend-only 演示和外部 API 契约边界；历史全栈计划仅作历史参考，不表示当前仓库内置后端。

- 岗位管理：默认菜单包含 `/positions`，支持本地岗位列表、新建、编辑、删除。
- 用户组管理：默认菜单包含 `/user-groups`，支持本地用户组列表、新建、编辑、删除和成员更新。
- 数据范围：角色表单支持 `ALL`、`DEPT`、`DEPT_AND_CHILDREN`、`SELF`、`CUSTOM` 的配置和提交。

数据范围的真实过滤、跨租户隔离和接口级权限拒绝不属于 Demo Mock 能力，必须由接入方外部 API 兜底。
