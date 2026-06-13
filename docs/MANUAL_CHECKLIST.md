# 人工验收清单

更新时间：2026-06-13

## 待人工确认

- UI 视觉细节：页面布局、间距、颜色、响应式表现是否符合产品预期。
- 演示模式：三个演示账号均可登录，租户选择和 Dashboard 可正常显示。
- 真实 API 模式：`VITE_ENABLE_DEMO_MOCKS=false` 后，请求会指向配置的 `VITE_API_BASE_URL`。
- 多浏览器/真机体验：Chrome、Edge、移动端或目标设备上的交互表现。
- 线上环境配置：生产 API 地址、CORS、CSP、缓存策略和静态资源托管方式。
- 产品歧义项：状态流转、删除限制、审计字段含义、异常提示文案。
- 依赖环境：npm registry/代理是否允许执行 `npm ci` 和 `npm audit`。

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
