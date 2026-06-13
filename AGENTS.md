# Repository Guidelines

## 项目结构与模块组织
- `src/` 存放业务代码，入口为 `src/main.tsx`，根组件在 `src/App.tsx`。
- `src/pages/` 放路由页面（例：`src/pages/audit-logs/AuditLogsPage.tsx`）。
- `src/components/` 放可复用组件，子目录多为 `kebab-case/`，组件文件使用 `PascalCase.tsx`，并常配 `index.ts` 作为出口。
- `src/services/` 用于 API/数据访问；`src/hooks/`、`src/contexts/`、`src/types/`、`src/lib/`、`src/locales/` 存放通用逻辑与类型。
- `public/` 为静态资源，`docs/` 为文档；构建相关配置见 `vite.config.ts`、`tailwind.config.ts`、`tsconfig*.json`、`eslint.config.js`。

## 构建、测试与开发命令
- `npm install` 安装依赖。
- `npm run dev` 启动 Vite 开发服务器。
- `npm run build` 生产构建；`npm run build:dev` 以 development 模式构建。
- `npm run preview` 预览构建产物。
- `npm run lint` 运行 ESLint 规则检查。

## 编码风格与命名约定
- 使用 TypeScript + React，模块别名 `@/` 指向 `src/`。
- 组件/页面文件命名为 `PascalCase.tsx`，目录使用小写或 `kebab-case`，聚合导出使用 `index.ts`。
- Tailwind 为主要样式方案，基础样式在 `src/index.css`。
- 以 ESLint 输出为准，提交前保证 `npm run lint` 通过。

## 测试指南
- 当前未配置测试脚本或框架（未发现 Vitest/Jest/RTL），暂无覆盖率门槛。
- 若新增测试，建议采用 `*.test.tsx` 或 `__tests__/` 结构，并补充 `npm run test` 脚本。

## 提交与 PR 指南
- 提交格式：`type(scope)!: subject`，`scope` 可省略；破坏性变更用 `!` 或 `BREAKING CHANGE:`。
- type 约定：`feat` `fix` `refactor` `docs` `style` `test` `perf` `build` `ci` `chore` `revert`。
- scope 建议：`auth`、`dashboard`、`audit-logs`、`data-screen`、`files`、`messages`、`projects`、`roles`、`users`、`components`、`services`、`contexts`、`i18n`、`config`。
- subject 要求：祈使句、简短明确、不加句号；示例：`feat(auth): 新增租户选择流程`。
- PR 包含变更摘要、关联需求/问题；涉及 UI 改动附截图或动图。
- 不提交构建产物（如 `dist/`）；如引入环境变量，请补充示例配置说明。
