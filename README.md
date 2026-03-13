# AI Deploy - GitHub 前端项目一键部署工具

![AI Deploy](https://img.shields.io/badge/AI%20Deploy-一键部署-blueviolet)
![Vue 3](https://img.shields.io/badge/Vue-3.4-green)
![Vite](https://img.shields.io/badge/Vite-5.0-yellow)
![License](https://img.shields.io/badge/License-MIT-blue)

一个现代化的 GitHub 前端项目一键部署工具，帮助开发者快速将 GitHub 仓库部署为可访问的公网网站。

## 功能特性

- 一键部署 GitHub 前端项目到 GitHub Pages
- 智能识别项目类型（Vue、React、Next.js、纯 HTML 等）
- **后端项目检测** - 自动识别包含后端代码的项目并给出明确提示
- 部署历史记录
- 请求频率限制保护
- 现代化 AI 工具风格界面
- 响应式设计，支持移动端

## 支持的项目类型

### 纯前端项目（支持部署）

| 类型 | 识别方式 | 部署方式 |
|------|----------|----------|
| Vue 3 | package.json 依赖 | GitHub Pages |
| React | package.json 依赖 | GitHub Pages |
| Next.js | package.json 依赖 | GitHub Pages（静态导出） |
| Nuxt.js | package.json 依赖 | GitHub Pages |
| Angular | package.json 依赖 | GitHub Pages |
| Svelte | package.json 依赖 | GitHub Pages |
| 纯 HTML | index.html 文件 | GitHub Pages |
| Vite 项目 | vite.config.js/ts | GitHub Pages |

### 不支持的项目类型

以下类型的项目**不支持**通过本工具部署：

- **Node.js 后端项目**：Express、Koa、Fastify、NestJS 等
- **Python 后端**：Django、Flask、FastAPI 等
- **Java 后端**：Spring Boot 等
- **PHP 后端**：Laravel、Symfony 等
- **Ruby 后端**：Rails、Sinatra 等
- **Go 后端**：Gin、Echo 等
- **Rust 后端**：Actix-web、Rocket 等
- **数据库相关项目**：包含 SQL 文件、Migration 等
- **Docker 项目**：包含 Dockerfile 等

> 对于后端项目，建议使用 Vercel、Railway、Render 或云服务器进行部署。

## 技术栈

- **前端框架**：Vue 3 (Composition API)
- **构建工具**：Vite 5
- **状态管理**：Pinia
- **UI 框架**：Element Plus
- **HTTP 客户端**：Axios
- **样式**：SCSS
- **部署**：Cloudflare Tunnel / GitHub Pages

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

应用将在 `http://localhost:5173` 启动。

### 构建生产版本

```bash
npm run build
```

构建输出位于 `dist` 目录。

## 部署到公网

### 方式一：Cloudflare Tunnel（推荐用于测试）

使用临时隧道快速部署到公网：

```bash
# Windows PowerShell
.\deploy-quick.ps1
```

或使用命令：

```bash
# 1. 构建项目
npm run build

# 2. 启动静态服务器
npx serve dist -l 8787

# 3. 在另一个终端启动 Cloudflare Tunnel
.\cloudflared.exe tunnel --url http://localhost:8787
```

### 方式二：Cloudflare Pages

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 Pages 页面，点击 "Create a project"
3. 选择 "Upload assets"
4. 上传 `dist` 目录内容
5. 获得公网访问地址

### 方式三：Vercel

1. 将代码推送到 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 自动构建部署

### 方式四：GitHub Pages

1. 在 GitHub 仓库设置中启用 Pages
2. 选择部署源为 GitHub Actions
3. 配置自动部署工作流

## 项目结构

```
ai-deploy-remote/
├── public/                 # 静态资源
│   └── robots.txt         # 爬虫配置
├── src/
│   ├── api/               # API 封装
│   │   └── githubApi.js   # GitHub API 接口
│   ├── components/        # Vue 组件
│   │   ├── DeployForm.vue      # 部署输入表单
│   │   ├── DeployStatus.vue    # 部署状态展示
│   │   ├── ResultCard.vue      # 部署结果卡片
│   │   └── DeployHistory.vue   # 部署历史记录
│   ├── stores/            # Pinia 状态管理
│   │   └── deployStore.js
│   ├── style/             # 样式变量
│   │   └── variables.scss
│   ├── utils/             # 工具函数
│   │   ├── repoParser.js  # 仓库地址解析
│   │   └── validators.js  # 输入验证
│   ├── views/             # 页面视图
│   │   └── Home.vue       # 首页
│   ├── App.vue            # 根组件
│   ├── main.js            # 入口文件
│   └── style.scss         # 全局样式
├── dist/                  # 构建输出（自动生成）
├── .env.example           # 环境变量示例
├── .gitignore             # Git 忽略配置
├── deploy-cloudflare.ps1  # Cloudflare 部署脚本
├── deploy-quick.ps1       # 快速部署脚本
├── index.html             # HTML 入口
├── package.json           # 项目配置
├── README.md              # 项目说明
└── vite.config.js         # Vite 配置
```

## 后端项目检测机制

本工具会自动检测以下后端特征：

### 后端框架依赖检测
- Node.js: express, koa, fastify, hapi, restify
- Python: django, flask, fastapi, tornado
- Java: spring-boot
- PHP: laravel, symfony, codeigniter
- Ruby: rails, sinatra
- Go: gin, echo, fiber
- Rust: actix-web, rocket, warp
- .NET: aspnetcore

### 后端特征文件检测
- `server.js`, `app.js`, `index.js` (Node.js 入口)
- `manage.py`, `requirements.txt` (Python)
- `pom.xml`, `build.gradle` (Java)
- `composer.json`, `artisan` (PHP)
- `Gemfile`, `config.ru` (Ruby)
- `go.mod`, `main.go` (Go)
- `Cargo.toml`, `main.rs` (Rust)
- `Dockerfile`, `docker-compose.yml` (Docker)
- `nginx.conf`, `.htaccess` (服务器配置)

### 数据库相关检测
- `schema.sql`, `database.sql`
- `migrations/` 目录
- `seeders/` 目录
- `models/` 目录

当检测到后端特征时，系统会：
1. 显示橙色警告提示
2. 列出检测到的后端特征
3. 提供部署建议
4. 终止部署流程

## 环境变量

复制 `.env.example` 为 `.env` 并配置：

```env
# GitHub API Token（可选）
# 用于提高 API 请求频率限制
# 在 https://github.com/settings/tokens 生成
VITE_GITHUB_TOKEN=your_github_token_here

# 应用配置
VITE_APP_NAME=AI Deploy
VITE_APP_VERSION=1.0.0
```

## 安全特性

- **频率限制**：每个 IP 每小时限制 10 次部署请求
- **输入验证**：严格的 GitHub URL 格式验证
- **XSS 防护**：用户输入内容转义处理
- **CORS 安全**：仅访问 GitHub API
- **robots.txt**：防止搜索引擎爬虫

## 浏览器支持

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

## 开发计划

- [ ] 支持更多前端框架（SvelteKit、Astro 等）
- [ ] 集成 Vercel API 实现真正的自动部署
- [ ] 支持自定义域名配置
- [ ] 添加部署预览功能
- [ ] 支持多环境部署（开发/测试/生产）

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

本项目采用 [MIT](LICENSE) 许可证开源。

## 致谢

- [Vue.js](https://vuejs.org/)
- [Vite](https://vitejs.dev/)
- [Element Plus](https://element-plus.org/)
- [Cloudflare](https://www.cloudflare.com/)

---

Made with ❤️ for developers
