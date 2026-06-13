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
