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
  ├─→ ChatHistory[] (对话历史)
  ├─→ Exchange[] (发布的交换信息)
  └─→ ExchangeProposal[] (发起的交换请求)

Agent (智能体角色)
  ├─→ series (所属系列，可选)
  ├─→ Order[] (被购买的订单)
  ├─→ UserAgent[] (被激活的实例)
  ├─→ ActivationCode[] (关联的激活码)
  ├─→ ChatHistory[] (对话历史)
  ├─→ Exchange[] (被想要的交换)
  └─→ wantedByExchanges[] (被想要的交换)

Order (订单)
  ├─→ user (购买用户)
  ├─→ series (购买的系列，可选)
  ├─→ agent (直接购买的智能体，兼容旧数据)
  └─→ activationCode (关联的激活码，一对一)

ActivationCode (激活码)
  ├─→ agent (属于哪个智能体)
  ├─→ user (被哪个用户激活)
  ├─→ order (关联订单，可选)
  ├─→ userAgent (激活后创建的UserAgent实例)
  ├─→ exchange (发布的交换信息，一对一)
  └─→ exchangeProposals[] (被用于的交换请求)

UserAgent (用户拥有的智能体实例)
  ├─→ user (所属用户)
  ├─→ agent (对应的智能体角色)
  ├─→ activationCode (使用的激活码)
  └─→ ChatHistory[] (该实例的对话历史)

Exchange (交换发布)
  ├─→ user (发布用户)
  ├─→ activationCode (提供的激活码，一对一)
  ├─→ wantedAgent (想要的智能体)
  └─→ proposals[] (收到的交换请求)

ExchangeProposal (交换请求)
  ├─→ exchange (关联的交换信息)
  ├─→ proposer (发起用户)
  └─→ proposerCode (发起者提供的激活码)
```

**重要关系：**
- **Series → Agent**：一个系列包含多个智能体，智能体可以不属于任何系列
- **Order支持两种模式**：购买系列盲盒（`seriesId`）或直接购买智能体（`agentId`，兼容旧数据）
- **用户激活码后**，会创建一个`UserAgent`记录（一个用户对同一个智能体只能有一个实例）
- **UserAgent唯一性**：通过`userId + agentId`的唯一索引保证重复激活
- **对话历史关联**：通过`userAgentId`关联到具体的智能体实例
- **交换系统关系**：
  - `Exchange.activationCodeId`是唯一索引，一个激活码只能发布一次
  - `ExchangeProposal`关联到`Exchange`和发起者提供的`ActivationCode`
  - 交换成功后，两个激活码的`userId`互换，并创建/更新对应的`UserAgent`记录
  - 通过upsert确保用户对同一智能体只有一个UserAgent记录（即使重复获得也会更新）

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

**双Provider架构（lib/ai-provider.ts）：**

项目支持两种AI Provider，通过统一的`AIProvider`接口实现：

1. **CozeProvider（维护会话状态）**：
   - 使用`botId`和`apiToken`连接Coze API
   - 自动管理`conversationId`，无需手动传递历史
   - 支持多模态图片输入（Base64格式）
   - 核心函数：`chat(message, conversationId?, history?, images?)`

2. **OpenAIProvider（手动传递历史）**：
   - 支持OpenAI兼容接口（如DeepSeek、SiliconFlow等）
   - 需要配置`endpoint`、`apiKey`、`model`、`systemPrompt`
   - 手动传递历史消息（限制20条）
   - 支持多模态图片输入（Base64格式）

**流式响应处理（app/api/chat/route.ts）：**
- 使用Server-Sent Events (SSE)返回流式数据
- 对话历史通过`conversationId`关联（Coze自动维护）
- 前端通过自定义hook处理流式消息的UI更新
- 图片附件功能：支持上传Base64图片进行多模态对话

**关键点：**
- 图片上传：Coze需要先调用`/v1/files/upload`上传图片获取`file_id`
- 历史管理：OpenAI Provider需要手动加载和传递历史记录
- 错误处理：API错误时返回友好提示，保存错误消息到历史
- 核心函数：
  - `createProvider(agent)` - 根据Agent配置创建Provider实例
  - `chat(message, conversationId?, history?, images?)` - 发送消息获取流式响应
  - `saveChatHistory()` - 保存对话历史到数据库
  - `getChatHistory()` - 获取历史记录
  - `getOrCreateConversationId()` - 获取或创建会话ID

### 多模态图片识别功能

**功能概述：**
用户可以在对话中上传图片，AI智能体能够识别图片内容并进行分析。支持同时上传多张图片（最多3张），实现图文混合对话。

**数据接口（ImageAttachment）：**
```typescript
interface ImageAttachment {
  id: string        // 唯一标识（时间戳+随机数）
  base64: string    // 图片Base64编码（含data:image前缀）
  name: string      // 原始文件名
}
```

**前端实现（components/chat/ChatInterface.tsx）：**
1. **图片选择与验证：**
   - 使用`<input type="file">`选择图片文件
   - 文件类型验证：必须为`image/*`类型
   - 文件大小限制：单张图片最大10MB
   - 数量限制：一次对话最多上传3张图片

2. **Base64转换：**
   - 使用`FileReader.readAsDataURL()`转换为Base64
   - 保存格式：`data:image/jpeg;base64,/9j/4AAQ...`

3. **UI交互：**
   - 输入框上方显示图片缩略图
   - 支持点击X按钮删除已选图片
   - 提交时图片随消息一起发送到后端

**后端处理（双Provider差异）：**

1. **CozeProvider（lib/providers/coze.ts）：**
   - **先上传后发送**：调用`/v1/files/upload` API上传图片
   - 使用`axios` + `form-data`构建multipart请求
   - 获取返回的`file_id`（如：`7428933434510770211`）
   - **多模态消息格式**：
   ```json
   {
     "role": "user",
     "content_type": "object_string",
     "content": [
       { "type": "image", "file_id": "xxx" },
       { "type": "image", "file_id": "yyy" },
       { "type": "text", "text": "用户描述" }
     ]
   }
   ```

2. **OpenAIProvider（lib/providers/openai.ts）：**
   - **直接使用Base64**：无需预先上传图片
   - **多模态消息格式**（OpenAI标准）：
   ```json
   {
     "role": "user",
     "content": [
       {
         "type": "image_url",
         "image_url": { "url": "data:image/jpeg;base64,/9j/4AAQ..." }
       },
       { "type": "text", "text": "用户描述" }
     ]
   }
   ```

**数据存储：**
- 图片数据保存在`ChatHistory`表的`images`字段（JSON字符串）
- 查询时需要用`JSON.parse()`解析
- 支持从历史记录中加载并显示图片

**使用场景：**
- 用户拍照上传让AI识别物体
- 上传截图让AI分析问题
- 上传图片让AI描述内容
- 医疗影像识别、文档OCR等

**注意事项：**
⚠️ **Base64数据量大**：单张图片Base64后约为原大小的4/3，注意前端内存和后端请求体大小
⚠️ **Coze API限制**：需要确保图片格式为JPEG/PNG，避免上传不支持格式
⚠️ **历史消息体积**：图片数据会显著增加数据库存储，建议定期清理或实施归档策略
⚠️ **纯图片消息**：允许message为空字符串，只发送图片（用户可以只发图不说话）

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

### 智能体交换系统

**Exchange（交换）数据模型：**
- 用户可以发布自己拥有的智能体的重复激活码到交易市场
- 指定自己想要交换的智能体
- 其他用户可以发起交换请求，提供发布者想要的智能体激活码
- 发布者接受后，系统自动交换两个激活码的拥有者

**交换流程：**

1. **发布交换（POST /api/exchange/publish）：**
   - 用户输入激活码和想要的智能体ID
   - 验证激活码状态（必须是UNUSED）
   - 验证用户是否已拥有该智能体（防止发布未激活的）
   - 创建Exchange记录，状态为PENDING

2. **浏览市场（GET /api/exchange/market）：**
   - 查看所有PENDING状态的交换信息
   - 不显示激活码code（隐藏敏感信息）
   - 筛选条件：agentId、seriesId、status

3. **发起交换请求（POST /api/exchange/propose）：**
   - 选择一个交换信息，提供自己的激活码
   - 验证激活码状态和智能体匹配度
   - 创建ExchangeProposal记录，状态为PENDING

4. **处理请求（PUT /api/exchange/handle）：**
   - 发布者接受或拒绝交换请求
   - 接受：在事务中交换两个激活码的拥有者，更新UserAgent记录
   - 拒绝：仅更新proposal状态为REJECTED

5. **直接交换（POST /api/exchange/direct-trade）：**
   - 双方同意后，通过直接交换API完成交易
   - 交换两个激活码的userId和状态

**关键点：**
- Exchange状态：PENDING（待交换）→ TRADING（交易中）→ COMPLETED（已完成）/ CANCELLED（已取消）
- ExchangeProposal状态：PENDING（待处理）→ ACCEPTED（已接受）/ REJECTED（已拒绝）/ CANCELLED（已取消）
- 防止重复发布：同一个激活码不能同时在多个交换中
- UserAgent唯一性：通过upsert确保用户对同一智能体只有一个记录
- 统计数据：交换成功后更新双方的totalAgents计数

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

### 语音对话功能

**功能概述：**
PONT-PONTA平台集成了完整的语音交互能力，支持语音输入（STT）、语音输出（TTS）和端到端语音对话，使用火山引擎语音服务（豆包同款）。

**核心功能：**

1. **语音输入（STT - Speech to Text）**
   - 点击麦克风按钮开始录音
   - 实时显示音量波形动画
   - 录音时长限制：60秒
   - 自动调用火山引擎ASR API识别语音
   - 识别结果自动填入输入框

2. **语音输出（TTS - Text to Speech）**
   - 每条AI回复下方显示播放按钮
   - 支持播放控制（播放/暂停/进度条）
   - 支持音速调节（0.5x - 2.0x）
   - 多种音色可选（女声/男声/童声）

3. **端到端语音对话（规划中）**
   - 自动语音识别 + 播放循环
   - 解放双手的免提对话模式

**技术实现：**

```
lib/volcengine/
├── auth.ts              # 火山引擎HMAC-SHA1签名认证
├── types.ts             # ASR/TTS类型定义
├── asr.ts               # 语音识别服务（音频→文字）
└── tts.ts               # 语音合成服务（文字→音频）

app/api/voice/
├── asr/route.ts         # POST /api/voice/asr
└── tts/route.ts         # POST /api/voice/tts

hooks/
├── useVoiceRecorder.ts  # 录音逻辑Hook（MediaRecorder API）
└── useVoicePlayer.ts    # 播放逻辑Hook（Web Audio API）

components/chat/
├── VoiceRecorder.tsx    # 录音UI组件（麦克风+波形+时长）
└── VoicePlayer.tsx      # 播放UI组件（播放器+进度条+音速）
```

**使用方法：**

1. **语音输入：**
   - 在聊天界面点击麦克风按钮（🎤）
   - 允许浏览器访问麦克风权限
   - 开始说话，可以看到实时音量波形
   - 再次点击停止，系统自动识别语音
   - 识别结果自动填入输入框

2. **语音输出：**
   - 每条AI消息下方显示VoicePlayer组件
   - 点击播放按钮（▶️）开始播放语音
   - 支持拖动进度条跳转
   - 点击音速按钮切换（1.0x / 1.5x / 2.0x）

**API端点：**

- `POST /api/voice/asr` - 语音识别
  - Content-Type: multipart/form-data
  - Body: audio（文件）、format（格式）、sampleRate（采样率）
  - Response: `{ success: true, text: "识别到的文字" }`

- `POST /api/voice/tts` - 语音合成
  - Content-Type: application/json
  - Body: `{ text: "要合成的文字", voiceType: "音色ID", speed: 1.0 }`
  - Response: 音频二进制数据（audio/mpeg）

**环境变量配置：**

```env
# 火山引擎语音服务（豆包同款）
VOLCENGINE_APP_ID=6500723094
VOLCENGINE_ACCESS_KEY_ID=c0CfuUGCqJMEw8QD53pdiTmwcLAA6Ki_
VOLCENGINE_SECRET_ACCESS_KEY=vUfTeTEM4_-O-v3wPRlaKqtOSEp6tLCG
```

**获取方式：**
1. 注册火山引擎账号：https://console.volcengine.com/
2. 开通语音识别（ASR）和语音合成（TTS）服务
3. 在控制台获取APP_ID、ACCESS_KEY_ID、SECRET_ACCESS_KEY

**支持的音色：**
- `zh_female_shuangkuaisisi_moon_bigtts` - 女声快思（默认）
- `zh_female_wennuannuan_moon_bigtts` - 女声温暖
- `zh_male_qingxing_moon_bigtts` - 男声磁性
- `zh_child_qingxin_moon_bigtts` - 童声活泼

**注意事项：**
⚠️ **麦克风权限**：首次使用需要允许浏览器访问麦克风
⚠️ **HTTPS要求**：语音功能需要HTTPS环境（或localhost）
⚠️ **音频格式**：录音格式为audio/webm，自动转换为PCM发送给ASR
⚠️ **时长限制**：单次录音最长60秒，超过自动停止
⚠️ **兼容性**：支持Chrome 80+、Safari 13+、Edge 80+
⚠️ **网络延迟**：ASR识别约1-2秒，TTS生成约1秒

**性能指标：**
- ASR识别延迟：< 2秒（从录音结束到返回文字）
- TTS生成延迟：< 1秒（从请求到返回音频）
- 端到端延迟：< 5秒（从用户说话到听到AI回复）
- 音频质量：16kHz采样率，单声道，MP3格式

**调试技巧：**
```bash
# 测试ASR API
curl -X POST http://localhost:3000/api/voice/asr \
  -H "Cookie: auth-token=YOUR_TOKEN" \
  -F "audio=@test.wav" \
  -F "format=wav"

# 测试TTS API
curl -X POST http://localhost:3000/api/voice/tts \
  -H "Cookie: auth-token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"你好，我是AI助手"}' \
  --output test.mp3
```

**参考文档：**
- [火山引擎语音识别文档](https://www.volcengine.com/docs/6561/1354869)
- [火山引擎语音合成文档](https://www.volcengine.com/docs/6561/1257584)
- 项目规格文档：`.spec-workflow/specs/voice-chat/`

### 已知限制

- 暂未集成支付功能（订单状态为PENDING，需要手动更新）
- 暂未实现NFC芯片的Web API集成（目前仅支持激活码方式）
- Coze API错误处理可以更详细
- 暂无自动化测试覆盖
- 端到端语音通话模式（语音循环）尚未实现

---

**最后更新**：2025-01-02
**项目状态**：生产就绪，已完成核心功能开发 + 语音对话功能
**文档维护**：如有架构变动，请及时更新此文档以保持与代码同步
