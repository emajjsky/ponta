# 碰嗒碰嗒 (PONT-PONTA) - AI 智能体盲盒平台

> 通过 NFC 芯片碰一碰，唤醒你的专属 AI 智能体伙伴！

## 项目简介

碰嗒碰嗒是一个创新的 AI 智能体盲盒平台，结合了实体产品（NFC芯片）和虚拟AI智能体，为用户带来独特的互动体验。

### 核心功能

- 🎁 **盲盒商城** - 浏览和购买不同稀有度的AI智能体盲盒
- 🔑 **激活码系统** - 通过激活码（格式：PONTA + 10位字符）解锁并获得AI智能体
- 💬 **智能对话** - 与AI智能体进行实时对话互动（基于Coze API）
- 👤 **用户系统** - 完整的用户注册、登录和个人中心
- 🔧 **后台管理** - 智能体、用户、订单、激活码的全面管理

## 技术栈

### 前端
- **Next.js 16.1.1** - React框架，使用App Router
- **TypeScript 5.9.3** - 类型安全
- **Tailwind CSS 4.x** - 样式框架
- **shadcn/ui** - UI组件库
- **React Hook Form + Zod** - 表单验证
- **Sonner** - Toast通知

### 后端
- **Next.js API Routes** - RESTful API
- **Prisma ORM 5.22.0** - 数据库ORM
- **SQLite** - 开发数据库
- **JWT** - 身份认证
- **bcrypt** - 密码加密
- **Coze API** - AI对话服务

## 快速开始

### 前置要求

- Node.js 18+
- pnpm 8+

### 安装

\`\`\`bash
# 克隆项目
git clone <repository-url>
cd ponta-ponta

# 安装依赖
pnpm install
\`\`\`

### 环境变量

创建 \`.env\` 文件：

\`\`\`env
# JWT密钥（生产环境请使用随机字符串）
JWT_SECRET="your-secret-key-change-in-production"

# Coze API配置
COZE_API_TOKEN="sat_KDMcFwCm9FafVo74JcYwaDSq0t1xCe940V4vl2ehRyBVd0CbUdFIWOR5qakrye3D"
COZE_BOT_ID="7428933434510770211"
\`\`\`

### 数据库设置

\`\`\`bash
# 生成Prisma客户端
pnpm prisma generate

# 运行数据库迁移
pnpm prisma migrate dev

# 填充种子数据（可选）
pnpm prisma db seed
\`\`\`

### 启动开发服务器

\`\`\`bash
pnpm dev
\`\`\`

访问 [http://localhost:3000](http://localhost:3000)

### 测试账号

**管理员账号:**
- 邮箱: admin@ponta-ponta.com
- 密码: password123

**测试用户:**
- 邮箱: test@example.com
- 密码: password123

## 部署到Vercel

1. **准备生产环境变量**

在Vercel控制台设置：
- \`JWT_SECRET\` - 强随机字符串
- \`COZE_API_TOKEN\` - 你的Coze API Token
- \`COZE_BOT_ID\` - 你的Bot ID
- \`DATABASE_URL\` - PostgreSQL连接字符串（推荐使用Vercel Postgres或Supabase）

2. **部署**

\`\`\`bash
# 安装Vercel CLI
pnpm i -g vercel

# 部署
vercel
\`\`\`

3. **运行生产迁移**

\`\`\`bash
vercel env pull .env.local
pnpm prisma migrate deploy
pnpm prisma db seed
\`\`\`

## 开发指南

### 项目结构

\`\`\`
app/
├── api/              # API路由
│   ├── auth/        # 认证API
│   ├── agents/      # 智能体API
│   ├── orders/      # 订单API
│   └── admin/       # 后台管理API
├── (auth)/          # 认证页面
├── (shop)/          # 商城页面
├── admin/           # 后台管理页面
└── chat/            # 对话页面
components/          # React组件
lib/                 # 工具库
prisma/             # Prisma配置
\`\`\`

### 添加新的智能体

1. 登录管理员账号
2. 访问 \`/admin/agents/new\`
3. 填写智能体信息并保存

## 许可证

MIT License
