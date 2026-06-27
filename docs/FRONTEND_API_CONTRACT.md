# 前端 API 契约与 Token 策略

## API Base URL

- `.env.example` 使用 `VITE_API_BASE_URL=http://localhost:9080` 作为真实 API 接入示例。
- 默认启用 `VITE_ENABLE_DEMO_MOCKS=true`，登录、租户、菜单和权限可直接使用本地演示数据。
- 关闭演示模式时，使用方需要提供兼容 `docs/API_CONTRACT.md` 的外部 API。

## 响应边界

- 外部 API 原始响应 envelope 使用 `ApiEnvelopeResponse<T>`：
  - `code`
  - `message`
  - `data`
  - `traceId`
  - `timestamp`
- `apiClient` 只向业务服务返回 `data`，页面层不直接依赖 envelope。
- 业务服务层历史包装类型保留为 `ApiResponse<T>`，新代码优先使用语义更明确的 `ServiceResult<T>`。
- 本仓库保持 frontend-only + external API：页面和服务层负责发起请求、整理状态和展示反馈，不实现服务端身份源、对象存储、消息队列或导入导出 Worker。

## 错误处理

- `401`：非认证接口会先尝试 refresh token；刷新失败后清理 token 并触发登出事件。
- `403`：普通业务接口触发权限刷新事件；权限和菜单刷新接口自身不会再次触发，避免循环。
- `422`：服务层错误对象保留 `fieldErrors`，表单或 CRUD 公共组件可展示字段级错误；页面层不得直接读取原始 envelope。
- `5xx`：前端展示通用系统错误，不展示服务端异常细节；如响应提供 `traceId`，错误对象会保留并可用于排查。

## CRUD 状态规范

`DataTable` 是业务 CRUD 列表的默认公共表格。接入真实 API 时，页面应优先把服务层结果转换为下列状态，而不是在页面内散落自定义判断：

- 加载态：设置 `isLoading=true`，表格显示统一 loading 行，不同时展示空态。
- 空态：无数据使用 `emptyState.reason="noData"` 或 `emptyMessage`；搜索、筛选导致无结果时由 `DataTable` 根据搜索词和列筛选自动展示“未找到匹配结果”。
- 无权限：页面已确认当前用户不可查看数据时传入 `emptyState.reason="noPermission"`，真实越权兜底仍必须由外部 API 执行。
- 接口不可用：服务层返回 5xx、网络错误或功能接口缺失时传入 `errorState.message`，如有 `traceId` 同步传入 `errorState.traceId`。
- 字段错误：服务层从 422 响应提取 `fieldErrors` 后传入表单组件；列表级批量操作也可把字段错误汇总到 `errorState.fieldErrors`。

列配置规则：

- `Column.key` 必须对应行数据字段或稳定的派生字段，避免使用会随渲染变化的随机 key。
- 可排序列显式设置 `sortable=true`；可筛选列显式设置 `filterable=true` 并提供 `filter.type`。
- 列宽使用 `width`、`minWidth`、`maxWidth` 控制，默认允许列宽调整；重要操作列应保持固定宽度。
- `hidden=true` 只作为初始隐藏状态，用户仍可通过列配置菜单恢复。

批量操作规则：

- 批量操作必须展示已选择数量。
- 危险批量操作仍应在业务页面使用 `ConfirmDialog` 做二次确认。
- 批量服务可返回 `{ successCount, failed }`；`failed` 项会在 `DataTable` 中展示部分失败原因，不能把部分失败吞成全量成功。

## v1.0 默认启用页面服务层入口

默认启用页面必须通过 `src/services/*` 访问外部 API。页面层只消费服务层返回的业务数据、`ApiResponse<T>` 或 `ServiceResult<T>`，不得直接读取 `ApiEnvelopeResponse<T>`。

### 分页与错误对象

当前列表服务统一把外部 API 的分页字段转换为页面状态：

- 外部 API：`data.list`、`data.total`、`data.page`、`data.size`
- 前端服务层：`data`、`meta.total`、`meta.page`、`meta.pageSize`、`meta.totalPages`

服务层错误对象应保留：

- `message`：用户可读错误信息。
- `status`：HTTP 状态码。
- `traceId`：外部 API 响应体或响应头中的 TraceId。
- `fieldErrors`：`422` 字段错误，供表单和 CRUD 组件展示。

### 默认页面服务映射

| 页面/能力 | 服务层 | 外部 API 路径 | 前端权限/边界 |
| --- | --- | --- | --- |
| 用户管理 | `userService` | `GET/POST /api/users`、`PUT/DELETE /api/users/{userId}`、`PATCH /api/users/{userId}/status`、`POST /api/users/{userId}/password-reset` | `users.*` 只控制前端展示，租户隔离和角色授权由外部 API 执行 |
| 角色权限 | `roleService` | `/api/roles`、`/api/roles/mine`、`/api/permissions`、`/api/permissions/groups` | `roles.*`、`dataScopeType`、`dataScopeDeptIds` 由前端提交，真实数据过滤由外部 API 兜底 |
| 菜单管理 | `menuService` | `/api/menus/tree`、`/api/menus`、`/api/menus/{menuId}` | 菜单树驱动动态路由，只渲染前端已声明的路由组件 |
| 字典管理 | `dictService` | `/api/dicts/groups`、`/api/dicts/items` | 字典状态、排序和只读约束由外部 API 校验 |
| 参数配置 | `configService` | `/api/configs`、`/api/configs/{configId}` | `settings.update` 控制前端入口，敏感值不能写入 Demo 数据 |
| 组织管理 | `deptService` | `/api/depts/tree`、`/api/depts`、`/api/depts/{deptId}` | 组织树供用户、岗位和角色数据范围选择复用 |
| 岗位管理 | `positionService` | `/api/positions`、`/api/positions/{positionId}` | v0.5 已补 Demo 与契约，继续使用 `positions.*` |
| 用户组管理 | `userGroupService` | `/api/user-groups`、`/api/user-groups/{groupId}`、`/api/user-groups/{groupId}/members` | v0.5 已补 Demo 与契约，继续使用 `user-groups.*` |
| 审计日志 | `auditLogService` | `/api/audit-logs` | 使用 `list/total/page/size` 分页；前端导出基于已查询数据生成 CSV |
| 登录日志 | `loginLogService` | `/api/login-logs` | 复用 `audit.read` 展示入口，真实日志访问控制由外部 API 执行 |
| 文件中心 | `fileService` | `/api/files`、`/api/files/upload-policy`、`/api/files/upload`、`/api/files/folders`、`/api/files/{fileId}/download-url`、`/api/files/{fileId}/preview-url`、`DELETE /api/files/{fileId}` | 不依赖裸 URL；上传限制、鉴权下载和预览由外部 API 提供 |
| 消息中心 | `notificationService` | `/api/notices`、`/api/notices/{noticeId}/read`、`/api/notices/{noticeId}/star`、`/api/notices/{noticeId}/archive`、`/api/notices/templates`、`/api/notices/{noticeId}/read-stats` | 邮件、短信、站外推送和消息队列不属于仓库实现 |
| 租户设置 | `tenantService`、`settingsService` | `/api/tenants/mine`、`/api/tenants/switch`、`/api/tenants`、`/api/tenants/{tenantId}`、`/api/tenants/{tenantId}/members` | `tenant.manage` 只控制前端入口，真实隔离和成员授权由外部 API 执行 |
| 个人资料与密码 | `settingsService` | `/api/users/me`、`/api/users/me/password`、`/api/files/upload` | avatar 上传复用文件上传入口 |
| 会话管理 | `security/sessionService` | `/api/sessions`、`/api/sessions/{sessionId}`、`/api/sessions/others` | 会话吊销需要外部 API 真实失效 refresh token 或服务端会话 |
| 任务调度 | `schedulerService` | `/api/scheduler/jobs`、`/api/scheduler/jobs/{jobId}/run-once`、`/api/scheduler/executions`、`/api/scheduler/executions/{executionId}/retry` | `scheduler.*` 只控制前端入口；真实调度、并发控制、执行日志、重试和审计由外部 API 执行 |
| 监控告警 | `monitoringService` | `/api/monitoring/health`、`/api/monitoring/alerts`、`/api/monitoring/alerts/{alertId}/ack`、`/api/monitoring/alerts/{alertId}/resolve`、`/api/monitoring/alerts/{alertId}/silence` | `monitoring.*` 只控制前端入口；指标采集、健康判定、告警触发和通知投递由外部监控平台或 API 执行 |
| OpenAPI 辅助 | `openapiDraftService` | 纯前端解析，不访问外部 API | `developer.openapi.*` 只控制草稿预览入口；不写文件、不执行远程脚本、不默认引入 codegen |
| 模块清单 | `module-manifest` | `/api/modules`、`/api/modules/{moduleKey}`、`/api/modules/{moduleKey}/status` | `modules.*` 只控制前端入口；只支持 compile-time/配置型 manifest，不支持运行时远程插件 |
| 工作流/动态表单 | `workflowService`、`dynamicFormService` | `/api/workflows/*`、`/api/dynamic-forms/*` | `workflows.*`、`forms.*` 只控制前端入口；流程执行、节点权限、字段校验和历史真实性由 external API 执行 |
| 数据维护/SaaS | `maintenanceService`、`saasService` | `/api/maintenance/*`、`/api/saas/*` | `maintenance.*`、`saas.*` 只控制前端入口；危险操作、真实配额和审计留存由 external API 执行 |

当前 `settingsService` 的通知偏好和功能开关、`securityService` 的 IP 白名单、登录锁定、异常检测等能力仍以本地存储或前端演示为主；关闭 Demo Mock 后，除非接入方自行提供相应 API，否则不应被描述成生产安全能力。

### v1.5 任务调度服务层入口

任务调度页面使用 `schedulerService` 访问外部 API：

- `getSchedulerJobs`：读取 `/api/scheduler/jobs`，把 `list/total/page/size` 归一为页面使用的 `data/meta`。
- `getSchedulerExecutions`：读取 `/api/scheduler/executions`，保留 `traceId`、错误摘要和可重试标记。
- `runSchedulerJobOnce`：调用 `/api/scheduler/jobs/{jobId}/run-once`，前端只提交受控请求。
- `retrySchedulerExecution`：调用 `/api/scheduler/executions/{executionId}/retry`，真实重试和审计由 external API 负责。

页面层不得直接读取 scheduler 原始 envelope；立即执行和重试入口必须保留权限码、确认步骤、错误提示和 TraceId 传播能力。

### v1.5 监控告警服务层入口

监控告警页面使用 `monitoringService` 访问外部 API：

- `getMonitoringHealth`：读取 `/api/monitoring/health`，展示服务健康、接口耗时、错误率和 TraceId。
- `getMonitoringAlerts`：读取 `/api/monitoring/alerts`，把 `list/total/page/size` 归一为页面使用的 `data/meta`。
- `acknowledgeMonitoringAlert`：调用 `/api/monitoring/alerts/{alertId}/ack`，前端只提交确认请求。
- `resolveMonitoringAlert`：调用 `/api/monitoring/alerts/{alertId}/resolve`，真实状态变更和审计由 external API 负责。
- `silenceMonitoringAlert`：调用 `/api/monitoring/alerts/{alertId}/silence`，静默策略由 external API 校验和执行。

页面层不得把 `src/pages/data-screen/DataScreenPage.tsx` 的演示数据视为生产监控源；真实健康判定、指标采集、告警规则和告警历史必须来自外部 API 或监控平台。

### v1.5 OpenAPI 草稿服务入口

OpenAPI 辅助页面使用 `openapiDraftService` 在浏览器内解析用户粘贴的 OpenAPI/Swagger JSON：

- `buildOpenApiModuleDraft`：生成 route、permission、menu 和 service 方法草稿。
- `writePolicy` 固定为 `preview-only`，表示不写入源码和文档。
- 检测到 `servers.url` 时提示脱敏，避免把真实内网地址或敏感示例带入公开文档。

该能力不替代人工代码评审，也不改变 `apiClient`、服务层、权限守卫和 Demo 边界。后续如果要引入 OpenAPI codegen 或自动写文件，必须单独评估依赖、风险和用户确认。

### v1.5 模块 Manifest 入口

模块清单页面使用 `src/modules/module-manifest.ts` 中的 `ModuleManifest` 和 `validateModuleManifest` 做静态校验：

- 校验 route 是否在 `ROUTE_COMPONENTS` 白名单中声明。
- 校验菜单权限是否进入 manifest 权限集合。
- 校验 API 前缀是否使用 `/api/`。
- 明确拒绝 `remoteRuntime`、`remoteEntry`、运行时远程插件和远程 JS 加载。

如果接入方需要从外部 API 获取 `/api/modules` 清单，也必须把结果映射到本地已声明路由和 service 层，不能让 manifest 绕过权限守卫、token 存储、租户上下文或 `apiClient`。

### v1.5 工作流与动态表单服务层入口

工作流页面使用 `workflowService`，动态表单页面使用 `dynamicFormService`：

- `getWorkflowDefinitions`：读取 `/api/workflows/definitions`。
- `getWorkflowInstances`：读取 `/api/workflows/instances`，把 `list/total/page/size` 归一为页面使用的 `data/meta`。
- `startWorkflowInstance`：调用 `/api/workflows/instances`，前端只提交受控 `formData`。
- `approveWorkflowTask` / `rejectWorkflowTask`：调用 `/api/workflows/tasks/{taskId}/approve|reject`。
- `getDynamicFormSchemas`：读取 `/api/dynamic-forms/schemas`。
- `previewDynamicFormSchema`：调用 `/api/dynamic-forms/schemas/{schemaId}/preview`。
- `validateDynamicFormSchema`：校验字段类型白名单，并拒绝任意 JavaScript 表达式。

动态表单提交错误继续沿用 `422 fieldErrors`；页面层不得直接读取原始 envelope。审批流执行、节点权限、会签、抄送、超时、历史真实性和数据持久化必须由 external API 负责。

### v1.5 数据维护与 SaaS 服务层入口

数据维护页面使用 `maintenanceService` 访问外部 API：

- `getMaintenanceResources`：读取 `/api/maintenance/resources`，把 `list/total/page/size` 归一为页面使用的 `data/meta`。
- `refreshMaintenanceResource`：调用 `/api/maintenance/resources/{resourceId}/refresh`。
- `clearMaintenanceCache`：调用 `/api/maintenance/cache/{resourceId}/clear`，只接受预注册资源 ID，不接收任意缓存 key。
- `syncMaintenanceReferenceData`：调用 `/api/maintenance/reference-data/{resourceId}/sync`。

SaaS 展示和模块启停使用 `saasService`：

- `getSaasPlans`：读取 `/api/saas/plans`，展示套餐、模块和审计留存周期。
- `getSaasQuotaUsage`：读取 `/api/saas/quotas`，展示配额使用量和 `enforcedBy: external-api`。
- `updateSaasModuleToggle`：调用 `/api/saas/modules/{moduleCode}/toggle`，真实套餐、配额和模块启停校验由 external API 完成。

页面层不得提供 SQL 控制台、任意脚本、任意缓存 key 删除、支付账单处理或真实配额强制执行。危险操作必须保留权限码、二次确认、原因字段、TraceId 和 external API 审计边界。

### 权限与数据范围边界

- `PermissionGuard`、`usePermission`、菜单权限和按钮权限只做前端展示级控制，用于减少无权限入口的误触。
- 外部 API 必须执行真实授权、租户隔离、数据范围过滤和越权拒绝；不能因为前端隐藏按钮就放松接口校验。
- 角色表单提交的 `dataScopeType` 与 `dataScopeDeptIds` 只表达配置意图。`CUSTOM` 数据范围会提交部门 ID，其他范围由外部 API 结合当前用户、角色、组织关系解释。
- Demo Mock 中的角色数据范围只用于本地预览，不代表生产数据过滤已经在前端完成。

## v0.6 服务层入口

认证相关入口集中在 `authService`：

- `GET /api/auth/captcha`
- `POST /api/auth/password-reset/request`
- `POST /api/auth/password-reset/confirm`
- `GET /api/auth/sso/providers`
- `POST /api/auth/sso/start`
- `POST /api/auth/sso/callback`

租户治理入口集中在 `tenantService`：

- `GET /api/tenants`
- `GET /api/tenants/{tenantId}/members`
- `POST /api/tenants/{tenantId}/members`
- `PUT /api/tenants/{tenantId}/members/{userId}`
- `DELETE /api/tenants/{tenantId}/members/{userId}`

公告通知入口集中在 `notificationService`：

- `GET /api/notices/templates`
- `POST /api/notices/templates`
- `PUT /api/notices/templates/{templateId}`
- `DELETE /api/notices/templates/{templateId}`
- `GET /api/notices/{noticeId}/read-stats`

导入导出入口集中在 `importExportService`：

- `GET /api/import-export/tasks`
- `POST /api/import-export/tasks/export`
- `POST /api/import-export/tasks/import`
- `POST /api/import-export/tasks/{taskId}/retry`
- `POST /api/import-export/tasks/{taskId}/cancel`
- `GET /api/import-export/tasks/{taskId}/error-report`

文件中心入口集中在 `fileService`：

- `GET /api/files/upload-policy`
- `POST /api/files/upload`
- `GET /api/files/{fileId}/download-url`
- `GET /api/files/{fileId}/preview-url`

Demo Mock 默认可用于预览 UI；关闭 `VITE_ENABLE_DEMO_MOCKS` 后，以上能力依赖使用方提供兼容契约的 external API。

## v0.5 服务层边界

- `positionService`：Demo 模式使用本地岗位数据；真实 API 模式调用 `/api/positions`。
- `userGroupService`：Demo 模式使用本地用户组和成员数据；真实 API 模式调用 `/api/user-groups`。
- `deptService`：Demo 模式提供只读组织树用于岗位所属部门选择；真实 API 模式调用 `/api/depts/tree`。
- `userService`：Demo 模式返回当前租户演示用户，支撑用户组成员弹窗；真实 API 模式调用 `/api/users`。

角色数据范围由前端提交 `dataScopeType` 和 `dataScopeDeptIds`，其中 `DataScopeType` 为 `ALL | DEPT | DEPT_AND_CHILDREN | SELF | CUSTOM`。真实数据过滤和越权兜底必须由外部 API 执行。

## Token 存储策略

当前前端示例短期保留 `localStorage`，但所有 token 读写必须集中在 `src/services/tokenStorage.ts`，页面组件不得直接读取 token。

已明确的风险和边界：

- XSS 后脚本可读取 `localStorage` token。
- 需要配合 CSP、依赖治理、HTML 注入审查和第三方脚本白名单降低风险。
- 真实生产项目建议迁移到 httpOnly Cookie，或内存 Access Token + Refresh Token 轮换。
