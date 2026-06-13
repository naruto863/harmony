# Harmony Admin 用户手册

## 1. 基本信息与导读

**项目名称**: Harmony Admin
**当前版本**: 0.1.0
**项目定位**: 纯前端系统管理台示例项目，不包含后端服务
**基于框架**: React + Vite + TypeScript + shadcn/ui + Tailwind CSS

### 导读

本手册旨在帮助开发者和最终用户快速了解 Harmony Admin 管理台的功能架构、核心概念及使用方法。仓库默认启用本地演示 Mock，便于在没有后端服务的情况下预览主要界面；接入生产系统时需要关闭演示 Mock 并对接自己的外部 API。

---

## 2. 快速开始

### 环境准备

- Node.js 22 LTS（本地至少使用 Node.js 20+）
- npm 10+（仓库以 `package-lock.json` 和 `npm ci` 为默认工作流）

### 启动步骤

1. **克隆代码库**

   ```bash
   git clone https://github.com/<owner>/harmony-admin.git
   cd harmony-admin
   ```

2. **安装依赖**

   ```bash
   npm ci
   ```

3. **准备本地配置**

   ```bash
   cp .env.example .env.development
   ```

   默认配置会启用本地演示 Mock：

   ```env
   VITE_API_BASE_URL=http://localhost:9080
   VITE_ENABLE_DEMO_MOCKS=true
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```
   默认访问地址为 `http://localhost:8080`。

---

## 3. 产品概览与核心概念

### 3.1 产品概览

Harmony Admin 是一个现代化的多租户后台管理台前端示例，旨在提供高效、美观且功能完备的企业级管理界面参考。系统集成了用户权限管理、多租户切换、数据可视化大屏及丰富系统设置功能。

### 3.2 核心概念

- **多租户 (Multi-tenancy)**: 系统支持多租户架构，用户登录后需选择或被分配到一个特定的租户（组织/公司）下进行操作，数据在租户间隔离。
- **RBAC 权限控制**: 基于“用户-角色-权限”的设计模型。通过分配角色（Roles）来控制用户对不同页面和功能的访问权限。
- **现代化 UI**: 采用 Shadcn UI 和 Tailwind CSS 构建，支持亮色/暗色模式切换，响应式设计适配多种设备。
- **数据大屏 (Data Screen)**: 专为大屏展示设计的独立视图，用于宏观数据的实时监控与展示。

---

## 4. 项目核心功能点

### 4.1 认证与安全

- **注册与登录**: 支持本地演示账号登录，也可接入外部 API 的注册登录接口。
- **租户选择**: 登录后支持多租户切换 (`/select-tenant`)，适应多组织架构。
- **权限守卫**: 路由级权限控制 (`AuthGuard`)，确保未授权用户无法访问敏感页面。

### 4.2 综合管理

- **仪表盘 (Dashboard)**: 系统首页，展示核心指标概览。
- **项目管理 (Projects)**: 管理企业内部项目资源 (`/projects`)。
- **文件管理 (Files)**: 统一的文件上传与资源管理中心 (`/files`)。
- **消息中心 (Messages)**: 站内消息通知与查看 (`/messages`)。

### 4.3 用户与权限体系

- **用户管理 (Users)**: 用户的增删改查及状态管理 (`/users`)。
- **角色管理 (Roles)**: 定义角色及其对应的权限集 (`/roles`)。
- **审计日志 (Audit Logs)**: 记录系统内的关键操作日志，保障安全追溯 (`/audit-logs`)。

### 4.4 系统设置

提供精细化的系统配置模块：

- **个人设置 (Profile Settings)**: 用户个人资料修改。
- **租户设置 (Tenant Settings)**: 当前租户信息的配置。
- **通知设置 (Notification Settings)**: 配置消息通知偏好。
- **功能设置 (Feature Settings)**: 开关系统特定功能模块。
- **安全设置 (Security Settings)**: 账号安全相关配置。
- **会话设置 (Sessions Settings)**: 管理当前活跃的登录会话。

### 4.5 数据可视化

- **数据大屏 (Data Screen)**: 独立的沉浸式数据展示页面 (`/data-screen`)，适用于监控中心或大屏演示。

---

## 5. 部署流程

### 构建生产环境代码

运行构建命令生成静态文件：

```bash
npm run build
```

构建产物将输出到 `dist` 目录。

### 预览构建结果

在本地预览生产包效果：

```bash
npm run preview
```

### 部署

将 `dist` 目录下的所有文件部署到任意静态 Web 服务器（如 Nginx、Apache、Vercel、Netlify）。

**Nginx 配置示例**:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

_注意：由于是单页应用 (SPA)，需配置 Nginx 将所有 404 请求重定向到 `index.html` 以支持前端路由。_
