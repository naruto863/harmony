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

## v1.0 默认启用页面接口

v1.0 默认启用页面的接口契约以当前 `src/services/*` 调用为准。仓库只提供前端服务层、页面状态和 Demo Mock，不提供这些接口的服务端实现。

分页接口建议在 envelope 的 `data` 中返回：

```json
{
  "list": [],
  "total": 0,
  "page": 1,
  "size": 20
}
```

前端会把 `size` 归一为页面状态里的 `pageSize`。列表接口建议支持 `page` 从 1 开始，`size` 上限由外部 API 控制；当前前端服务层会把常见列表请求限制在 1 到 100 之间。

默认错误处理规则：

- `401`：需要兼容 `POST /api/auth/refresh` 的刷新凭证流程；刷新失败后前端清理 token 并触发登出。
- `403`：表示外部 API 已拒绝越权访问；前端只做展示级菜单和按钮控制，不能替代真实授权。
- `422`：字段错误放入 `data.fieldErrors`，结构为 `{ "field": ["message"] }`。
- `500-599`：前端展示通用错误信息；如响应体或 `X-Trace-Id` 响应头包含 `traceId`，前端会保留用于排障。

### 用户管理

权限码建议：

- `users.read`
- `users.create`
- `users.update`
- `users.delete`

接口：

- `GET /api/users?tenantId={tenantId}&page={page}&size={size}&search={search}&status={status}&roleId={roleId}`：返回用户分页，`data` 使用 `list/total/page/size`。
- `POST /api/users?tenantId={tenantId}`：创建或邀请用户，请求体字段为 `email`、`name`、`phone`、`roleId`、`deptId`；响应可返回 `{ user, temporaryPassword, passwordChangeRequired }`。
- `POST /api/users/{userId}/password-reset?tenantId={tenantId}`：重置用户密码，响应结构同创建用户。
- `PUT /api/users/{userId}?tenantId={tenantId}`：更新用户资料、状态、角色或部门。
- `PATCH /api/users/{userId}/status`：更新用户状态，请求体为 `{ "status": "active|inactive|pending" }`。
- `DELETE /api/users/{userId}?tenantId={tenantId}`：从当前租户移除用户。
- `PUT /api/users/me`：更新当前用户资料，当前前端提交 `name`、`phone`、`avatar`。
- `POST /api/users/me/password`：更新当前用户密码，当前前端提交 `currentPassword`、`newPassword`。

外部 API 必须校验 `tenantId`、成员关系、角色分配权限和跨租户访问；前端传入的 `tenantId` 不能作为安全边界。

### 角色、权限与数据范围

权限码建议：

- `roles.read`
- `roles.create`
- `roles.update`
- `roles.delete`
- `tenant.manage`：用于租户设置和成员治理。

接口：

- `GET /api/roles?tenantId={tenantId}&search={search}`：返回角色列表。
- `GET /api/roles/mine`：返回当前用户在当前租户下的角色，可返回 `null`。
- `POST /api/roles?tenantId={tenantId}`：创建角色，请求体字段为 `name`、`code`、`description`、`permissionIds`、`dataScopeType`、`dataScopeDeptIds`。
- `PUT /api/roles/{roleId}`：更新角色，请求体字段为 `name`、`description`、`permissionIds`、`dataScopeType`、`dataScopeDeptIds`。
- `DELETE /api/roles/{roleId}`：删除角色。
- `GET /api/permissions`：返回权限码列表。
- `GET /api/permissions/groups`：返回权限分组，前端角色表单会用于权限矩阵展示。

`dataScopeType` 可选值为 `ALL`、`DEPT`、`DEPT_AND_CHILDREN`、`SELF`、`CUSTOM`；`CUSTOM` 需要配合 `dataScopeDeptIds`。真实数据过滤、越权拒绝和跨租户隔离必须由外部 API 执行。

### 菜单管理

接口：

- `GET /api/menus/tree?tenantId={tenantId}`：返回当前租户可访问菜单树。前端期望菜单项至少包含 `id`、`label`、`icon`，可选 `path`、`permission`、`children`、`parentId`、`type`、`sortOrder`、`visible`。
- `POST /api/menus`：创建菜单，请求体字段为 `name`、`path`、`parentId`、`icon`、`type`、`sortOrder`、`visible`、`permissionCode`。
- `PUT /api/menus/{menuId}`：更新菜单，请求体字段同创建菜单。
- `DELETE /api/menus/{menuId}`：删除菜单。

菜单路由只会渲染前端 `ROUTE_COMPONENTS` 中存在的页面；外部 API 返回未知路由时，前端不会自动生成新页面。

### 字典管理

接口：

- `GET /api/dicts/groups?includeItems={true|false}`：返回字典分组，`includeItems=true` 时可内联 `items`。
- `POST /api/dicts/groups`：创建字典分组，请求体字段为 `groupKey`、`groupName`、`status`。
- `PUT /api/dicts/groups/{groupId}`：更新字典分组，请求体字段为 `groupName`、`status`。
- `DELETE /api/dicts/groups/{groupId}`：删除字典分组。
- `GET /api/dicts/items?groupKey={groupKey}&groupId={groupId}`：返回字典项。
- `POST /api/dicts/items`：创建字典项，请求体字段为 `groupId`、`itemKey`、`itemValue`、`status`、`sortOrder`。
- `PUT /api/dicts/items/{itemId}`：更新字典项，请求体字段为 `itemKey`、`itemValue`、`status`、`sortOrder`。
- `DELETE /api/dicts/items/{itemId}`：删除字典项。

### 参数配置

权限码建议：

- `settings.read`
- `settings.update`

接口：

- `GET /api/configs?env={env}`：返回参数配置列表。
- `POST /api/configs`：创建参数，请求体字段为 `configKey`、`configValue`、`env`、`type`、`status`、`sensitive`、`validationRule`。
- `PUT /api/configs/{configId}`：更新参数，请求体字段为 `configValue`、`env`、`type`、`status`、`sensitive`、`validationRule`。
- `DELETE /api/configs/{configId}`：删除参数。

外部 API 不应把生产密钥、token 或真实敏感配置写入 Demo 数据；`sensitive=true` 的值应在服务端和前端展示层同时谨慎处理。

### 组织管理

接口：

- `GET /api/depts/tree`：返回组织树，节点字段为 `id`、`name`、`parentId`、`sortOrder`、`status`、`children`。
- `POST /api/depts`：创建组织，请求体字段为 `name`、`parentId`、`sortOrder`、`status`。
- `PUT /api/depts/{deptId}`：更新组织，请求体字段同创建组织。
- `DELETE /api/depts/{deptId}`：删除组织。

组织树会被岗位、用户、角色数据范围等页面复用；真实数据范围过滤仍由外部 API 兜底。

### 审计日志与登录日志

权限码建议：

- `audit.read`

接口：

- `GET /api/audit-logs?tenantId={tenantId}&page={page}&size={size}&search={search}&action={action}&resource={resource}&userId={userId}&startDate={startDate}&endDate={endDate}`：返回审计日志分页，`data` 使用 `list/total/page/size`。
- `GET /api/login-logs?page={page}&size={size}&status={status}&userId={userId}&tenantId={tenantId}`：返回登录日志分页，`data` 使用 `list/total/page/size`。

`AuditLog` 建议包含 `id`、`userId`、`userName`、`tenantId`、`action`、`resource`、`resourceId`、`result`、`failureReason`、`traceId`、`durationMs`、`details`、`ipAddress`、`userAgent`、`createdAt`。当前前端审计导出是基于已查询数据生成 CSV，不要求额外的服务端导出接口。

### 文件中心

权限码建议：

- `files.read`
- `files.create`
- `files.delete`

接口：

- `GET /api/files?tenantId={tenantId}&parentId={parentId}&page={page}&size={size}&search={search}&type={type}`：返回文件分页，`data` 使用 `list/total/page/size`。
- `GET /api/files/upload-policy?tenantId={tenantId}&parentId={parentId}`：返回上传大小、类型、数量、剩余配额和存储策略说明。
- `POST /api/files/upload?tenantId={tenantId}&parentId={parentId}`：上传文件，返回文件记录。
- `POST /api/files/folders?tenantId={tenantId}`：创建文件夹，请求体字段为 `name`、`parentId`。
- `GET /api/files/{fileId}/download-url`：返回鉴权后的短期下载 URL。
- `GET /api/files/{fileId}/preview-url`：返回鉴权后的短期预览 URL，或返回不可预览原因。
- `DELETE /api/files/{fileId}`：删除文件或文件夹。

对象存储签名、病毒扫描、内容审核、配额计算和真实存储适配均由外部 API 完成，前端不得依赖文件记录中的裸 URL 作为生产下载入口。当前前端尚未实现文件重命名、移动和按 ID 查询的真实 API 调用。

### 消息中心

接口：

- `GET /api/notices`：返回通知列表。
- `POST /api/notices`：创建站内通知，请求体字段为 `title`、`content`、`category`、`type`、`channel`、`priority`、`link`。
- `POST /api/notices/{noticeId}/read`：标记通知已读。
- `POST /api/notices/{noticeId}/star`：切换星标状态。
- `POST /api/notices/{noticeId}/archive`：归档通知。
- `DELETE /api/notices/{noticeId}`：删除当前用户视角下的通知。
- `GET /api/notices/templates`：返回公告模板列表。
- `POST /api/notices/templates`：创建公告模板。
- `PUT /api/notices/templates/{templateId}`：更新公告模板。
- `DELETE /api/notices/templates/{templateId}`：删除公告模板。
- `GET /api/notices/{noticeId}/read-stats`：返回公告已读、未读、阅读率和未读成员摘要。

邮件、短信、站外推送和消息队列不属于本仓库实现；当前邮件页面相关数据是前端本地演示。

### 租户设置与会话

接口：

- `GET /api/tenants/mine`：返回当前用户可切换的租户列表。
- `POST /api/tenants/switch`：切换租户，请求体为 `{ "tenantId": "tenant_1" }`，响应返回新的 access token、refresh token 和租户信息。
- `GET /api/tenants`：返回当前用户可管理或可访问的租户列表。
- `PUT /api/tenants/{tenantId}`：更新租户资料，当前前端提交 `name`。
- `DELETE /api/tenants/{tenantId}`：删除租户。
- `GET /api/tenants/{tenantId}/members`：返回租户成员、角色和管理员标记。
- `POST /api/tenants/{tenantId}/members`：新增或邀请成员，请求体字段为 `email`、`userId`、`roleId`、`isAdmin`。
- `PUT /api/tenants/{tenantId}/members/{userId}`：调整成员角色、状态或管理员标记。
- `DELETE /api/tenants/{tenantId}/members/{userId}`：移除成员。
- `GET /api/sessions?userId={userId}`：返回当前用户会话列表，前端会从 `userAgent` 解析设备、浏览器和系统。
- `DELETE /api/sessions/{sessionId}`：终止指定会话。
- `DELETE /api/sessions/others`：终止其他会话，响应可返回终止数量。

外部 API 必须执行真实租户隔离、成员授权、会话吊销和安全审计；前端只负责展示和提交。

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

## v1.5 任务调度接口

任务调度能力是 v1.5 长期增强模块。仓库只提供前端页面、服务层调用、Demo 样例和权限码约定，不实现调度器、Worker、分布式锁、执行日志采集或告警投递。

`SchedulerJob` 建议字段：

```json
{
  "id": "job_billing_sync",
  "name": "账单同步",
  "status": "enabled",
  "triggerType": "cron",
  "triggerExpression": "0 */15 * * * ?",
  "ownerName": "运营团队",
  "lastResult": "success",
  "lastRunAt": "2026-06-14T08:00:00Z",
  "nextRunAt": "2026-06-14T08:15:00Z",
  "alertEnabled": true
}
```

`SchedulerExecution` 建议字段：

```json
{
  "id": "exec_1",
  "jobId": "job_billing_sync",
  "jobName": "账单同步",
  "status": "failed",
  "startedAt": "2026-06-14T08:00:00Z",
  "finishedAt": "2026-06-14T08:01:00Z",
  "durationMs": 60000,
  "traceId": "trace-exec-1",
  "errorSummary": "外部 API 超时",
  "retryable": true
}
```

接口：

- `GET /api/scheduler/jobs?tenantId={tenantId}&page={page}&size={size}&status={status}&search={search}`：返回任务定义分页，`data` 使用 `list/total/page/size`。
- `POST /api/scheduler/jobs`：创建任务定义；真实调度参数校验、表达式合法性和冲突检查由外部 API 负责。
- `PUT /api/scheduler/jobs/{jobId}`：更新任务定义。
- `PATCH /api/scheduler/jobs/{jobId}/status`：启用、停用或暂停任务。
- `POST /api/scheduler/jobs/{jobId}/run-once`：请求外部 API 立即执行一次任务，请求体可包含 `tenantId` 和 `reason`。
- `GET /api/scheduler/executions?tenantId={tenantId}&page={page}&size={size}&status={status}&jobId={jobId}`：返回执行日志分页，`data` 使用 `list/total/page/size`。
- `GET /api/scheduler/executions/{executionId}`：返回单次执行详情。
- `POST /api/scheduler/executions/{executionId}/retry`：请求外部 API 重试失败或可重试执行，请求体可包含 `tenantId` 和 `reason`。

写操作建议返回：

```json
{
  "accepted": true,
  "traceId": "trace-command"
}
```

外部 API 必须校验当前用户是否具备对应权限，记录立即执行和重试的审计日志，并负责并发控制、任务幂等、失败重试策略和告警投递。前端的按钮权限和菜单权限只做展示级控制。

## v1.5 监控告警接口

监控告警能力是 v1.5 长期增强模块。仓库只提供前端页面、服务层调用、Demo 样例和权限码约定，不实现 Prometheus、APM、日志采集器、健康检查服务或告警引擎。

`MonitoringHealthSummary` 建议字段：

```json
{
  "overallStatus": "degraded",
  "generatedAt": "2026-06-14T09:00:00Z",
  "services": [
    {
      "id": "api-gateway",
      "name": "API 网关",
      "status": "healthy",
      "latencyMs": 32,
      "errorRate": 0.01,
      "traceId": "trace-health-api"
    }
  ],
  "latency": [
    { "path": "/api/users", "p95Ms": 120, "avgMs": 48, "samples": 260 }
  ],
  "errorRates": [
    { "path": "/api/files/upload", "rate": 0.03, "count": 3, "window": "5m" }
  ]
}
```

`MonitoringAlert` 建议字段：

```json
{
  "id": "alert_1",
  "title": "错误率升高",
  "severity": "critical",
  "status": "open",
  "source": "api-gateway",
  "triggeredAt": "2026-06-14T09:00:00Z",
  "traceId": "trace-alert-1",
  "description": "错误率超过阈值"
}
```

接口：

- `GET /api/monitoring/health?tenantId={tenantId}`：返回服务健康、接口耗时和错误率聚合结果。
- `GET /api/monitoring/services?tenantId={tenantId}`：返回服务实例或依赖状态列表。
- `GET /api/monitoring/api-latency?tenantId={tenantId}`：返回接口耗时聚合指标。
- `GET /api/monitoring/error-rates?tenantId={tenantId}`：返回错误率聚合指标。
- `GET /api/monitoring/alert-rules?tenantId={tenantId}`：返回告警规则列表。
- `POST /api/monitoring/alert-rules`：创建告警规则。
- `PUT /api/monitoring/alert-rules/{ruleId}`：更新告警规则。
- `DELETE /api/monitoring/alert-rules/{ruleId}`：删除告警规则。
- `GET /api/monitoring/alerts?tenantId={tenantId}&page={page}&size={size}&status={status}&severity={severity}`：返回告警历史分页，`data` 使用 `list/total/page/size`。
- `POST /api/monitoring/alerts/{alertId}/ack`：确认告警，请求体可包含 `tenantId` 和 `note`。
- `POST /api/monitoring/alerts/{alertId}/resolve`：解决告警，请求体可包含 `tenantId` 和 `note`。
- `POST /api/monitoring/alerts/{alertId}/silence`：静默告警，请求体可包含 `tenantId` 和 `note`。

外部 API 必须负责指标采集、健康判定、告警触发、通知投递、确认/解决/静默审计和访问控制。前端只展示聚合结果并发起受控管理请求，不能替代真实监控平台或接口级授权。

## v1.5 模块清单接口

模块清单能力是 v1.5 长期增强模块。仓库只定义 compile-time 或配置型 `ModuleManifest`，用于校验路由、菜单、权限、字典、审计事件、功能开关、API 前缀和 Demo 边界；不实现远程插件 marketplace，不加载远程 JS、CSS 或 React 组件。

`ModuleManifest` 建议字段：

```json
{
  "key": "scheduler",
  "name": "任务调度",
  "version": "1.5.0",
  "routes": [{ "path": "/scheduler/jobs", "label": "任务定义" }],
  "menuItems": [{ "id": "scheduler-jobs", "label": "任务定义", "path": "/scheduler/jobs", "permission": "scheduler.jobs.read" }],
  "permissions": ["scheduler.jobs.read", "scheduler.jobs.execute"],
  "dictGroups": [],
  "auditEvents": ["scheduler.jobs.run-once"],
  "featureFlag": "scheduler.enabled",
  "apiPrefixes": ["/api/scheduler"],
  "demoBoundary": "Demo 只展示任务定义和执行日志样例，不执行真实任务。",
  "remoteRuntime": false
}
```

接口：

- `GET /api/modules`：返回当前租户或部署环境可用模块清单。
- `GET /api/modules/{moduleKey}`：返回单个模块 manifest。
- `PATCH /api/modules/{moduleKey}/status`：更新模块启停状态；真实强制执行由外部 API 或部署配置完成。

约束：

- `routes[].path` 必须已在前端 `ROUTE_COMPONENTS` 白名单中声明。
- `menuItems[].permission` 必须进入 manifest 权限集合和公开权限码文档。
- `apiPrefixes[]` 只能描述外部 API 前缀，不能绕过统一 `apiClient` 和服务层。
- `remoteRuntime` 必须默认为 `false`；运行时远程插件、远程 JS 和第三方插件市场不属于本仓库默认能力。

## v1.5 工作流与动态表单接口

工作流与动态表单能力是 v1.5 长期增强模块。仓库只提供前端模板、服务层调用、字段白名单和 Demo 样例，不实现流程引擎、节点权限引擎、会签、抄送、超时任务或表单运行时后端。

接口：

- `GET /api/workflows/definitions?tenantId={tenantId}`：返回流程定义列表。
- `POST /api/workflows/definitions`：创建流程定义。
- `PUT /api/workflows/definitions/{definitionId}`：更新流程定义。
- `GET /api/workflows/instances?tenantId={tenantId}&page={page}&size={size}&status={status}`：返回流程实例分页，`data` 使用 `list/total/page/size`。
- `POST /api/workflows/instances`：发起流程实例，请求体包含 `definitionId`、`tenantId`、`title` 和 `formData`。
- `POST /api/workflows/tasks/{taskId}/approve`：审批流程任务。
- `POST /api/workflows/tasks/{taskId}/reject`：驳回流程任务。
- `GET /api/dynamic-forms/schemas?tenantId={tenantId}`：返回动态表单 schema 列表。
- `POST /api/dynamic-forms/schemas`：创建动态表单 schema。
- `PUT /api/dynamic-forms/schemas/{schemaId}`：更新动态表单 schema。
- `POST /api/dynamic-forms/schemas/{schemaId}/preview`：预览动态表单渲染结果。

动态表单字段类型白名单：

```text
text, textarea, number, select, date, switch, upload, user-picker, dept-picker
```

字段联动只能使用受限配置表达式，不能执行任意 JavaScript、访问 `window`/`document`、读取 token 或调用远程脚本。表单提交错误继续使用 `422 fieldErrors`，例如：

```json
{
  "code": 422,
  "message": "参数校验失败",
  "data": {
    "fieldErrors": {
      "days": ["请假天数必须大于 0"]
    }
  },
  "traceId": "trace-workflow-form"
}
```

流程执行、节点权限、会签、历史真实性、表单数据持久化和附件处理必须由外部 API 或工作流平台负责。前端权限只做展示级控制。

## v1.5 数据维护与 SaaS 扩展接口

数据维护与 SaaS 扩展能力是 v1.5 长期增强模块。仓库只提供前端受控入口、服务层调用、Demo 样例和权限码约定，不实现 SQL 控制台、任意缓存 key 删除、支付账单、计量后端或真实配额强制执行。

### 数据维护资源

维护资源由外部 API 预注册，前端只能读取资源清单并提交受控命令：

- `GET /api/maintenance/resources?tenantId={tenantId}&page={page}&size={size}&type={type}`：返回维护资源分页，`data` 使用 `list/total/page/size`。
- `POST /api/maintenance/resources/{resourceId}/refresh`：刷新受控资源，请求体包含 `tenantId`、`reason` 和 `confirmationText`。
- `POST /api/maintenance/cache/{resourceId}/clear`：清理预注册缓存资源。
- `POST /api/maintenance/reference-data/{resourceId}/sync`：同步基础数据、地区或行业分类。

维护资源示例：

```json
{
  "id": "cache_menu_tree",
  "name": "菜单树缓存",
  "type": "cache",
  "status": "healthy",
  "scope": "tenant",
  "auditRequired": true,
  "allowedOperations": ["refresh", "clear"]
}
```

前端不得提交任意 SQL、任意脚本或任意缓存 key。危险操作必须同时满足权限、二次确认和 external API 审计留痕。

### SaaS 套餐与配额

- `GET /api/saas/plans?tenantId={tenantId}`：返回套餐、模块可用性和审计留存周期。
- `GET /api/saas/quotas?tenantId={tenantId}`：返回配额使用情况，配额强制执行由 external API 完成。
- `POST /api/saas/modules/{moduleCode}/toggle`：请求启停模块，请求体包含 `tenantId`、`enabled`、`reason` 和 `confirmationText`。

SaaS 配额示例：

```json
{
  "key": "members",
  "label": "成员数",
  "used": 8,
  "limit": 50,
  "unit": "人",
  "enforcedBy": "external-api"
}
```

套餐、配额、模块启停和审计留存周期在前端只做展示和受控命令提交；真实计费、套餐变更、配额拒绝和审计保留策略必须由外部 API 或 SaaS 平台执行。

## 权限码

v1.0 当前 Demo 数据、菜单和服务层使用以下权限码。新增业务模块应继续优先采用 `<resource>.<action>` 形式。

| 资源 | 权限码 | 当前用途 |
| --- | --- | --- |
| 用户 | `users.create`、`users.read`、`users.update`、`users.delete` | 用户管理菜单、按钮和用户服务 |
| 角色 | `roles.create`、`roles.read`、`roles.update`、`roles.delete` | 角色权限菜单、角色表单和权限矩阵 |
| 项目 | `projects.create`、`projects.read`、`projects.update`、`projects.delete` | Demo 项目管理入口和示例数据 |
| 文件 | `files.create`、`files.read`、`files.delete` | 文件中心上传、查看、删除入口 |
| 审计 | `audit.read` | 审计日志和登录日志查看入口 |
| 设置 | `settings.read`、`settings.update` | 系统配置、参数、菜单、字典、组织和功能开关等管理入口 |
| 租户 | `tenant.manage` | 租户设置和成员治理入口 |
| 岗位 | `positions.create`、`positions.read`、`positions.update`、`positions.delete` | 岗位管理入口和按钮 |
| 用户组 | `user-groups.create`、`user-groups.read`、`user-groups.update`、`user-groups.delete` | 用户组管理入口和按钮 |
| 任务调度 | `scheduler.jobs.read`、`scheduler.jobs.execute`、`scheduler.executions.read`、`scheduler.executions.retry` | 任务定义、立即执行、执行日志和失败重试入口 |
| 监控告警 | `monitoring.health.read`、`monitoring.metrics.read`、`monitoring.alerts.read`、`monitoring.alerts.manage`、`monitoring.alert-rules.manage` | 健康状态、指标、告警历史和告警规则管理入口 |
| 模块清单 | `modules.read`、`modules.manage` | ModuleManifest 清单、校验和模块启停入口 |
| 工作流 | `workflows.definitions.read`、`workflows.instances.read`、`workflows.instances.start`、`workflows.tasks.approve`、`workflows.tasks.reject` | 流程定义、流程实例、发起流程和审批任务入口 |
| 动态表单 | `forms.schemas.read`、`forms.schemas.preview` | 动态表单 schema 和预览入口 |
| 数据维护 | `maintenance.resources.read`、`maintenance.cache.clear`、`maintenance.reference-data.sync` | 维护资源清单、受控缓存清理和基础数据同步入口 |
| SaaS 扩展 | `saas.plans.read`、`saas.quotas.read`、`saas.modules.toggle` | 套餐、配额、模块启停和审计留存入口 |

按钮和菜单可见性由前端使用这些权限码做展示级控制；外部 API 必须在接口层做真实授权、租户隔离、数据范围过滤和越权拒绝。前端角色表单提交的 `dataScopeType` 与 `dataScopeDeptIds` 只表示配置意图，不表示前端已经完成真实数据授权。

## OpenAPI

仓库不生成也不托管外部 API 的权威 OpenAPI 文档。接入真实 API 时，建议使用方提供 OpenAPI/Swagger 或等价接口文档，并保持接口路径、鉴权方式、错误码和分页结构稳定。

v1.5 提供 `/developer/openapi` 作为纯前端草稿辅助入口，用于从接入方粘贴的 OpenAPI/Swagger JSON 中生成以下预览建议：

- route 草稿，例如 `/orders`。
- `developer.openapi.*` 或业务模块自己的 `<module>.<action>` 权限码建议。
- 菜单草稿和模块 key 建议。
- service 方法草稿，例如 `listOrders`、`createOrder`、`updateOrder`、`deleteOrder`。
- API 契约差异提醒和敏感信息脱敏提醒。

该能力默认遵守以下边界：

- 只生成草稿预览，不自动写入文件。
- 不执行远程 schema 中携带的脚本或示例代码。
- 不默认引入 OpenAPI codegen 重型依赖。
- 不把生成结果直接视为生产可用实现。
- 如果 OpenAPI `servers.url`、示例请求体或描述中包含真实内网地址、密钥、账号、手机号、邮箱等敏感信息，接入方必须先脱敏再用于公开文档或 Demo。
