# Harmony Admin

Harmony Admin 是一个纯前端系统管理台示例项目，基于 React、TypeScript、Vite、Tailwind CSS 和 shadcn/ui 构建。仓库不包含后端服务，默认提供本地演示数据，方便直接预览权限、租户、菜单、审计日志等后台管理界面。

> 注意：本仓库包含本地演示账号。生产使用前请关闭演示 Mock、接入自己的 API，并完成安全审查。

## 功能概览

- 用户、角色、权限、租户、菜单、部门、岗位、用户组等管理台页面
- 登录、租户选择、权限守卫、动态菜单等前端流程
- 审计日志、登录日志、文件管理、系统配置、消息中心等界面模块
- 内置演示账号和 mock 数据，开箱可预览主要界面
- API Client 与服务层已集中封装，便于替换为真实 API 服务

## 技术栈

- Vite
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Vitest + React Testing Library

## 目录结构

```text
.
├── src/                         # 前端源码
├── public/                      # 静态资源
├── docs/                        # 项目文档
├── .github/                     # GitHub 协作模板与 CI
├── .env.example                 # 本地环境变量示例
├── .env.docker.example          # Docker 环境变量示例
└── README.md
```

## 环境要求

- Node.js 22 LTS（CI 标准版本；本地至少使用 Node.js 20+）
- npm 10+（默认使用随 Node 22 提供的 npm 10/11）

当前仓库以 `package-lock.json` 和 npm 作为唯一默认依赖管理方式，本地和 CI 均使用 `npm ci`。当前不维护 Bun、pnpm 或 Yarn 工作流。

开始开发前建议确认工具链版本：

```bash
node -v
npm -v
```

## 快速开始

### 1. 安装依赖

```bash
npm ci
```

### 2. 配置环境变量

```bash
cp .env.example .env.development
```

默认启用演示 Mock：

```env
VITE_API_BASE_URL=http://localhost:9080
VITE_ENABLE_DEMO_MOCKS=true
```

### 3. 启动前端

```bash
npm run dev
```

默认访问地址为 `http://localhost:8080`。演示账号：

| 账号 | 密码 | 默认角色 | 预览重点 |
| --- | --- | --- | --- |
| `admin@example.com` | `local-demo-admin` | 租户管理员 | 用户、角色、菜单、配置、租户设置等管理入口 |
| `manager@example.com` | `local-demo-manager` | 经理 | 项目、文件、用户/岗位/用户组只读等协作入口 |
| `viewer@example.com` | `local-demo-viewer` | 查看者 | 只读菜单和低权限按钮隐藏效果 |

这些账号只属于 Demo Mock，本地预览权限由 `src/data/mock-data.ts` 提供。关闭 `VITE_ENABLE_DEMO_MOCKS` 后，登录、租户、菜单和权限均依赖接入方提供的外部 API。

## 接入真实 API

本仓库不提供后端实现。接入真实 API 服务时，关闭演示 Mock 并配置 API 地址：

```env
VITE_API_BASE_URL=https://your-api.example.com
VITE_ENABLE_DEMO_MOCKS=false
```

前端请求统一从 `src/services/apiClient.ts` 发起，业务服务位于 `src/services/`。接口契约参考 [docs/FRONTEND_API_CONTRACT.md](docs/FRONTEND_API_CONTRACT.md) 和 [docs/API_CONTRACT.md](docs/API_CONTRACT.md)。

## 常用命令

```bash
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
npm run preview
npm run security:audit
```

## Docker 本地预览

仓库提供仅包含前端静态站点的 Docker Compose 配置。首次启动前可复制环境变量示例：

```bash
cp .env.docker.example .env
docker compose up --build
```

默认访问地址：

- 前端：http://localhost:8080

Docker 默认开启演示 Mock。若要连接真实 API，请在 `.env` 中设置 `VITE_API_BASE_URL` 并把 `VITE_ENABLE_DEMO_MOCKS` 设为 `false`。

## 配置说明

- 本地配置示例：`.env.example`
- Docker 配置示例：`.env.docker.example`
- 演示边界：[docs/DEMO_BOUNDARY.md](docs/DEMO_BOUNDARY.md)
- 前端 API 契约：[docs/FRONTEND_API_CONTRACT.md](docs/FRONTEND_API_CONTRACT.md)
- 业务模块接入：[docs/BUSINESS_MODULE_ONBOARDING.md](docs/BUSINESS_MODULE_ONBOARDING.md)
- 可观测性边界：[docs/OBSERVABILITY.md](docs/OBSERVABILITY.md)

不要把真实密钥、真实账号、真实内部地址写入配置文件或文档。新增配置示例时统一使用占位值。

## 贡献

请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。提交前至少运行：

```bash
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
npm run security:audit
```

## 发布

v1.0 发布版本建议为 `v1.0.0`。发布流程见 [docs/release-process.md](docs/release-process.md)。

## 安全

如果发现安全问题，请不要公开提交 Issue，按 [SECURITY.md](SECURITY.md) 的流程报告。

## License

Apache License 2.0。详情见 [LICENSE](LICENSE)。
