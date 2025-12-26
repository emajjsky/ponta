# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**碰嗒碰嗒 (PONT-PONTA)** 是一个创新的AI智能体盲盒平台，结合实体NFC芯片和虚拟AI智能体，通过"碰一碰"交互为用户提供独特的AI伙伴体验。

项目采用现代化的技术栈，基于Next.js 16的App Router架构，集成了完整的用户系统、盲盒商城、激活码系统和AI对话功能。

## 常用命令

### 开发流程

```bash
# 安装依赖
pnpm install

# 启动开发服务器（localhost:3000）
pnpm dev

# 生产构建
pnpm build

# 生产服务器（需先build）
pnpm start

# 代码检查
pnpm lint
```

### 数据库操作

```bash
# 生成Prisma客户端
pnpm prisma generate

# 运行数据库迁移（开发环境）
pnpm prisma migrate dev

# 运行数据库迁移（生产环境）
pnpm prisma migrate deploy

# 填充种子数据（测试账号和示例智能体）
pnpm prisma db seed

# 打开Prisma Studio（数据库可视化管理）
pnpm prisma studio
```

### 单元测试

目前项目尚未配置自动化测试，需要通过手动测试验证功能。

## 核心架构

### 技术栈

**前端框架：**
- Next.js 16.1.1 (App Router)
- React 19.2.3
- TypeScript 5
- Tailwind CSS 4.x
- shadcn/ui (基于Radix UI的组件库)

**后端技术：**
- Next.js API Routes
- Prisma ORM 5.x
- SQLite (开发) / PostgreSQL (生产)
- JWT认证 (jose库)
- bcrypt密码加密

**AI集成：**
- Coze API (@coze/api) - 提供流式AI对话能力

**状态管理与表单：**
- React Context API
- React Hook Form + Zod验证
- Sonner (Toast通知)

### 目录结构组织

项目使用**Route Groups**进行功能分组，这是理解代码组织的关键：

```
app/
├── (auth)/          # 认证相关页面（登录/注册）- 共享layout
├── (shop)/          # 商城页面（首页、盲盒列表）- 共享layout
├── admin/           # 后台管理（需要ADMIN权限）
├── chat/            # AI对话页面
└── api/             # API路由
    ├── auth/        # 注册、登录、验证
    ├── agents/      # 智能体CRUD
    ├── orders/      # 订单管理
    ├── activation-codes/  # 激活码操作
    ├── chat/        # AI对话接口
    └── admin/       # 后台管理API
```

**关键组件目录：**
- `components/ui/` - shadcn/ui基础组件（直接使用，不要修改）
- `components/auth/` - 认证相关组件
- `components/agents/` - 智能体展示和激活码组件
- `components/chat/` - 聊天界面组件

**核心工具库：**
- `lib/jwt.ts` - JWT token生成和验证（使用jose库）
- `lib/auth.ts` - 密码加密、邮箱和昵称验证
- `lib/admin.ts` - 管理员权限检查（`requireAdmin`函数）
- `lib/coze.ts` - Coze API集成（流式对话、历史管理）
- `lib/prisma.ts` - Prisma客户端单例
- `lib/utils.ts` - 通用工具函数（cn类名合并）
- `lib/activation.ts` - 激活码生成和验证逻辑

**API路由命名约定：**
- `/api/auth/*` - 认证相关（登录、注册、登出、获取当前用户）
- `/api/agents` - 公开的智能体列表（无需认证）
- `/api/admin/*` - 后台管理API（需要ADMIN权限）
- `/api/chat/*` - AI对话相关（需要用户认证）
- `/api/user-agents` - 用户拥有的智能体列表（需要认证）
- `/api/activate` - 激活码激活接口（需要认证）
- `/api/shop/*` - 商城相关（系列列表、系列详情）

### 数据模型关系

理解Prisma schema中的关系是关键：

```
Series (盲盒系列)
  ├─→ Agent[] (包含的智能体)
  └─→ Order[] (该系列的订单)

User (用户)
  ├─→ Order[] (订单)
  ├─→ UserAgent[] (拥有的智能体)
  ├─→ ActivationCode[] (创建的激活码)
  └─→ ChatHistory[] (对话历史)

Agent (智能体角色)
  ├─→ series (所属系列，可选)
  ├─→ Order[] (被购买的订单)
  ├─→ UserAgent[] (被激活的实例)
  ├─→ ActivationCode[] (关联的激活码)
  └─→ ChatHistory[] (对话历史)

Order (订单)
  ├─→ user (购买用户)
  ├─→ series (购买的系列，可选)
  ├─→ agent (直接购买的智能体，兼容旧数据)
  └─→ activationCode (关联的激活码，一对一)

ActivationCode (激活码)
  ├─→ agent (属于哪个智能体)
  ├─→ user (被哪个用户激活)
  ├─→ order (关联订单，可选)
  └─→ userAgent (激活后创建的UserAgent实例)

UserAgent (用户拥有的智能体实例)
  ├─→ user (所属用户)
  ├─→ agent (对应的智能体角色)
  ├─→ activationCode (使用的激活码)
  └─→ ChatHistory[] (该实例的对话历史)
```

**重要关系：**
- **Series → Agent**：一个系列包含多个智能体，智能体可以不属于任何系列
- **Order支持两种模式**：购买系列盲盒（`seriesId`）或直接购买智能体（`agentId`，兼容旧数据）
- **用户激活码后**，会创建一个`UserAgent`记录（一个用户对同一个智能体只能有一个实例）
- **UserAgent唯一性**：通过`userId + agentId`的唯一索引保证重复激活
- **对话历史关联**：通过`userAgentId`关联到具体的智能体实例

## 关键业务逻辑

### 认证与授权

**JWT实现（lib/jwt.ts）：**
- 使用`jose`库生成和验证JWT（而非jsonwebtoken）
- 使用HttpOnly Cookie存储token（更安全）
- Token有效期：7天
- 核心函数：
  - `generateToken(payload)` - 生成JWT token
  - `verifyToken(token)` - 验证token并返回payload
  - `extractTokenFromHeader(authHeader)` - 从Authorization header提取token

**密码验证（lib/auth.ts）：**
- 使用bcrypt加密（saltRounds: 12）
- 密码要求：至少8个字符，包含字母和数字
- 昵称要求：2-20个字符，支持中英文、数字、下划线、连字符

**中间件应用（middleware.ts）：**
- 公开路由：`/`, `/login`, `/register`, `/activate`, `/shop`, `/agents`, `/api/auth/login`, `/api/auth/register`, `/api/agents`
- 需要认证：`/chat`, `/my-agents`, `/api/chat/*`, `/api/user-agents/*`
- 需要管理员：`/admin/*`, `/api/admin/*`

**API路由权限检查模式：**

**1. 管理员路由（使用requireAdmin）：**
```typescript
import { requireAdmin } from '@/lib/admin'

export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限（自动处理token验证和角色检查）
    const { payload } = await requireAdmin(request)

    // 执行业务逻辑...
  } catch (error: any) {
    if (error.message === 'ADMIN_REQUIRED') {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 })
    }
    // 其他错误处理...
  }
}
```

**2. 普通用户路由（手动验证token）：**
```typescript
import { verifyToken } from '@/lib/jwt'

export async function GET(request: NextRequest) {
  // 从Cookie获取token
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  try {
    // 验证token
    const payload = await verifyToken(token)

    // 执行业务逻辑...
  } catch (error) {
    return NextResponse.json({ error: 'Token无效或已过期' }, { status: 401 })
  }
}
```

### AI对话流程

**Coze API集成（lib/coze.ts）：**

1. **流式响应处理**：使用Server-Sent Events (SSE)返回流式数据
2. **对话历史管理**：每次对话前加载历史记录，AI回复后保存
3. **错误处理**：API错误时返回友好提示，保存错误消息到历史
4. **自动滚动**：前端通过自定义hook处理流式消息的UI更新

**关键点：**
- Coze API使用`botId`和`apiToken`连接
- 对话历史通过`conversation_id`关联（可选功能）
- 流式响应通过AsyncIterable迭代器处理
- 核心函数：
  - `chatWithAgent(botId, message, conversationId?, userId?)` - 发送消息获取流式响应
  - `saveChatHistory()` - 保存对话历史到数据库
  - `getChatHistory()` - 获取历史记录
  - `getOrCreateConversationId()` - 获取或创建会话ID

### 激活码系统

**激活流程：**
1. 用户在"我的智能体"页面输入激活码
2. 系统验证激活码状态（UNUSED）和对应的智能体
3. 检查用户是否已拥有该智能体（`UserAgent`唯一性）
4. 创建`UserAgent`记录，更新激活码状态为ACTIVATED
5. 跳转到聊天页面

**批量生成：**
- 管理员可以为指定智能体批量生成激活码
- 支持CSV导出（逗号分隔的激活码列表）

### 系列盲盒系统

**Series（系列）数据模型：**
- 一个系列包含多个智能体（Agent）
- 用户购买系列盲盒时，会随机获得该系列中的一个智能体
- 系列有价格、库存、封面图等属性
- 订单可以关联系列（`seriesId`）或直接关联智能体（`agentId`，兼容旧数据）

**盲盒购买流程：**
1. 用户在商城选择系列盲盒
2. 创建订单，状态为PENDING
3. 系统为该系列随机分配一个未使用的激活码
4. 更新激活码状态，关联到订单
5. 用户在"我的智能体"中使用激活码解锁智能体

## 重要配置文件

### 环境变量

**必需变量（.env）：**
```env
# JWT密钥（生产环境必须更改）
JWT_SECRET="your-secret-key-here"

# Coze AI配置
COZE_API_TOKEN="sat_xxx..."
COZE_BOT_ID="7428933434510770211"

# 数据库连接
DATABASE_URL="file:./dev.db"  # 开发环境
# DATABASE_URL="postgresql://..."  # 生产环境
```

### Prisma配置

**数据库切换：**
- 开发环境使用SQLite（`prisma/dev.db`）
- 生产环境使用PostgreSQL（通过环境变量`DATABASE_URL`配置）
- 模型定义在`prisma/schema.prisma`中
- 种子数据在`prisma/seed.ts`中

### 测试账号

种子数据预置了两个测试账号：
- **管理员**：admin@ponta-ponta.com / password123
- **普通用户**：test@example.com / password123

## 开发最佳实践

### 代码风格

- **组件设计**：使用shadcn/ui作为基础，优先复用现有组件
- **表单验证**：统一使用React Hook Form + Zod
- **错误处理**：API路由统一返回`{ error: string }`格式
- **Toast通知**：使用`sonner`库，`toast.success()` / `toast.error()`

### 添加新功能时的检查清单

1. **API路由**：在`app/api/`下创建对应的REST端点
2. **权限验证**：
   - 管理员功能：使用`requireAdmin(request)`（来自`lib/admin.ts`）
   - 普通用户：使用`verifyToken(token)`（来自`lib/jwt.ts`）
3. **数据验证**：使用Zod schema验证输入
4. **前端组件**：在`components/`下创建对应的React组件
5. **类型定义**：所有新数据结构都要有TypeScript类型
6. **Prisma更新**：如需修改数据模型，记得运行`pnpm prisma migrate dev`

### 常见陷阱

⚠️ **中文昵称编码问题**：Windows cmd下UTF-8显示可能异常，建议使用PowerShell或Git Bash

⚠️ **激活码唯一性**：一个用户对同一个智能体只能激活一次（通过`UserAgent`的`@@unique([userId, agentId])`约束）

⚠️ **流式响应处理**：AI对话的流式响应需要正确处理AsyncIterable，不能使用常规的JSON解析

⚠️ **环境变量同步**：Vercel部署时需要在控制台手动设置环境变量

⚠️ **权限检查错误处理**：使用`requireAdmin()`时必须捕获`ADMIN_REQUIRED`错误并返回403状态码

⚠️ **Prisma关联查询**：智能体的`abilities`字段存储为JSON字符串，查询后需要用`JSON.parse()`解析

⚠️ **软删除机制**：Agent模型有`deletedAt`字段，查询时应该使用`where: { deletedAt: null }`过滤已删除记录

## 部署注意事项

### Vercel部署流程

1. **连接GitHub仓库**到Vercel
2. **配置环境变量**（在Vercel控制台）：
   - `JWT_SECRET`（强随机字符串）
   - `COZE_API_TOKEN`
   - `COZE_BOT_ID`
   - `DATABASE_URL`（PostgreSQL连接字符串）
3. **运行数据库迁移**：
   ```bash
   vercel env pull .env.local
   pnpm prisma migrate deploy
   pnpm prisma db seed
   ```

### 数据库选择

- **开发环境**：SQLite（文件数据库，无需配置）
- **生产环境**：推荐使用Vercel Postgres或Supabase
- **连接池**：Prisma自动处理，无需额外配置

### 性能优化建议

- 图片使用Next.js Image组件优化
- API响应考虑添加Redis缓存
- 静态资源使用CDN加速（Vercel自动处理）
- 考虑使用数据库索引优化查询（已在schema中定义）

## 项目特定功能

### 规格工作流系统

项目集成了`.spec-workflow/`目录，用于规范化功能开发流程：

- `templates/` - 默认文档模板
- `user-templates/` - 自定义模板（优先级更高）
- `specs/` - 功能规格文档
- `steering/` - 项目指导文档

开发新功能时，使用MCP工具`spec-workflow-guide`获取完整流程说明。

### 已知限制

- 暂未集成支付功能（订单状态为PENDING，需要手动更新）
- 暂未实现NFC芯片的Web API集成（目前仅支持激活码方式）
- Coze API错误处理可以更详细
- 暂无自动化测试覆盖

---

**最后更新**：2025-12-26
**项目状态**：生产就绪，已完成核心功能开发
**文档维护**：如有架构变动，请及时更新此文档以保持与代码同步
