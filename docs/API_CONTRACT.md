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

## OpenAPI

仓库不生成也不托管 OpenAPI 文档。接入真实 API 时，建议使用方提供 OpenAPI/Swagger 或等价接口文档，并保持接口路径、鉴权方式、错误码和分页结构稳定。
