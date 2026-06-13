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
