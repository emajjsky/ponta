# 碰嗒碰嗒 (PONT-PONTA) - AI智能体盲盒平台

> 🎁 通过NFC芯片碰一碰,唤醒你的专属AI智能体伙伴!
>
> 💡 创新的"实体+虚拟"产品模式,结合AI对话技术和盲盒玩法,为用户带来独特的互动体验

[![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📖 目录

- [项目简介](#项目简介)
- [核心功能](#核心功能)
- [技术架构](#技术架构)
- [快速开始](#快速开始)
- [环境配置](#环境配置)
- [数据库管理](#数据库管理)
- [开发指南](#开发指南)
- [API文档](#api文档)
- [部署指南](#部署指南)
- [常见问题](#常见问题)

---

## 🎯 项目简介

**碰嗒碰嗒 (PONT-PONTA)** 是一个创新的AI智能体盲盒平台,采用现代化的技术栈构建,支持多种AI服务提供商,提供完整的用户系统、盲盒商城、激活码系统和AI对话功能。

### 🌟 核心特色

- **🎁 盲盒玩法** - 系列盲盒销售,随机获得不同稀有度的AI智能体
- **🔑 激活码系统** - 通过激活码解锁智能体,支持批量生成和管理
- **🤖 双AI引擎** - 支持Coze API和OpenAI兼容接口(如DeepSeek、SiliconFlow等)
- **💬 流式对话** - 基于SSE的实时AI对话,智能体具备记忆能力
- **👤 完整用户系统** - 注册登录、个人中心、我的智能体
- **🔧 后台管理** - 系列管理、智能体管理、激活码管理、订单管理
- **🎨 现代化UI** - 基于shadcn/ui的精美界面,响应式设计

### 📱 业务模式

1. **用户购买系列盲盒** → 获得随机激活码
2. **使用激活码解锁** → 永久获得该智能体使用权
3. **与智能体对话** → 享受个性化AI伙伴体验

---

## ✨ 核心功能

### 🛒 商城功能
- ✅ 系列盲盒列表展示
- ✅ 系列详情页(价格、库存、包含的智能体)
- ✅ 智能体详情页(稀有度、能力描述、所属系列)
- ✅ 购买流程和订单管理

### 🔐 认证授权
- ✅ 用户注册/登录(邮箱+密码)
- ✅ JWT Token认证(HttpOnly Cookie)
- ✅ 管理员权限系统
- ✅ 密码加密(bcrypt)

### 🤖 AI对话系统
- ✅ 支持Coze API(自带会话管理)
- ✅ 支持OpenAI兼容接口(手动历史管理)
- ✅ SSE流式响应(实时打字效果)
- ✅ 对话历史持久化
- ✅ 智能体记忆功能(conversationId)

### 🎫 激活码系统
- ✅ 格式: PONTA + 10位随机字符
- ✅ 批量生成激活码
- ✅ CSV导出激活码列表
- ✅ 激活状态跟踪(UNUSED/ACTIVATED)
- ✅ 防重复激活(用户+智能体唯一性约束)

### 🎨 后台管理
- ✅ 系列管理(新增/编辑/上架下架/图片上传)
- ✅ 智能体管理(新增/编辑/支持双Provider配置)
- ✅ 激活码管理(生成/查看状态/导出CSV)
- ✅ 订单管理(查看/状态更新)
- ✅ 用户管理(查看/权限管理)

---

## 🏗️ 技术架构

### 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 16.1.1 | React框架,App Router架构 |
| React | 19.2.3 | UI库 |
| TypeScript | 5.9.3 | 类型安全 |
| Tailwind CSS | 4.x | 样式框架 |
| shadcn/ui | latest | 高质量UI组件库 |
| React Hook Form | latest | 表单管理 |
| Zod | latest | Schema验证 |
| Sonner | latest | Toast通知 |

### 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js API Routes | - | RESTful API |
| Prisma ORM | 5.22.0 | 数据库ORM |
| PostgreSQL | 16+ | 生产数据库 |
| jose | latest | JWT Token生成和验证 |
| bcrypt | latest | 密码加密 |
| Coze API SDK | latest | AI对话(Coze Provider) |
| OpenAI SDK | - | AI对话(OpenAI兼容) |

### AI Provider架构

```
AI Provider接口
├── CozeProvider (维护会话状态)
│   ├── Bot ID + API Token
│   ├── 自动管理conversationId
│   └── 流式响应
└── OpenAIProvider (手动传递历史)
    ├── Endpoint + API Key + Model
    ├── System Prompt支持
    └── 限制历史消息数量(20条)
```

---

## 🚀 快速开始

### 前置要求

- **Node.js**: 18.x 或更高版本
- **pnpm**: 8.x 或更高版本
- **Git**: 最新版本

### 1️⃣ 克隆项目

```bash
git clone https://github.com/emajjsky/pontaponta.git
cd pontaponta
```

### 2️⃣ 安装依赖

```bash
# 使用pnpm安装(推荐)
pnpm install

# 或使用npm
npm install
```

### 3️⃣ 配置环境变量

创建 `.env` 文件:

```env
# JWT密钥(生产环境必须使用强随机字符串!)
JWT_SECRET="your-secret-key-change-in-production"

# Coze API配置(可选,如果使用Coze Provider)
COZE_API_TOKEN="sat_xxx..."
COZE_BOT_ID="7428933434510770211"

# 数据库连接(开发/生产环境均使用PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/pontaponta"

# OpenAI兼容API配置(可选,如果使用OpenAI Provider)
# OPENAI_API_KEY="sk-xxx..."
# OPENAI_API_BASE="https://api.siliconflow.cn/v1/chat/completions"
```

### 4️⃣ 数据库初始化

```bash
# 生成Prisma客户端
pnpm prisma generate

# 运行数据库迁移(开发环境)
pnpm prisma migrate dev

# 填充种子数据(测试账号和示例智能体)
pnpm prisma db seed
```

**种子数据包含:**
- 👨‍💼 管理员账号: `admin@ponta-ponta.com` / `password123`
- 📧 测试用户: `test@example.com` / `password123`
- 🔑 测试激活码: `PONTA1234567890`、`PONTA5D1A5WQ58P`

### 5️⃣ 启动开发服务器

```bash
# 启动开发服务器(localhost:3000)
pnpm dev

# 或使用Turbopack(更快的启动速度)
pnpm dev --turbo
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用

### 6️⃣ 数据库可视化管理(可选)

```bash
# 启动Prisma Studio
pnpm prisma studio

# 访问 http://localhost:5555
```

---

## 🔧 环境配置

### 开发环境

- **数据库**: PostgreSQL
- **端口**: 3000
- **热重载**: ✅ 支持
- **API调试**: ✅ 支持

### 生产环境

- **数据库**: PostgreSQL 16+
- **进程管理**: PM2
- **反向代理**: Nginx
- **SSL证书**: Let's Encrypt (Certbot)

### 环境变量说明

| 变量名 | 必需 | 说明 | 示例 |
|--------|------|------|------|
| `JWT_SECRET` | ✅ | JWT签名密钥 | 强随机字符串,至少32位 |
| `DATABASE_URL` | ✅ | 数据库连接字符串 | `postgresql://user:pass@host:5432/db` |
| `COZE_API_TOKEN` | ❌ | Coze API密钥 | `sat_xxx...` |
| `COZE_BOT_ID` | ❌ | Coze机器人ID | `7428933434510770211` |
| `COZE_API_BASE_URL` | ❌ | Coze API基础URL | `https://api.coze.cn` (默认) |
| `NODE_ENV` | ❌ | 运行环境 | `development` / `production` |

---

## 💾 数据库管理

### Prisma CLI命令

```bash
# 生成Prisma客户端
pnpm prisma generate

# 创建新迁移(开发环境)
pnpm prisma migrate dev --name migration_name

# 应用迁移(生产环境)
pnpm prisma migrate deploy

# 打开Prisma Studio
pnpm prisma studio

# 重置数据库(危险操作!)
pnpm prisma migrate reset

# 填充种子数据
pnpm prisma db seed
```

### 数据模型关系

```
User (用户)
  ├─→ Order[] (订单)
  ├─→ UserAgent[] (拥有的智能体)
  ├─→ ActivationCode[] (创建的激活码)
  └─→ ChatHistory[] (对话历史)

Series (系列)
  ├─→ Agent[] (包含的智能体)
  └─→ Order[] (该系列的订单)

Agent (智能体)
  ├─→ series (所属系列)
  ├─→ Order[] (被购买的订单)
  ├─→ UserAgent[] (被激活的实例)
  ├─→ ActivationCode[] (关联的激活码)
  └─→ ChatHistory[] (对话历史)

Order (订单)
  ├─→ user (购买用户)
  ├─→ series (购买的系列,可选)
  ├─→ agent (直接购买的智能体,兼容旧数据)
  └─→ activationCode (关联的激活码)

ActivationCode (激活码)
  ├─→ agent (属于哪个智能体)
  ├─→ user (被哪个用户激活)
  ├─→ order (关联订单,可选)
  └─→ userAgent (激活后创建的实例)

UserAgent (用户智能体实例)
  ├─→ user (所属用户)
  ├─→ agent (对应的智能体)
  ├─→ activationCode (使用的激活码)
  └─→ ChatHistory[] (对话历史)
```

---

## 📚 开发指南

### 项目目录结构

```
pontaponta/
├── app/                      # Next.js App Router
│   ├── (auth)/              # 认证页面组(共享layout)
│   │   ├── login/           # 登录页面
│   │   └── register/        # 注册页面
│   ├── (shop)/              # 商城页面组(共享layout)
│   │   ├── page.tsx         # 商城首页
│   │   ├── series/          # 系列详情
│   │   └── agents/          # 智能体列表
│   ├── admin/               # 后台管理(需要ADMIN权限)
│   │   ├── agents/          # 智能体管理
│   │   ├── series/          # 系列管理
│   │   ├── activation-codes/ # 激活码管理
│   │   └── orders/          # 订单管理
│   ├── chat/                # AI对话页面
│   ├── my-agents/           # 我的智能体
│   └── api/                 # API路由
│       ├── auth/            # 认证API
│       ├── agents/          # 智能体API
│       ├── shop/            # 商城API
│       ├── activate/        # 激活码API
│       └── admin/           # 后台管理API
├── components/               # React组件
│   ├── ui/                  # shadcn/ui基础组件
│   ├── auth/                # 认证组件
│   ├── agents/              # 智能体组件
│   ├── chat/                # 聊天组件
│   ├── admin/               # 后台管理组件
│   └── layout/              # 布局组件
├── lib/                     # 工具库
│   ├── providers/           # AI Provider实现
│   │   ├── coze.ts         # Coze Provider
│   │   └── openai.ts       # OpenAI Provider
│   ├── ai-provider.ts       # Provider接口定义
│   ├── jwt.ts               # JWT工具
│   ├── auth.ts              # 认证工具
│   ├── admin.ts             # 管理员权限检查
│   ├── coze.ts              # Coze API集成
│   ├── activation.ts        # 激活码工具
│   ├── prisma.ts            # Prisma客户端
│   └── utils.ts             # 通用工具
├── prisma/                  # Prisma配置
│   ├── schema.prisma        # 数据模型定义
│   ├── seed.ts              # 基础种子数据
│   └── seed-series-data.ts  # 系列智能体数据
├── public/                  # 静态资源
│   └── uploads/             # 上传的图片
├── middleware.ts            # Next.js中间件(路由保护)
├── package.json
├── tsconfig.json
└── .env                     # 环境变量
```

### 添加新的智能体

**方式1: 通过后台界面添加**

1. 登录管理员账号 (`admin@ponta-ponta.com`)
2. 访问 `/admin/agents/new`
3. 选择Provider类型:
   - **COZE**: 输入Bot ID和API Token
   - **OPENAI**: 输入Endpoint、API Key、Model、System Prompt
4. 填写智能体名称、Slug、描述等
5. 上传头像图片
6. 选择稀有度和所属系列
7. 保存

**方式2: 通过数据库直接添加**

```sql
-- Coze Provider
INSERT INTO agents (name, slug, provider, "providerConfig", rarity, "seriesId")
VALUES (
  '智能体名称',
  'agent-slug',
  'COZE',
  '{"botId": "7428933434510770211", "apiToken": "sat_xxx..."}',
  'COMMON',
  'series-id'
);

-- OpenAI Provider
INSERT INTO agents (name, slug, provider, "providerConfig", "systemPrompt", rarity)
VALUES (
  '智能体名称',
  'agent-slug',
  'OPENAI',
  '{"endpoint": "https://api.siliconflow.cn/v1/chat/completions", "apiKey": "sk-xxx...", "model": "deepseek-chat"}',
  '你是一个有用的AI助手',
  'RARE'
);
```

### 批量生成激活码

1. 登录后台管理
2. 进入"激活码管理"
3. 选择智能体
4. 输入生成数量
5. 点击"生成激活码"
6. 点击"导出CSV"下载激活码列表

### 自定义AI Provider

所有Provider必须实现 `AIProvider` 接口:

```typescript
// lib/ai-provider.ts
export interface AIProvider {
  /**
   * 发送消息并获取流式响应
   */
  chat(
    message: string,
    conversationId?: string,
    history?: ChatMessage[],
    options?: ChatOptions
  ): AsyncIterable<ChatChunk>

  /**
   * 获取provider名称
   */
  getName(): string
}
```

参考 `lib/providers/coze.ts` 或 `lib/providers/openai.ts` 实现新的Provider。

---

## 📡 API文档

### 认证相关

#### POST `/api/auth/register`
**用户注册**

**请求体:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "nickname": "昵称"
}
```

**响应:**
```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "nickname": "昵称"
  }
}
```

#### POST `/api/auth/login`
**用户登录**

**请求体:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应:**
```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "role": "USER"
  }
}
```

**Token存储在HttpOnly Cookie中**

### 智能体相关

#### GET `/api/agents`
**获取智能体列表(公开接口)**

**查询参数:**
- `series` (可选): 系列ID,筛选特定系列的智能体

**响应:**
```json
{
  "agents": [
    {
      "id": "agent-id",
      "name": "迪迦奥特曼",
      "slug": "ultraman-tiga",
      "avatar": "/uploads/xxx.jpg",
      "rarity": "LEGENDARY",
      "seriesId": "series-id"
    }
  ]
}
```

#### GET `/api/agents/[slug]`
**获取智能体详情**

**响应:**
```json
{
  "agent": {
    "id": "agent-id",
    "name": "迪迦奥特曼",
    "slug": "ultraman-tiga",
    "description": "来自M78星云的光之巨人",
    "abilities": ["飞行", "光线技能"],
    "rarity": "LEGENDARY",
    "series": {
      "id": "series-id",
      "name": "奥特曼系列",
      "slug": "ultraman"
    }
  }
}
```

### 商城相关

#### GET `/api/shop/series`
**获取系列盲盒列表**

**响应:**
```json
{
  "series": [
    {
      "id": "series-id",
      "name": "奥特曼系列",
      "slug": "ultraman",
      "coverImage": "/uploads/xxx.jpg",
      "description": "收集光之巨人",
      "price": 59,
      "stock": 100,
      "isActive": true,
      "order": 0,
      "agentsCount": 6
    }
  ]
}
```

#### GET `/api/shop/series/[slug]`
**获取系列详情**

**响应:**
```json
{
  "series": {
    "id": "series-id",
    "name": "奥特曼系列",
    "agents": [
      {
        "id": "agent-id",
        "name": "迪迦奥特曼",
        "rarity": "LEGENDARY"
      }
    ]
  }
}
```

### 对话相关

#### POST `/api/chat`
**与智能体对话(需要认证)**

**请求体:**
```json
{
  "agentSlug": "ultraman-tiga",
  "message": "你好!",
  "conversationId": "optional-conversation-id"
}
```

**响应:** Server-Sent Events (SSE) 流

```
data: {"event":"delta","content":"你好"}

data: {"event":"delta","content":"!我是"}

data: {"event":"delta","content":"迪迦"}

data: {"event":"completed","conversationId":"conv-id"}
```

### 激活码相关

#### POST `/api/activate`
**激活智能体(需要认证)**

**请求体:**
```json
{
  "code": "PONTA1234567890"
}
```

**响应:**
```json
{
  "success": true,
  "agent": {
    "id": "agent-id",
    "name": "迪迦奥特曼",
    "slug": "ultraman-tiga"
  },
  "userAgentId": "user-agent-id"
}
```

**错误响应:**
```json
{
  "error": "激活码不存在或已使用"
}
```

### 后台管理API

后台管理API需要管理员权限(`role: ADMIN`),主要包括:

- `/api/admin/agents` - 智能体CRUD
- `/api/admin/series` - 系列CRUD
- `/api/admin/activation-codes` - 激活码管理
- `/api/admin/orders` - 订单管理
- `/api/admin/upload` - 图片上传

详细API文档请查看源码中的具体实现。

---

## 🚀 部署指南

### Vercel部署(推荐)

1. **连接GitHub仓库到Vercel**
2. **配置环境变量:**
   - `JWT_SECRET` - 强随机字符串
   - `DATABASE_URL` - Vercel Postgres或Supabase连接字符串
   - `COZE_API_TOKEN` - Coze API密钥(如果使用Coze)
   - `COZE_BOT_ID` - Coze机器人ID

3. **运行数据库迁移:**
   ```bash
   vercel env pull .env.local
   pnpm prisma migrate deploy
   pnpm prisma db seed
   ```

4. **自动部署**: 推送到GitHub主分支自动触发部署

### 腾讯云/阿里云部署

**详细的Ubuntu服务器部署步骤,请查看:** 👉 **[TENCENT_CLOUD_DEPLOYMENT.md](./TENCENT_CLOUD_DEPLOYMENT.md)**

该文档包含:
- ✅ 系统环境配置(Node.js、pnpm、PM2)
- ✅ PostgreSQL安装和配置
- ✅ 项目部署和构建
- ✅ Nginx反向代理配置
- ✅ SSL证书申请(HTTPS)
- ✅ 域名配置
- ✅ 常见问题解决
- ✅ 性能优化建议
- ✅ 安全加固
- ✅ 备份策略

### Docker部署(可选)

项目暂未提供Docker配置,如需容器化部署,可以参考以下结构:

```dockerfile
FROM node:22-alpine AS base

# 安装依赖
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

# 构建应用
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# 生产运行
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

---

## ❓ 常见问题

### Q1: 智能体没有记忆怎么办?

**A:** 检查以下几点:

1. **数据库conversationId字段:**
   ```sql
   SELECT "conversationId" FROM "ChatHistory" WHERE "userAgentId" = 'xxx' ORDER BY createdAt DESC LIMIT 5;
   ```

2. **Coze Provider配置:**
   - 确保 `lib/providers/coze.ts` 正确返回 `conversationId`
   - 检查 `chunk.data?.conversation_id` 是否有值

3. **API路由:**
   - 检查 `app/api/chat/route.ts` 是否正确捕获 `actualConversationId`
   - 确认 `saveChatHistory` 保存了正确的 conversationId

**解决方案参考:** 已在 `lib/ai-provider.ts`、`lib/providers/coze.ts` 和 `app/api/chat/route.ts` 中修复

### Q2: OpenAI Provider没有历史记忆?

**A:** OpenAI兼容接口不维护会话状态,需要手动传递历史:

```typescript
// app/api/chat/route.ts 已包含此逻辑
const history = await getChatHistory(payload.userId, agent.id, 20)
const stream = provider.chat(message, conversationId, history)
```

### Q3: 激活码重复激活问题?

**A:** Prisma Schema已定义唯一性约束:

```prisma
model UserAgent {
  @@unique([userId, agentId])  // 一个用户对同一智能体只能激活一次
}
```

### Q4: 商城页面显示"暂无系列盲盒"?

**A:** 可能是Next.js缓存问题:

```bash
# 清除构建缓存
rm -rf .next

# 重新构建
pnpm build

# 重启应用
pm2 restart pontaponta
```

### Q5: 数据库迁移失败?

**A:** 数据库迁移失败时:

```bash
# 删除旧的迁移文件
rm -rf prisma/migrations/*

# 重新迁移
pnpm prisma migrate dev --name init
```

### Q6: Coze API调用失败?

**A:** 检查环境变量:

```bash
# 检查.env文件
COZE_API_TOKEN=sat_xxx...
COZE_BOT_ID=7428933434510770211
COZE_API_BASE_URL=https://api.coze.cn  # 默认值
```

### Q7: 图片上传失败?

**A:** 检查以下几点:

1. **上传目录权限:**
   ```bash
   mkdir -p public/uploads
   chmod 755 public/uploads
   ```

2. **Nginx配置:**
   ```nginx
   client_max_body_size 10M;  # 允许上传最大10MB
   ```

3. **文件大小限制:** 代码中限制为5MB

---

## 📝 更新日志

### v1.0.0 (2025-12-27)
✅ **核心功能完成**
- 双AI Provider架构(Coze + OpenAI)
- 系列盲盒系统
- 激活码系统
- 用户认证和授权
- 后台管理功能
- 图片上传功能
- 智能体对话记忆

### 🔄 即将推出
- [ ] 支付功能集成
- [ ] NFC芯片Web API集成
- [ ] 智能体分享功能
- [ ] 多语言支持
- [ ] 移动端优化

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

## 🤝 贡献指南

欢迎提交Issue和Pull Request!

1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交Pull Request

---

## 📞 联系方式

- **GitHub仓库:** https://github.com/emajjsky/pontaponta
- **问题反馈:** 在GitHub提Issue
- **部署文档:** 查看 [TENCENT_CLOUD_DEPLOYMENT.md](./TENCENT_CLOUD_DEPLOYMENT.md)

---

## 🌟 致谢

- [Next.js](https://nextjs.org/) - React框架
- [Prisma](https://www.prisma.io/) - 数据库ORM
- [shadcn/ui](https://ui.shadcn.com/) - UI组件库
- [Coze API](https://www.coze.cn/) - AI对话服务
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架

---

**艹,老王我把这个文档写得这么详细,你要是还说看不懂,老王真要把键盘吃下去了!🎉**

**文档最后更新: 2025-12-27**
