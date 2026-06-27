# 人工验收清单

更新时间：2026-06-14

## 待人工确认

- UI 视觉细节：页面布局、间距、颜色、响应式表现是否符合产品预期。
- 演示模式：三个演示账号均可登录，租户选择和 Dashboard 可正常显示。
- 真实 API 模式：`VITE_ENABLE_DEMO_MOCKS=false` 后，请求会指向配置的 `VITE_API_BASE_URL`。
- 多浏览器/真机体验：Chrome、Edge、移动端或目标设备上的交互表现。
- 线上环境配置：生产 API 地址、CORS、CSP、缓存策略和静态资源托管方式。
- 产品歧义项：状态流转、删除限制、审计字段含义、异常提示文案。
- 依赖环境：npm registry/代理是否允许执行 `npm ci` 和 `npm audit`。

## v1.0 待人工验收

- 干净 clone：在新目录执行 `npm ci` 后可完成本地安装。
- 自动验证：人工复核 `npm run lint`、`npm run typecheck`、`npm run test`、`npm run build`、`npm run security:audit` 在目标环境中的结果。
- 演示账号：确认 `admin@example.com`、`manager@example.com`、`viewer@example.com` 登录、租户选择、Dashboard、菜单和权限展示符合预期。
- Demo 边界：确认默认 `.env.example` 可进入 Demo Mock，且 `VITE_ENABLE_DEMO_MOCKS=false` 时不继续使用演示登录数据。
- Frontend-only 边界：确认 Docker Compose、README、CONTRIBUTING、SECURITY、PR 模板和 Release 流程均不要求仓库内置后端、数据库或 Java/Maven 环境。
- 安全扫描：发布前人工复核仓库未暴露真实密钥、真实账号、Cookie、Token、内部 URL 或私有基础设施信息。

## v0.5 现有闭环验收

- Demo 模式：确认 `VITE_ENABLE_DEMO_MOCKS=true` 时，使用 `admin@example.com / local-demo-admin` 可登录并看到岗位管理和用户组管理菜单。
- 岗位管理：进入 `/positions`，确认默认岗位列表可见；新建、编辑、删除岗位后页面数据能更新。
- 岗位部门：新建岗位时确认所属部门下拉可显示 Demo 组织树。
- 用户组管理：进入 `/user-groups`，确认默认用户组列表可见；新建、编辑、删除用户组后页面数据能更新。
- 用户组成员：打开成员弹窗，确认可看到当前租户演示用户，并能保存成员勾选。
- 数据范围：进入角色表单，确认 `ALL`、`DEPT`、`DEPT_AND_CHILDREN`、`SELF`、`CUSTOM` 均可选择；`CUSTOM` 时可选择部门。
- 菜单权限：确认岗位和用户组菜单分别使用 `positions.read`、`user-groups.read`；按钮权限使用对应 create/update/delete 权限码。
- 真实 API 模式：确认 `VITE_ENABLE_DEMO_MOCKS=false` 后，岗位、用户组、组织树和用户列表请求指向 `VITE_API_BASE_URL` 配置的外部 API。
- 文档口径：确认对外文档仍描述为纯前端项目，未把 Demo Mock 写成生产服务端实现。

## v0.6 待人工验收

- 真实 API 错误：关闭 Demo Mock 后，分别模拟缺接口、401、403、422 和 5xx，确认页面提示清晰，5xx 可看到或记录 `traceId`。
- 登录认证：确认 `/api/auth/captcha` 可控制验证码展示；找回密码、重置密码、SSO provider 和 SSO callback 能处理成功、失败、缺少 code/state 和外部 API 错误。
- 租户治理：进入 `/settings/tenant`，确认租户列表、成员列表、管理员标记、角色调整和成员移除请求均指向 `/api/tenants` 与 `/api/tenants/{tenantId}/members` 系列接口。
- 公告通知：进入消息中心，确认公告模板可创建、编辑、删除；公告详情可展示 `/api/notices/{noticeId}/read-stats` 返回的已读、未读和阅读率。
- 导入导出：创建导入或导出任务后，确认任务列表可筛选和刷新；失败任务可调用 `/api/import-export/tasks/{taskId}/error-report`，失败任务可重试，排队或运行中任务可取消。
- 文件中心：确认上传弹窗展示 `/api/files/upload-policy` 返回的大小、类型、数量、配额和存储策略；下载通过 `/api/files/{fileId}/download-url`，预览通过 `/api/files/{fileId}/preview-url`。
- CRUD 状态：确认 `DataTable` 在加载、无数据、搜索无结果、无权限、接口不可用、字段错误、批量部分失败和列配置变化时表现符合产品预期。
- Demo 边界：确认 Demo Mock 只作为预览路径，没有把 SSO、邮件短信、对象存储、导入导出 Worker 或服务端权限写成仓库内置能力。

## v1.5 待人工验收

- 任务调度：进入 `/scheduler/jobs` 与 `/scheduler/executions`，确认任务定义、执行日志、失败重试和立即执行入口符合权限、二次确认和 external API 审计边界。
- 监控告警：进入 `/monitoring/health` 与 `/monitoring/alerts`，确认健康状态、接口耗时、错误率、告警历史和 TraceId 展示来自 external API 或 Demo Mock，不包含敏感请求体或 token。
- OpenAPI 辅助：进入 `/developer/openapi`，确认只能生成 route、permission、menu 和 service 草稿预览，不写入源码、不执行远程脚本，敏感 OpenAPI/Swagger 示例已脱敏。
- ModuleManifest：进入 `/modules`，确认只展示 compile-time/配置型 manifest，不支持远程插件 marketplace、远程 JS/CSS 或远程 React 组件加载。
- 工作流与动态表单：进入 `/workflows` 与 `/dynamic-forms`，确认字段类型白名单、字段联动限制和 `fieldErrors` 口径正确；审批执行、节点权限和历史真实性仍由 external API 负责。
- 数据维护：进入 `/maintenance/cache`，确认只展示预注册维护资源，不存在 SQL 控制台、任意脚本或任意缓存 key 删除入口。
- 危险操作：确认缓存清理和基础数据同步需要权限、二次确认、原因字段和 external API 审计兜底；Demo 模式不得执行真实写操作。
- SaaS 扩展：进入 `/saas/plans`，确认套餐、配额、模块启停和审计留存只作为 external API 返回结果展示，真实强制执行不在前端完成。
- 权限边界：确认 `maintenance.*`、`saas.*` 只控制前端可见性，关闭权限后菜单和按钮隐藏，接口级授权仍由外部 API 验证。
