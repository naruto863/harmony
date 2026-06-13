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

## 错误处理

- `401`：非认证接口会先尝试 refresh token；刷新失败后清理 token 并触发登出事件。
- `403`：普通业务接口触发权限刷新事件；权限和菜单刷新接口自身不会再次触发，避免循环。
- `5xx`：前端展示通用系统错误，不展示服务端异常细节；如响应提供 `traceId`，错误对象会保留并可用于排查。

## Token 存储策略

当前前端示例短期保留 `localStorage`，但所有 token 读写必须集中在 `src/services/tokenStorage.ts`，页面组件不得直接读取 token。

已明确的风险和边界：

- XSS 后脚本可读取 `localStorage` token。
- 需要配合 CSP、依赖治理、HTML 注入审查和第三方脚本白名单降低风险。
- 真实生产项目建议迁移到 httpOnly Cookie，或内存 Access Token + Refresh Token 轮换。
