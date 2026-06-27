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

| 账号 | 密码 | 默认租户角色 | 权限差异 |
| --- | --- | --- | --- |
| `admin@example.com` | `local-demo-admin` | Demo 公司租户管理员 | 可预览用户、角色、菜单、配置、租户设置等管理入口 |
| `manager@example.com` | `local-demo-manager` | Demo 公司经理 | 可预览项目、文件、用户/岗位/用户组只读入口，不具备角色和租户管理权限 |
| `viewer@example.com` | `local-demo-viewer` | Demo 公司查看者 | 只读预览，创建、更新、删除类按钮应被前端隐藏 |

演示账号只用于本地预览权限差异。真实授权、租户隔离、数据范围过滤和越权拒绝必须由外部 API 执行。

## 存储命名空间

Demo-only 可变数据优先使用 `ha_demo:` 前缀，例如 `ha_demo:auth_user_id`、`ha_demo:tenant_id`、`ha_demo:positions`、`ha_demo:user_groups`。当前租户会兼容写入历史键 `admin_studio_tenant`，用于既有上下文读取；核心 token 使用 `src/services/tokenStorage.ts` 集中读写，不由页面组件直接操作。

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

## v0.6 Demo Mock 与真实 API 边界

v0.6 强化的是真实 API 接入体验，不把仓库改回 full-stack。当前仓库仍是 frontend-only 项目；Demo Mock 只保证页面可预览和基础交互可尝试，external API 必须由接入方提供。

- 认证：Demo Mock 可继续使用本地账号登录；验证码、找回密码、SSO provider、SSO callback 的真实身份源、邮件短信发送和授权回调由外部 API 提供。
- 租户治理：Demo Mock 可展示租户和成员治理入口；真实租户隔离、成员邀请、管理员变更审计和越权拒绝由外部 API 提供。
- 公告通知：Demo Mock 可展示公告模板和阅读统计样例；邮件、短信、站外推送和消息队列不属于仓库内置能力。
- 导入导出：Demo Mock 保留轻量 CSV 导入和任务列表样例；服务端解析、批量写入、回滚、任务调度、错误报告生成由外部 API 提供。
- 文件中心：Demo Mock 可展示上传限制、下载和预览接入态；对象存储签名、病毒扫描、内容审核、短期 URL 生成和配额计算由外部 API 提供。
- CRUD 状态：公共组件可展示加载、空态、错误、字段错误和部分失败；真实权限、字段校验和数据一致性由外部 API 兜底。

## v0.5 当前可本地演示的系统管理闭环

岗位/用户组闭环属于 frontend-only 演示和外部 API 契约边界；历史全栈计划仅作历史参考，不表示当前仓库内置后端。

- 岗位管理：默认菜单包含 `/positions`，支持本地岗位列表、新建、编辑、删除。
- 用户组管理：默认菜单包含 `/user-groups`，支持本地用户组列表、新建、编辑、删除和成员更新。
- 数据范围：角色表单支持 `ALL`、`DEPT`、`DEPT_AND_CHILDREN`、`SELF`、`CUSTOM` 的配置和提交。

数据范围的真实过滤、跨租户隔离和接口级权限拒绝不属于 Demo Mock 能力，必须由接入方外部 API 兜底。

## v1.5 任务调度 Demo Mock 与真实 API 边界

任务调度属于 v1.5 长期增强模块。Demo Mock 可展示少量任务定义和执行日志样例，帮助本地预览 `/scheduler/jobs` 与 `/scheduler/executions` 页面；Demo 模式不会执行真实任务、不会创建调度计划，也不会产生权威审计记录。

- 任务定义：Demo Mock 展示任务名称、状态、触发器、负责人、最近结果和下次执行时间。
- 执行日志：Demo Mock 展示状态、耗时、TraceId、错误摘要和可重试标记。
- 立即执行和失败重试：真实执行、并发控制、幂等、日志采集、审计和告警投递均由外部 API 提供；前端只发起受控请求。
- 关闭策略：接入方可通过菜单、`scheduler.*` 权限码或外部 API 能力开关隐藏任务调度入口，不影响 v1.0 核心页面。

## v1.5 监控告警 Demo Mock 与真实 API 边界

监控告警属于 v1.5 长期增强模块。Demo Mock 可展示少量健康状态、接口耗时、错误率和告警历史样例，帮助本地预览 `/monitoring/health` 与 `/monitoring/alerts` 页面；Demo 模式不会采集真实指标、不会判定真实健康状态，也不会投递告警通知。

- 健康状态：Demo Mock 展示外部 API 聚合结果形态，不代表仓库内置健康检查服务。
- 告警历史：Demo Mock 展示告警级别、状态、来源和 TraceId 样例，不代表生产告警记录。
- 告警管理：确认、解决和静默必须由外部 API 执行真实状态变更、权限校验和审计留痕。
- 数据大屏：`/data-screen` 仍是本地演示页面，不能作为生产监控或告警实现。
- 关闭策略：接入方可通过菜单、`monitoring.*` 权限码或外部 API 能力开关隐藏监控告警入口，不影响 v1.0 核心页面。

## v1.5 OpenAPI 辅助 Demo 边界

OpenAPI 辅助属于 v1.5 长期增强模块。Demo Mock 可展示本地示例 schema 和草稿预览结果，帮助预览 `/developer/openapi` 页面；Demo 模式不会联网拉取 schema、不会执行远程脚本，也不会写入源码或文档。

- 草稿范围：route、权限码、菜单项和 service 方法建议。
- 安全边界：外部 OpenAPI/Swagger 文档可能包含真实内网地址、账号、手机号、邮箱、token 或密钥示例，公开前必须脱敏。
- 关闭策略：接入方可通过菜单、`developer.openapi.*` 权限码或功能开关隐藏 OpenAPI 辅助入口，不影响 v1.0 核心页面。

## v1.5 模块清单 Demo 边界

模块清单属于 v1.5 长期增强模块。Demo Mock 可展示内置 `ModuleManifest` 样例和校验结果，帮助预览 `/modules` 页面；Demo 模式不会加载远程插件、不会执行远程 JS，也不会把外部 manifest 自动写入当前应用。

- manifest 范围：路由、菜单、权限、字典、审计事件、功能开关、API 前缀和 Demo 边界。
- 运行时边界：只支持 compile-time 或配置型入口；运行时远程插件、远程 JS/CSS/React 组件和插件市场不属于默认能力。
- 关闭策略：接入方可通过菜单、`modules.*` 权限码或外部 API 能力开关隐藏模块清单入口，不影响 v1.0 核心页面。

## v1.5 工作流与动态表单 Demo 边界

工作流与动态表单属于 v1.5 长期增强模块。Demo Mock 可展示流程定义、流程实例、动态表单字段白名单和 schema 样例，帮助预览 `/workflows` 与 `/dynamic-forms` 页面；Demo 模式不会执行真实审批流、不会持久化表单提交，也不会生成权威流程历史。

- 工作流：流程执行、节点权限、审批历史、会签、抄送和超时处理由外部 API 或工作流平台负责。
- 动态表单：字段类型只允许白名单；字段联动只能使用受限配置，不执行任意 JavaScript。
- 字段错误：真实提交错误继续通过外部 API 的 `422 fieldErrors` 返回。
- 关闭策略：接入方可通过菜单、`workflows.*`、`forms.*` 权限码或外部 API 能力开关隐藏入口，不影响 v1.0 核心页面。

## v1.5 数据维护与 SaaS Demo 边界

数据维护与 SaaS 扩展属于 v1.5 长期增强模块。Demo Mock 可展示受控维护资源、缓存管理、基础数据同步、套餐、配额和审计留存样例，帮助预览 `/maintenance/cache` 与 `/saas/plans` 页面；Demo 模式不会执行真实缓存清理、不会同步真实基础数据，也不会处理支付、账单或真实配额拒绝。

- 数据维护：Demo 只展示预注册资源，不提供 SQL 控制台、任意脚本或任意缓存 key 删除。
- 危险操作：缓存清理、基础数据同步和模块启停在 Demo 中返回禁写结果；真实操作必须由 external API 做权限、二次确认、TraceId 和审计留痕。
- SaaS 扩展：套餐、配额、模块启停和审计留存周期只作为展示数据；真实计费、套餐变更和配额强制执行由外部 SaaS/API 平台完成。
- 关闭策略：接入方可通过菜单、`maintenance.*`、`saas.*` 权限码或外部 API 能力开关隐藏维护与套餐入口，不影响 v1.0 核心页面。
