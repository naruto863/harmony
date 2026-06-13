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

## v0.6 真实 API 接入强化接口

v0.6 继续保持 frontend-only + external API 边界：仓库只提供前端调用、状态展示和 Demo Mock，不提供身份源、对象存储、邮件短信、异步 Worker 或服务端实现。

### 认证强化

- `GET /api/auth/captcha`：返回登录验证码挑战，可返回 `null` 表示当前租户或环境不要求验证码。
- `POST /api/auth/password-reset/request`：请求找回密码，外部 API 负责发送邮件、短信或其他通知。
- `POST /api/auth/password-reset/confirm`：提交重置 token 与新密码。
- `GET /api/auth/sso/providers`：返回可用 SSO provider 列表。
- `POST /api/auth/sso/start`：返回指定 provider 的授权跳转地址。
- `POST /api/auth/sso/callback`：用 `code/state/providerId` 换取登录响应和 token。

登录请求可额外携带：

```json
{
  "email": "admin@example.com",
  "password": "******",
  "tenantId": "tenant_1",
  "captchaId": "captcha_1",
  "captchaCode": "1234",
  "rememberMe": true
}
```

### 租户治理

- `GET /api/tenants`：返回当前用户可访问租户列表。
- `GET /api/tenants/{tenantId}/members`：返回租户成员、角色和管理员标记。
- `POST /api/tenants/{tenantId}/members`：新增或邀请成员。
- `PUT /api/tenants/{tenantId}/members/{userId}`：调整成员角色、状态或管理员标记。
- `DELETE /api/tenants/{tenantId}/members/{userId}`：移除成员。

外部 API 必须执行真实租户隔离、越权拒绝和管理员变更审计；前端只做展示和提交。

### 公告通知

- `GET /api/notices/templates`：返回公告模板列表。
- `POST /api/notices/templates`：创建公告模板。
- `PUT /api/notices/templates/{templateId}`：更新公告模板。
- `DELETE /api/notices/templates/{templateId}`：删除公告模板。
- `GET /api/notices/{noticeId}/read-stats`：返回公告已读、未读、阅读率和未读成员摘要。

邮件、短信、站外推送和消息队列不属于本仓库实现。

### 导入导出任务

- `GET /api/import-export/tasks?taskType={import|export}&entityType={users|projects|roles}&status={status}`：返回任务列表。
- `GET /api/import-export/tasks/{taskId}`：返回单个任务详情。
- `POST /api/import-export/tasks/export`：创建导出任务。
- `POST /api/import-export/tasks/import`：基于已上传文件创建导入任务。
- `POST /api/import-export/tasks/{taskId}/retry`：重试失败或部分失败任务。
- `POST /api/import-export/tasks/{taskId}/cancel`：取消排队中或运行中任务。
- `GET /api/import-export/tasks/{taskId}/error-report`：返回错误报告短期下载地址。

任务状态建议使用 `pending`、`running`、`completed`、`failed`、`cancelled`。服务端解析、批量写入、回滚和文件生成由接入方实现。

### 文件中心

- `GET /api/files/upload-policy?tenantId={tenantId}&parentId={parentId}`：返回上传大小、类型、数量、剩余配额和存储策略说明。
- `POST /api/files/upload?tenantId={tenantId}&parentId={parentId}`：上传文件，返回文件记录。
- `GET /api/files/{fileId}/download-url`：返回鉴权后的短期下载 URL。
- `GET /api/files/{fileId}/preview-url`：返回鉴权后的短期预览 URL，或返回不可预览原因。

对象存储签名、病毒扫描、内容审核、配额计算和真实存储适配均由外部 API 完成，前端不得依赖文件记录中的裸 URL 作为生产下载入口。

### 422 字段错误

字段级校验错误建议通过 envelope 的 `data.fieldErrors` 返回：

```json
{
  "code": 422,
  "message": "参数校验失败",
  "data": {
    "fieldErrors": {
      "email": ["邮箱格式错误"]
    }
  },
  "traceId": "request-trace-id"
}
```

`apiClient` 会把字段错误转为服务层错误对象的 `fieldErrors`，页面层不直接依赖原始 envelope。

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
