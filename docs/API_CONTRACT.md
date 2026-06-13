# Harmony Admin 外部 API 契约

Harmony Admin 当前是纯前端仓库，不提供服务端实现。本文件描述前端期望对接的外部 API 形态，便于使用方替换本地演示数据或接入自己的服务。

## 统一响应

所有 JSON API 建议返回统一响应结构：

```json
{
  "code": 0,
  "message": "OK",
  "data": {},
  "traceId": "request-trace-id",
  "timestamp": "2026-05-28T00:00:00Z"
}
```

- `code = 0` 表示成功。
- `400-499` 表示请求、认证或权限错误。
- `500-599` 表示系统错误，前端只展示通用错误信息和 `traceId`。
- 业务错误码由接入方自行扩展，但应保持稳定和可读。

## TraceId

推荐外部 API 接受并透传 `X-Trace-Id` 请求头；未传入时由 API 服务生成。响应头或响应体中包含同一个 `traceId`，前端可在错误提示、反馈和错误上报中保留该值。

## v0.5 系统管理接口

本节接口用于对接当前前端已经具备页面和 Demo 闭环的系统管理能力。仓库只实现前端调用和 Demo Mock，不提供这些接口的服务端实现。

### 岗位管理

`Position` 建议字段：

```json
{
  "id": "position_pm",
  "name": "产品经理",
  "code": "PM",
  "deptId": "dept_product",
  "deptName": "产品部",
  "description": "负责产品规划和需求协同",
  "sortOrder": 10,
  "status": "active"
}
```

接口：

- `GET /api/positions?tenantId={tenantId}`：返回当前租户岗位列表。
- `POST /api/positions?tenantId={tenantId}`：创建岗位。
- `PUT /api/positions/{positionId}`：更新岗位。
- `DELETE /api/positions/{positionId}`：删除岗位。

创建和更新请求体字段：

- `name`：岗位名称，必填。
- `code`：岗位编码，创建时必填，建议租户内唯一。
- `deptId`：所属部门 ID，可为空。
- `description`：岗位描述，可为空。
- `sortOrder`：排序值，可为空。
- `status`：`active` 或 `inactive`。

### 用户组管理

`UserGroup` 建议字段：

```json
{
  "id": "group_product",
  "name": "产品小组",
  "code": "PRODUCT",
  "description": "负责产品规划和需求评审",
  "status": "active",
  "memberCount": 2
}
```

接口：

- `GET /api/user-groups?tenantId={tenantId}`：返回当前租户用户组列表。
- `POST /api/user-groups?tenantId={tenantId}`：创建用户组。
- `PUT /api/user-groups/{groupId}`：更新用户组。
- `DELETE /api/user-groups/{groupId}`：删除用户组。
- `GET /api/user-groups/{groupId}/members`：返回用户组成员 ID 数组。
- `PUT /api/user-groups/{groupId}/members`：更新用户组成员。

成员更新请求体：

```json
{
  "userIds": ["user_admin", "user_manager"]
}
```

外部 API 应校验用户组和成员均属于当前租户；前端只负责展示和提交成员 ID。

### 角色数据范围

前端角色表单会提交以下字段：

```json
{
  "dataScopeType": "CUSTOM",
  "dataScopeDeptIds": ["dept_product", "dept_operations"]
}
```

`DataScopeType` 可选值：

- `ALL`：全部数据。
- `DEPT`：本部门数据。
- `DEPT_AND_CHILDREN`：本部门及下级部门数据。
- `SELF`：本人数据。
- `CUSTOM`：自定义部门数据，配合 `dataScopeDeptIds`。

真实数据过滤、越权拒绝和跨租户隔离必须由外部 API 兜底。前端数据范围只用于配置、展示和提交，不作为安全边界。

## 权限码

v0.5 新增或明确以下权限码：

- `positions.create`
- `positions.read`
- `positions.update`
- `positions.delete`
- `user-groups.create`
- `user-groups.read`
- `user-groups.update`
- `user-groups.delete`

按钮和菜单可见性由前端使用这些权限码做展示级控制；外部 API 必须在接口层做真实授权。

## OpenAPI

仓库不生成也不托管 OpenAPI 文档。接入真实 API 时，建议使用方提供 OpenAPI/Swagger 或等价接口文档，并保持接口路径、鉴权方式、错误码和分页结构稳定。
