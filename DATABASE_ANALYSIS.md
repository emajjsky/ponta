# 碰嗒碰嗒 (PONT-PONTA) 数据库设计分析文档

> **文档版本**：v1.0
> **创建日期**：2025-12-26
> **数据库类型**：SQLite (开发) / PostgreSQL (生产)
> **ORM框架**：Prisma 5.22.0

---

## 📋 目录

1. [数据库配置](#数据库配置)
2. [核心设计理念](#核心设计理念)
3. [数据表结构详解](#数据表结构详解)
4. [关系设计分析](#关系设计分析)
5. [索引策略](#索引策略)
6. [数据约束与完整性](#数据约束与完整性)
7. [业务逻辑实现](#业务逻辑实现)
8. [迁移历史](#迁移历史)
9. [性能优化建议](#性能优化建议)
10. [安全性考虑](#安全性考虑)

---

## 数据库配置

### Prisma Schema 配置

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"  // 开发环境使用SQLite
  url      = env("DATABASE_URL")
}
```

### 环境变量

**开发环境 (`.env`)：**
```env
DATABASE_URL="file:./dev.db"
```

**生产环境：**
```env
DATABASE_URL="postgresql://user:password@host:port/database"
```

### 数据库选择策略

| 环境 | 数据库 | 原因 |
|------|--------|------|
| 开发 | SQLite | 零配置、文件存储、快速启动 |
| 生产 | PostgreSQL | 支持并发、事务完整性、云原生 |

---

## 核心设计理念

### 1. 领域驱动设计 (DDD)

数据库设计遵循业务领域模型，围绕核心业务实体：
- **用户** (User) - 系统的参与者
- **智能体** (Agent) - 核心产品
- **系列** (Series) - 盲盒产品组合
- **激活码** (ActivationCode) - 数字资产载体
- **订单** (Order) - 交易记录
- **用户智能体** (UserAgent) - 用户拥有的数字资产
- **对话历史** (ChatHistory) - 用户与AI的交互记录

### 2. 软删除机制

`Agent` 表采用软删除设计：
```prisma
deletedAt DateTime?  // NULL表示未删除，有值表示已删除
```

**优点：**
- 保留数据历史
- 可恢复误删数据
- 维护数据关联完整性
- 支持数据分析

### 3. 多对多关系的中间表设计

`UserAgent` 表作为 `User` 和 `Agent` 的中间表：
- 实现用户与智能体的多对多关系
- 记录激活时间和最后互动时间
- 通过 `@@unique([userId, agentId])` 确保唯一性

---

## 数据表结构详解

### 1. 用户表 (users)

**表名**：`users`
**主键**：`id` (CUID)
**用途**：存储用户账户信息和角色权限

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `id` | TEXT | PRIMARY KEY | CUID | 用户唯一标识 |
| `email` | TEXT | UNIQUE, NOT NULL | - | 邮箱（登录账号） |
| `password` | TEXT | NOT NULL | - | 密码（bcrypt哈希，saltRounds: 12） |
| `nickname` | TEXT | NOT NULL | - | 昵称（2-20字符） |
| `avatar` | TEXT | NULL | - | 头像URL |
| `role` | TEXT | - | "USER" | 角色：USER / ADMIN |
| `status` | TEXT | - | "ACTIVE" | 状态：ACTIVE / BANNED |
| `createdAt` | DATETIME | - | CURRENT_TIMESTAMP | 注册时间 |
| `updatedAt` | DATETIME | - | CURRENT_TIMESTAMP | 更新时间 |

**索引**：
- `users_email_key` (UNIQUE) - 邮箱唯一性约束
- `users_email_idx` - 登录查询优化

**设计亮点**：
- ✅ 使用 CUID 作为主键，比 UUID 更短且按时间排序
- ✅ 密码使用 bcrypt 加密（saltRounds: 12），安全性高
- ✅ 支持角色权限控制（USER/ADMIN）
- ✅ 支持账号封禁功能（status字段）

---

### 2. 系列表 (series)

**表名**：`series`
**主键**：`id` (CUID)
**用途**：管理盲盒系列产品

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `id` | TEXT | PRIMARY KEY | CUID | 系列唯一标识 |
| `name` | TEXT | NOT NULL | - | 系列名称 |
| `slug` | TEXT | UNIQUE, NOT NULL | - | URL友好标识符 |
| `description` | TEXT | NULL | - | 系列描述 |
| `coverImage` | TEXT | NULL | - | 封面图片URL |
| `price` | REAL | NOT NULL | - | 系列盲盒价格 |
| `order` | INTEGER | - | 0 | 显示排序 |
| `isActive` | BOOLEAN | - | true | 是否启用 |
| `createdAt` | DATETIME | - | CURRENT_TIMESTAMP | 创建时间 |
| `updatedAt` | DATETIME | - | CURRENT_TIMESTAMP | 更新时间 |

**索引**：
- `series_slug_key` (UNIQUE) - slug唯一性
- `series_slug_idx` - slug查询优化
- `series_isActive_idx` - 启用状态筛选
- `series_order_idx` - 排序查询优化

**业务逻辑**：
- 一个系列包含多个智能体（一对多关系）
- 用户购买系列盲盒时，随机获得该系列中的一个智能体
- `isActive` 控制系列是否在商城展示

---

### 3. 智能体角色表 (agents)

**表名**：`agents`
**主键**：`id` (CUID)
**用途**：存储AI智能体的完整信息

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `id` | TEXT | PRIMARY KEY | CUID | 智能体唯一标识 |
| `seriesId` | TEXT | FOREIGN KEY | NULL | 所属系列ID（可选） |
| `name` | TEXT | NOT NULL | - | 智能体名称 |
| `slug` | TEXT | UNIQUE, NOT NULL | - | URL友好标识符 |
| `botId` | TEXT | NOT NULL | - | Coze Bot ID |
| `rarity` | TEXT | NOT NULL | - | 稀有度：STANDARD / HIDDEN |
| `avatar` | TEXT | NOT NULL | - | 头像URL |
| `description` | TEXT | NOT NULL | - | 智能体描述 |
| `abilities` | TEXT | NOT NULL | - | 能力列表（JSON字符串） |
| `price` | REAL | NOT NULL | - | 单独购买价格 |
| `stock` | INTEGER | - | 0 | 库存数量 |
| `isActive` | BOOLEAN | - | true | 是否启用 |
| `systemPrompt` | TEXT | NULL | - | 系统提示词 |
| `deletedAt` | DATETIME | NULL | NULL | 软删除时间戳 |
| `createdAt` | DATETIME | - | CURRENT_TIMESTAMP | 创建时间 |
| `updatedAt` | DATETIME | - | CURRENT_TIMESTAMP | 更新时间 |

**索引**：
- `agents_slug_key` (UNIQUE) - slug唯一性
- `agents_slug_idx` - slug查询优化
- `agents_seriesId_idx` - 系列关联查询
- `agents_deletedAt_idx` - 软删除过滤
- `agents_isActive_idx` - 启用状态筛选

**外键关系**：
- `seriesId` → `series.id` (多对一)

**设计亮点**：
- ✅ `abilities` 字段存储JSON数组，灵活性高
- ✅ 软删除机制 (`deletedAt`)，保护历史数据
- ✅ 支持独立智能体或系列智能体
- ✅ `stock` 字段支持库存管理
- ✅ `systemPrompt` 可自定义AI行为

**abilities 字段示例**：
```json
["谎言识别器", "正能量激励"]  // 朱迪警官
["幽默风趣", "街头智慧"]      // 尼克狐
["家族画师", "全网情报", "命运塔罗"]  // 教父
```

---

### 4. 订单表 (orders)

**表名**：`orders`
**主键**：`id` (CUID)
**用途**：记录用户购买订单

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `id` | TEXT | PRIMARY KEY | CUID | 订单唯一标识 |
| `userId` | TEXT | FOREIGN KEY, NOT NULL | - | 购买用户ID |
| `seriesId` | TEXT | FOREIGN KEY | NULL | 购买的系列ID |
| `agentId` | TEXT | FOREIGN KEY | NULL | 兼容旧数据：直接购买智能体 |
| `activationCodeId` | TEXT | FOREIGN KEY, UNIQUE | NULL | 关联的激活码ID |
| `status` | TEXT | - | "PENDING" | 订单状态 |
| `amount` | REAL | NOT NULL | - | 订单金额 |
| `paymentMethod` | TEXT | NULL | - | 支付方式 |
| `transactionId` | TEXT | NULL | - | 支付平台交易号 |
| `createdAt` | DATETIME | - | CURRENT_TIMESTAMP | 创建时间 |
| `updatedAt` | DATETIME | - | CURRENT_TIMESTAMP | 更新时间 |

**订单状态枚举**：
- `PENDING` - 待支付
- `PAID` - 已支付
- `SHIPPED` - 已发货
- `COMPLETED` - 已完成
- `REFUNDED` - 已退款

**索引**：
- `orders_activationCodeId_key` (UNIQUE) - 激活码唯一性
- `orders_userId_idx` - 用户订单查询
- `orders_status_idx` - 状态筛选
- `orders_seriesId_idx` - 系列订单查询
- `orders_agentId_idx` - 智能体订单查询

**外键关系**：
- `userId` → `users.id` (多对一)
- `seriesId` → `series.id` (多对一，可选)
- `agentId` → `agents.id` (多对一，可选)
- `activationCodeId` → `activation_codes.id` (一对一，可选)

**业务逻辑**：
- 支持两种购买模式：系列盲盒 (`seriesId`) 或直接购买智能体 (`agentId`)
- `activationCodeId` 关联具体的激活码（一对一关系）
- 订单状态流转：PENDING → PAID → SHIPPED → COMPLETED

---

### 5. 激活码表 (activation_codes)

**表名**：`activation_codes`
**主键**：`id` (CUID)
**用途**：管理智能体激活码

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `id` | TEXT | PRIMARY KEY | CUID | 激活码唯一标识 |
| `code` | TEXT | UNIQUE, NOT NULL | - | 激活码（格式：PONTA + 10位字符） |
| `agentId` | TEXT | FOREIGN KEY, NOT NULL | - | 对应的智能体ID |
| `status` | TEXT | - | "UNUSED" | 激活码状态 |
| `userId` | TEXT | FOREIGN KEY | NULL | 激活用户ID |
| `activatedAt` | DATETIME | NULL | NULL | 激活时间 |
| `createdAt` | DATETIME | - | CURRENT_TIMESTAMP | 创建时间 |
| `updatedAt` | DATETIME | - | CURRENT_TIMESTAMP | 更新时间 |

**激活码状态枚举**：
- `UNUSED` - 未使用
- `ACTIVATED` - 已激活
- `VOID` - 已作废

**索引**：
- `activation_codes_code_key` (UNIQUE) - 激活码唯一性
- `activation_codes_code_idx` - 激活码查询
- `activation_codes_status_idx` - 状态筛选
- `activation_codes_userId_idx` - 用户激活码查询

**外键关系**：
- `agentId` → `agents.id` (多对一)
- `userId` → `users.id` (多对一，可选)

**激活码格式**：
```
PONTA + 10位随机字符（数字+大写字母）
示例：PONTA1234567890, PONTA5D1A5WQ58P
```

**设计亮点**：
- ✅ 激活码与智能体绑定，确保盲盒开出的角色
- ✅ 一个激活码只能被激活一次（通过 `UserAgent` 唯一性保证）
- ✅ 支持激活码作废（status: VOID）
- ✅ 记录激活时间和用户，便于追溯

---

### 6. 用户智能体表 (user_agents)

**表名**：`user_agents`
**主键**：`id` (CUID)
**用途**：记录用户拥有的智能体实例

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `id` | TEXT | PRIMARY KEY | CUID | 记录唯一标识 |
| `userId` | TEXT | FOREIGN KEY, NOT NULL | - | 用户ID |
| `agentId` | TEXT | FOREIGN KEY, NOT NULL | - | 智能体ID |
| `activationCodeId` | TEXT | FOREIGN KEY, UNIQUE | - | 使用的激活码ID |
| `activatedAt` | DATETIME | - | CURRENT_TIMESTAMP | 激活时间 |
| `lastChatAt` | DATETIME | NULL | NULL | 最后互动时间 |

**唯一约束**：
- `user_agents_userId_agentId_key` (UNIQUE) - 一个用户对同一智能体只能激活一次

**索引**：
- `user_agents_activationCodeId_key` (UNIQUE) - 激活码唯一性
- `user_agents_userId_idx` - 用户智能体查询
- `user_agents_agentId_idx` - 智能体用户查询

**外键关系**：
- `userId` → `users.id` (多对一)
- `agentId` → `agents.id` (多对一)
- `activationCodeId` → `activation_codes.id` (一对一)

**设计亮点**：
- ✅ **核心约束**：`@@unique([userId, agentId])` 确保重复激活保护
- ✅ 记录最后互动时间，便于排序活跃度
- ✅ 激活码与用户智能体一一对应
- ✅ 支持后续扩展（如智能体等级、经验值等）

**业务逻辑**：
1. 用户输入激活码
2. 系统验证激活码状态（UNUSED）和对应的智能体
3. 检查 `user_agents` 表是否已存在该 `userId + agentId` 组合
4. 如果不存在，创建 `UserAgent` 记录
5. 更新激活码状态为 ACTIVATED
6. 用户跳转到聊天页面

---

### 7. 对话历史表 (chat_histories)

**表名**：`chat_histories`
**主键**：`id` (CUID)
**用途**：存储用户与AI智能体的对话记录

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `id` | TEXT | PRIMARY KEY | CUID | 消息唯一标识 |
| `userId` | TEXT | FOREIGN KEY, NOT NULL | - | 用户ID |
| `agentId` | TEXT | FOREIGN KEY, NOT NULL | - | 智能体ID |
| `userAgentId` | TEXT | FOREIGN KEY, NOT NULL | - | 用户智能体实例ID |
| `role` | TEXT | NOT NULL | - | 消息角色 |
| `content` | TEXT | NOT NULL | - | 消息内容 |
| `conversationId` | TEXT | NULL | NULL | Coze对话ID |
| `createdAt` | DATETIME | - | CURRENT_TIMESTAMP | 消息时间 |

**消息角色枚举**：
- `user` - 用户消息
- `assistant` - AI回复

**索引**：
- `chat_histories_userId_idx` - 用户对话历史
- `chat_histories_agentId_idx` - 智能体对话历史
- `chat_histories_conversationId_idx` - Coze会话查询

**外键关系**：
- `userId` → `users.id` (多对一)
- `agentId` → `agents.id` (多对一)
- `userAgentId` → `user_agents.id` (多对一)

**设计亮点**：
- ✅ 通过 `userAgentId` 关联到具体的智能体实例
- ✅ 保留 `conversationId` 用于与Coze API的会话管理
- ✅ 按时间升序存储，便于加载历史记录
- ✅ 支持多轮对话的上下文管理

**查询示例**：
```typescript
// 获取用户与特定智能体的对话历史
const history = await prisma.chatHistory.findMany({
  where: {
    userId,
    agentId,
  },
  orderBy: {
    createdAt: 'asc',
  },
  take: 50, // 限制返回数量
})
```

---

## 关系设计分析

### ER关系图

```
┌─────────────┐
│   User      │ (用户)
│ 用户表      │
└──────┬──────┘
       │
       ├──────────────────────┬──────────────────┬─────────────────────┐
       │                      │                  │                     │
       ▼                      ▼                  ▼                     ▼
┌──────────────┐     ┌──────────────┐   ┌──────────────┐   ┌───────────────┐
│    Order     │     │  UserAgent   │   │ActivationCode│   │ ChatHistory   │
│    订单表     │     │  用户智能体   │   │   激活码表    │   │   对话历史     │
└──────┬───────┘     └──────┬───────┘   └──────┬───────┘   └───────┬───────┘
       │                    │                  │                     │
       │                    │                  │                     │
       ▼                    ▼                  ▼                     ▼
┌──────────────┐     ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Series     │     │    Agent     │   │    Agent     │   │    Agent     │
│   系列表      │     │  智能体表     │   │  智能体表     │   │  智能体表     │
└──────────────┘     └──────────────┘   └──────────────┘   └──────────────┘
       │                    ▲                  ▲                     ▲
       └────────────────────┴──────────────────┴─────────────────────┘
                    一对多关系 (Series → Agent)
                    一对多关系 (Agent → UserAgent/ActivationCode/ChatHistory)
```

### 关系详解

#### 1. User → Order (一对多)

**关系**：一个用户可以有多个订单
**外键**：`orders.userId → users.id`
**级联规则**：`ON DELETE RESTRICT` - 防止误删用户

**查询示例**：
```typescript
const userOrders = await prisma.order.findMany({
  where: { userId: user.id },
  include: {
    series: true,
    agent: true,
  },
})
```

#### 2. Series → Agent (一对多)

**关系**：一个系列包含多个智能体，一个智能体可以不属于任何系列
**外键**：`agents.seriesId → series.id`
**可选性**：`seriesId` 可为 NULL（独立智能体）

**查询示例**：
```typescript
const seriesWithAgents = await prisma.series.findUnique({
  where: { id: seriesId },
  include: {
    agents: {
      where: {
        deletedAt: null,  // 只查询未删除的智能体
        isActive: true,   // 只查询启用的智能体
      },
    },
  },
})
```

#### 3. Agent → ActivationCode (一对多)

**关系**：一个智能体可以有多个激活码
**外键**：`activation_codes.agentId → agents.id`
**业务逻辑**：批量生成激活码时，每个激活码绑定到特定智能体

#### 4. Agent → UserAgent (一对多)

**关系**：一个智能体可以被多个用户激活
**外键**：`user_agents.agentId → agents.id`
**唯一约束**：`@@unique([userId, agentId])` - 一个用户对同一智能体只能激活一次

#### 5. User → UserAgent (一对多)

**关系**：一个用户可以拥有多个智能体
**外键**：`user_agents.userId → users.id`

#### 6. ActivationCode → Order (一对一)

**关系**：一个激活码只能关联一个订单
**外键**：`orders.activationCodeId → activation_codes.id`
**唯一约束**：`orders.activationCodeId @unique`

#### 7. ActivationCode → UserAgent (一对一)

**关系**：一个激活码激活后创建一个用户智能体实例
**外键**：`user_agents.activationCodeId → activation_codes.id`
**唯一约束**：`user_agents.activationCodeId @unique`

#### 8. UserAgent → ChatHistory (一对多)

**关系**：一个用户智能体实例可以有多条对话记录
**外键**：`chat_histories.userAgentId → user_agents.id`

---

## 索引策略

### 索引设计原则

1. **主键索引**：所有表都有主键索引（自动创建）
2. **唯一性约束**：email、slug、code 等字段建立唯一索引
3. **外键索引**：所有外键字段建立普通索引，优化 JOIN 查询
4. **查询优化**：根据常用查询条件建立复合索引

### 索引清单

#### users 表

| 索引名 | 类型 | 字段 | 用途 |
|--------|------|------|------|
| PRIMARY | PRIMARY KEY | id | 主键查询 |
| users_email_key | UNIQUE | email | 邮箱唯一性约束 |
| users_email_idx | INDEX | email | 登录查询优化 |

#### agents 表

| 索引名 | 类型 | 字段 | 用途 |
|--------|------|------|------|
| PRIMARY | PRIMARY KEY | id | 主键查询 |
| agents_slug_key | UNIQUE | slug | slug唯一性约束 |
| agents_slug_idx | INDEX | slug | URL路由查询 |
| agents_seriesId_idx | INDEX | seriesId | 系列智能体查询 |
| agents_deletedAt_idx | INDEX | deletedAt | 软删除过滤 |
| agents_isActive_idx | INDEX | isActive | 启用状态筛选 |

#### series 表

| 索引名 | 类型 | 字段 | 用途 |
|--------|------|------|------|
| PRIMARY | PRIMARY KEY | id | 主键查询 |
| series_slug_key | UNIQUE | slug | slug唯一性约束 |
| series_slug_idx | INDEX | slug | URL路由查询 |
| series_isActive_idx | INDEX | isActive | 启用系列筛选 |
| series_order_idx | INDEX | order | 排序查询优化 |

#### orders 表

| 索引名 | 类型 | 字段 | 用途 |
|--------|------|------|------|
| PRIMARY | PRIMARY KEY | id | 主键查询 |
| orders_activationCodeId_key | UNIQUE | activationCodeId | 激活码唯一性 |
| orders_userId_idx | INDEX | userId | 用户订单查询 |
| orders_status_idx | INDEX | status | 订单状态筛选 |
| orders_seriesId_idx | INDEX | seriesId | 系列订单查询 |
| orders_agentId_idx | INDEX | agentId | 智能体订单查询 |

#### activation_codes 表

| 索引名 | 类型 | 字段 | 用途 |
|--------|------|------|------|
| PRIMARY | PRIMARY KEY | id | 主键查询 |
| activation_codes_code_key | UNIQUE | code | 激活码唯一性 |
| activation_codes_code_idx | INDEX | code | 激活码查询 |
| activation_codes_status_idx | INDEX | status | 状态筛选 |
| activation_codes_userId_idx | INDEX | userId | 用户激活码查询 |

#### user_agents 表

| 索引名 | 类型 | 字段 | 用途 |
|--------|------|------|------|
| PRIMARY | PRIMARY KEY | id | 主键查询 |
| user_agents_activationCodeId_key | UNIQUE | activationCodeId | 激活码唯一性 |
| user_agents_userId_agentId_key | UNIQUE | userId, agentId | 重复激活保护 |
| user_agents_userId_idx | INDEX | userId | 用户智能体查询 |
| user_agents_agentId_idx | INDEX | agentId | 智能体用户查询 |

#### chat_histories 表

| 索引名 | 类型 | 字段 | 用途 |
|--------|------|------|------|
| PRIMARY | PRIMARY KEY | id | 主键查询 |
| chat_histories_userId_idx | INDEX | userId | 用户对话历史 |
| chat_histories_agentId_idx | INDEX | agentId | 智能体对话历史 |
| chat_histories_conversationId_idx | INDEX | conversationId | Coze会话查询 |

### 索引优化建议

✅ **已优化**：
- 外键字段全部建立索引
- 常用查询条件建立索引（status, isActive, deletedAt）
- 唯一性约束建立唯一索引

⚠️ **未来优化方向**：
- 考虑添加复合索引：`(userId, agentId, createdAt)` 用于对话历史查询
- 考虑添加部分索引：只索引 `isActive: true` 的智能体
- 考虑添加全文索引：`agents.name`, `agents.description` 支持全文搜索

---

## 数据约束与完整性

### 主键约束

所有表都使用 **CUID** 作为主键：
```prisma
id String @id @default(cuid())
```

**CUID 优势**：
- 比 UUID 更短（25字符 vs 36字符）
- 按时间排序，便于索引
- 防冲突性强
- URL安全

### 外键约束

#### 级联删除策略

**RESTRICT（限制删除）**：
- `orders.userId → users.id`
- `orders.agentId → agents.id`
- `activation_codes.agentId → agents.id`
- `user_agents` 的所有外键

**用途**：防止误删数据，保护关联数据完整性

**SET NULL（置空）**：
- `orders.activationCodeId → activation_codes.id`
- `activation_codes.userId → users.id`

**用途**：允许删除父记录，子记录的外键设为 NULL

### 唯一性约束

| 表 | 字段 | 用途 |
|---|------|------|
| users | email | 邮箱唯一（登录账号） |
| agents | slug | URL唯一标识符 |
| series | slug | URL唯一标识符 |
| activation_codes | code | 激活码唯一 |
| orders | activationCodeId | 一个激活码只能关联一个订单 |
| user_agents | activationCodeId | 一个激活码只能创建一个用户智能体 |
| user_agents | userId + agentId | 防止重复激活 |

### 检查约束（应用层）

虽然 SQLite 检查约束支持有限，但在应用层实现：

**邮箱格式验证** (`lib/auth.ts`)：
```typescript
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
```

**密码强度验证** (`lib/auth.ts`)：
```typescript
export function isValidPassword(password: string): boolean {
  if (password.length < 8) return false
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  return hasLetter && hasNumber
}
```

**昵称格式验证** (`lib/auth.ts`)：
```typescript
export function isValidNickname(nickname: string): boolean {
  if (nickname.length < 2 || nickname.length > 20) return false
  const nicknameRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_-]+$/
  return nicknameRegex.test(nickname)
}
```

### 数据完整性保护

#### 1. 防止重复激活

**数据库层**：
```prisma
@@unique([userId, agentId])  // user_agents 表
```

**应用层检查** (`app/api/activate/route.ts`)：
```typescript
// 检查用户是否已拥有该智能体
const existingUserAgent = await prisma.userAgent.findUnique({
  where: {
    userId_agentId: {
      userId: user.id,
      agentId: activationCode.agentId,
    },
  },
})

if (existingUserAgent) {
  return NextResponse.json(
    { error: '你已经拥有这个智能体了' },
    { status: 400 }
  )
}
```

#### 2. 激活码状态验证

**状态流转**：
```
UNUSED → ACTIVATED (激活成功)
UNUSED → VOID (作废)
```

**应用层验证**：
```typescript
if (activationCode.status !== 'UNUSED') {
  return NextResponse.json(
    { error: '激活码无效或已使用' },
    { status: 400 }
  )
}
```

#### 3. 软删除保护

**查询时自动过滤**：
```typescript
const agents = await prisma.agent.findMany({
  where: {
    deletedAt: null,  // 只查询未删除的记录
  },
})
```

---

## 业务逻辑实现

### 1. 用户注册与认证流程

#### 注册流程

```mermaid
graph LR
    A[用户输入信息] --> B{邮箱格式验证}
    B -->|无效| C[返回错误]
    B -->|有效| D{密码强度验证}
    D -->|不符合| C
    D -->|符合| E{昵称格式验证}
    E -->|不符合| C
    E -->|符合| F{邮箱是否已存在}
    F -->|已存在| C
    F -->|不存在| G[bcrypt加密密码]
    G --> H[创建用户记录]
    H --> I[生成JWT Token]
    I --> J[设置HttpOnly Cookie]
    J --> K[返回成功]
```

**核心代码** (`app/api/auth/register/route.ts`)：
```typescript
import { hashPassword, isValidEmail, isValidPassword, isValidNickname } from '@/lib/auth'
import { generateToken } from '@/lib/jwt'

// 1. 验证输入
if (!isValidEmail(email)) {
  return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 })
}

if (!isValidPassword(password)) {
  return NextResponse.json(
    { error: '密码至少8个字符，包含字母和数字' },
    { status: 400 }
  )
}

if (!isValidNickname(nickname)) {
  return NextResponse.json(
    { error: '昵称长度2-20字符，支持中英文、数字、下划线、连字符' },
    { status: 400 }
  )
}

// 2. 检查邮箱是否已存在
const existingUser = await prisma.user.findUnique({
  where: { email },
})

if (existingUser) {
  return NextResponse.json({ error: '该邮箱已被注册' }, { status: 409 })
}

// 3. 加密密码
const hashedPassword = await hashPassword(password)

// 4. 创建用户
const user = await prisma.user.create({
  data: {
    email,
    password: hashedPassword,
    nickname,
  },
})

// 5. 生成JWT Token
const token = await generateToken({
  userId: user.id,
  email: user.email,
  nickname: user.nickname,
  role: user.role,
})
```

#### 登录流程

```mermaid
graph LR
    A[用户输入邮箱密码] --> B[查询用户记录]
    B --> C{用户存在?}
    C -->|不存在| D[返回错误]
    C -->|存在| E[bcrypt比对密码]
    E --> F{密码正确?}
    F -->|错误| D
    F -->|正确| G{账号状态?}
    G -->|BANNED| H[返回账号封禁]
    G -->|ACTIVE| I[生成JWT Token]
    I --> J[设置HttpOnly Cookie]
    J --> K[返回成功]
```

**核心代码** (`app/api/auth/login/route.ts`)：
```typescript
import { comparePassword } from '@/lib/auth'
import { verifyToken, generateToken } from '@/lib/jwt'

// 1. 查询用户
const user = await prisma.user.findUnique({
  where: { email },
})

if (!user) {
  return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 })
}

// 2. 比对密码
const isPasswordValid = await comparePassword(password, user.password)

if (!isPasswordValid) {
  return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 })
}

// 3. 检查账号状态
if (user.status === 'BANNED') {
  return NextResponse.json({ error: '该账号已被封禁' }, { status: 403 })
}

// 4. 生成Token
const token = await generateToken({
  userId: user.id,
  email: user.email,
  nickname: user.nickname,
  role: user.role,
})

// 5. 设置Cookie
const response = NextResponse.json({
  success: true,
  user: {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    role: user.role,
  },
})

response.cookies.set('auth-token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7, // 7天
  path: '/',
})
```

### 2. 激活码激活流程

```mermaid
graph LR
    A[用户输入激活码] --> B[查询激活码记录]
    B --> C{激活码存在?}
    C -->|不存在| D[返回激活码无效]
    C -->|存在| E{状态是否为UNUSED?}
    E -->|不是| D
    E -->|是| F[检查对应智能体]
    F --> G{智能体存在?}
    G -->|不存在| H[返回智能体不存在]
    G -->|存在| I{用户是否已拥有?}
    I -->|已拥有| J[返回已拥有提示]
    I -->|未拥有| K[开启事务]
    K --> L[创建UserAgent记录]
    L --> M[更新激活码状态]
    M --> N[提交事务]
    N --> O[返回成功]
```

**核心代码** (`app/api/activate/route.ts`)：
```typescript
import { verifyToken } from '@/lib/jwt'

// 1. 验证用户身份
const token = request.cookies.get('auth-token')?.value
const payload = await verifyToken(token)

// 2. 查询激活码
const activationCode = await prisma.activationCode.findUnique({
  where: { code },
  include: {
    agent: true,
  },
})

if (!activationCode) {
  return NextResponse.json({ error: '激活码不存在' }, { status: 404 })
}

// 3. 检查激活码状态
if (activationCode.status !== 'UNUSED') {
  return NextResponse.json({ error: '激活码已使用或已作废' }, { status: 400 })
}

// 4. 检查用户是否已拥有该智能体
const existingUserAgent = await prisma.userAgent.findUnique({
  where: {
    userId_agentId: {
      userId: payload.userId,
      agentId: activationCode.agentId,
    },
  },
})

if (existingUserAgent) {
  return NextResponse.json(
    { error: '你已经拥有这个智能体了' },
    { status: 400 }
  )
}

// 5. 使用事务创建记录
await prisma.$transaction(async (tx) => {
  // 创建UserAgent记录
  await tx.userAgent.create({
    data: {
      userId: payload.userId,
      agentId: activationCode.agentId,
      activationCodeId: activationCode.id,
    },
  })

  // 更新激活码状态
  await tx.activationCode.update({
    where: { id: activationCode.id },
    data: {
      status: 'ACTIVATED',
      userId: payload.userId,
      activatedAt: new Date(),
    },
  })
})

return NextResponse.json({
  success: true,
  message: '激活成功',
  agent: activationCode.agent,
})
```

### 3. AI对话流程

```mermaid
graph LR
    A[用户发送消息] --> B[加载对话历史]
    B --> C[调用Coze API]
    C --> D[流式返回AI回复]
    D --> E[保存对话记录]
    E --> F[返回给用户]
```

**核心代码** (`lib/coze.ts` 和 `app/api/chat/route.ts`)：

**1. 加载对话历史**：
```typescript
export async function getChatHistory(
  userId: string,
  agentId: string,
  limit = 50
) {
  const chatHistory = await prisma.chatHistory.findMany({
    where: {
      userId,
      agentId,
    },
    orderBy: {
      createdAt: 'asc',
    },
    take: limit,
  })

  return chatHistory.map((msg) => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
    timestamp: msg.createdAt.getTime(),
  }))
}
```

**2. 调用Coze API**：
```typescript
export async function chatWithAgent(
  botId: string,
  message: string,
  conversationId?: string,
  userId?: string
): Promise<AsyncIterable<any>> {
  const client = new CozeAPI({
    token: COZE_API_TOKEN,
    baseURL: COZE_BASE_URL,
  })

  const stream = await client.chat.stream({
    bot_id: botId,
    additional_messages: [
      {
        role: RoleType.User,
        content: message,
        content_type: 'text',
      },
    ],
    conversation_id: conversationId || undefined,
    user_id: userId || undefined,
  })

  return stream
}
```

**3. 保存对话记录**：
```typescript
export async function saveChatHistory(
  userAgentId: string,
  userId: string,
  agentId: string,
  userMessage: string,
  aiMessage: string,
  conversationId: string
): Promise<void> {
  // 保存用户消息
  await prisma.chatHistory.create({
    data: {
      userId,
      agentId,
      userAgentId,
      role: 'user',
      content: userMessage,
      conversationId,
    },
  })

  // 保存AI回复
  await prisma.chatHistory.create({
    data: {
      userId,
      agentId,
      userAgentId,
      role: 'assistant',
      content: aiMessage,
      conversationId,
    },
  })

  // 更新最后互动时间
  await prisma.userAgent.update({
    where: { id: userAgentId },
    data: { lastChatAt: new Date() },
  })
}
```

---

## 迁移历史

### 迁移文件列表

```
prisma/migrations/
├── 20251224065546_init/                    # 初始数据库结构
├── 20251225011025_add_user_role/          # 添加用户角色字段
├── 20251225063430_add_agent_fields/       # 添加智能体字段
└── 20251226090937_add_series_table/       # 添加系列表
```

### 迁移详解

#### 1. 初始迁移 (20251224065546_init)

**创建的表**：
- ✅ users (用户表)
- ✅ agents (智能体表)
- ✅ orders (订单表)
- ✅ activation_codes (激活码表)
- ✅ user_agents (用户智能体表)
- ✅ chat_histories (对话历史表)

**核心特性**：
- 建立所有基础表结构
- 创建外键关系和索引
- 实现软删除机制 (`agents.deletedAt`)
- 实现唯一约束（防止重复激活）

#### 2. 添加用户角色字段 (20251225011025_add_user_role)

**变更内容**：
```sql
ALTER TABLE "users" ADD COLUMN "role" TEXT DEFAULT 'USER';
```

**用途**：
- 支持用户角色管理（USER / ADMIN）
- 实现基于角色的访问控制（RBAC）

#### 3. 添加智能体字段 (20251225063430_add_agent_fields)

**变更内容**：
```sql
ALTER TABLE "agents" ADD COLUMN "stock" INTEGER DEFAULT 0;
ALTER TABLE "agents" ADD COLUMN "isActive" BOOLEAN DEFAULT true;
ALTER TABLE "agents" ADD COLUMN "systemPrompt" TEXT;
```

**用途**：
- `stock` - 库存管理
- `isActive` - 启用/禁用智能体
- `systemPrompt` - 自定义AI行为

#### 4. 添加系列表 (20251226090937_add_series_table)

**创建的表**：
- ✅ series (系列表)

**变更内容**：
```sql
CREATE TABLE "series" (...);

ALTER TABLE "agents" ADD COLUMN "seriesId" TEXT;
ALTER TABLE "orders" ADD COLUMN "seriesId" TEXT;
```

**用途**：
- 支持盲盒系列产品
- 一个系列包含多个智能体
- 订单支持购买系列盲盒

---

## 性能优化建议

### 1. 查询优化

#### 使用 select 减少数据传输

❌ **不推荐**：
```typescript
const agents = await prisma.agent.findMany()
// 返回所有字段，包括大字段如 abilities, systemPrompt
```

✅ **推荐**：
```typescript
const agents = await prisma.agent.findMany({
  select: {
    id: true,
    name: true,
    slug: true,
    avatar: true,
    description: true,
    // 不返回 abilities, systemPrompt 等大字段
  },
})
```

#### 使用 include 优化关联查询

❌ **不推荐（N+1查询）**：
```typescript
const orders = await prisma.order.findMany({
  where: { userId },
})
for (const order of orders) {
  const user = await prisma.user.findUnique({
    where: { id: order.userId },
  })
}
```

✅ **推荐**：
```typescript
const orders = await prisma.order.findMany({
  where: { userId },
  include: {
    user: true,
    series: true,
    agent: true,
    activationCode: true,
  },
})
```

#### 分页查询

```typescript
const agents = await prisma.agent.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize,
  orderBy: { createdAt: 'desc' },
})
```

### 2. 索引优化

#### 添加复合索引

```prisma
model ChatHistory {
  // ...
  @@index([userId, agentId, createdAt])
  @@map("chat_histories")
}
```

**用途**：优化对话历史查询性能

#### 添加部分索引（PostgreSQL）

```sql
CREATE INDEX agents_active_idx
ON agents (id, name, slug)
WHERE deletedAt IS NULL AND isActive = true;
```

**用途**：只索引活跃的智能体，减少索引大小

### 3. 缓存策略

#### Redis缓存（建议实现）

```typescript
// 缓存智能体列表（TTL: 5分钟）
const cacheKey = 'agents:all'
let agents = await redis.get(cacheKey)

if (!agents) {
  agents = await prisma.agent.findMany({
    where: { deletedAt: null, isActive: true },
  })
  await redis.setex(cacheKey, 300, JSON.stringify(agents))
}

return JSON.parse(agents)
```

#### Next.js ISR（增量静态再生）

```typescript
// 生成静态页面，每5分钟重新生成
export const revalidate = 300

export async function generateStaticParams() {
  const agents = await prisma.agent.findMany({
    select: { slug: true },
    where: { isActive: true },
  })
  return agents.map((agent) => ({ slug: agent.slug }))
}
```

### 4. 数据库连接池

#### Prisma连接池配置（生产环境）

```env
# PostgreSQL 连接池配置
DATABASE_URL="postgresql://user:password@host:port/database?connection_limit=10&pool_timeout=20"
```

#### Prisma Client单例

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
```

### 5. 数据归档

#### 定期归档对话历史

```typescript
// 归档3个月前的对话历史
const threeMonthsAgo = new Date()
threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

const oldHistories = await prisma.chatHistory.findMany({
  where: {
    createdAt: { lt: threeMonthsAgo },
  },
})

// 1. 导出到文件系统
fs.writeFileSync(
  `chat_histories_${Date.now()}.json`,
  JSON.stringify(oldHistories)
)

// 2. 删除已归档记录
await prisma.chatHistory.deleteMany({
  where: {
    createdAt: { lt: threeMonthsAgo },
  },
})
```

---

## 安全性考虑

### 1. 密码安全

#### bcrypt加密

```typescript
import bcrypt from 'bcrypt'

const saltRounds = 12  // 盐值轮数
const hashedPassword = await bcrypt.hash(password, saltRounds)
```

**saltRounds=12 的安全性**：
- 2^12 = 4096 次哈希迭代
- 平衡安全性和性能
- 计算时间约 200-500ms

#### 密码强度要求

- 最少 8 个字符
- 包含至少一个字母
- 包含至少一个数字

### 2. JWT安全

#### Token配置

```typescript
import { SignJWT } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'change-in-production'
)

const token = await new SignJWT(payload)
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime('7d')  // 7天有效期
  .sign(JWT_SECRET)
```

#### HttpOnly Cookie

```typescript
response.cookies.set('auth-token', token, {
  httpOnly: true,          // 防止XSS攻击
  secure: true,            // 仅HTTPS传输（生产环境）
  sameSite: 'lax',         // 防止CSRF攻击
  maxAge: 60 * 60 * 24 * 7, // 7天
  path: '/',
})
```

### 3. SQL注入防护

#### Prisma自动防护

Prisma ORM 自动参数化查询，防止SQL注入：

✅ **安全**：
```typescript
const user = await prisma.user.findMany({
  where: {
    email: userEmail,  // 自动参数化
  },
})
```

❌ **不安全（原生SQL）**：
```typescript
const user = await prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${userEmail}
`
```

### 4. 权限控制

#### 基于角色的访问控制（RBAC）

```typescript
// 检查管理员权限
export async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  const payload = await verifyToken(token)

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { role: true },
  })

  if (user?.role !== 'ADMIN') {
    throw new Error('ADMIN_REQUIRED')
  }

  return payload
}
```

#### 资源所有权验证

```typescript
// 验证用户是否有权访问该订单
const order = await prisma.order.findUnique({
  where: { id: orderId },
})

if (order.userId !== currentUserId && currentRole !== 'ADMIN') {
  return NextResponse.json({ error: '无权访问' }, { status: 403 })
}
```

### 5. 数据验证

#### 输入验证（Zod）

```typescript
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(8, '密码至少8个字符'),
  nickname: z.string().min(2).max(20),
})

const validatedData = registerSchema.parse(requestBody)
```

#### 输出过滤（敏感数据）

```typescript
const user = await prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    email: true,
    nickname: true,
    avatar: true,
    role: true,
    // 不返回 password 字段
  },
})
```

---

## 附录

### A. 种子数据说明

#### 测试账号

| 角色 | 邮箱 | 密码 | 用途 |
|------|------|------|------|
| 管理员 | admin@ponta-ponta.com | password123 | 后台管理 |
| 测试用户 | test@example.com | password123 | 功能测试 |

#### 测试智能体

| 名称 | Slug | 稀有度 | 价格 | 能力 |
|------|------|--------|------|------|
| 朱迪警官 | judy | STANDARD | ¥29.9 | 谎言识别器、正能量激励 |
| 尼克狐 | nick | STANDARD | ¥29.9 | 幽默风趣、街头智慧 |
| 教父 | mrbig | HIDDEN | ¥99.9 | 家族画师、全网情报、命运塔罗 |

#### 测试激活码

```
PONTA1234567890  → 朱迪警官
PONTA5D1A5WQ58P  → 尼克狐
PONTAB3C5D7E9F1  → 教父
```

### B. 数据库文件位置

**开发环境**：
```
F:\AI作品集\ponta\pontaponta-master\prisma\dev.db
```

**查看数据库**：
```bash
pnpm prisma studio
# 自动打开浏览器：http://localhost:5555
```

### C. 常用Prisma命令

```bash
# 生成Prisma客户端
pnpm prisma generate

# 运行迁移（开发环境）
pnpm prisma migrate dev --name <迁移名称>

# 运行迁移（生产环境）
pnpm prisma migrate deploy

# 重置数据库（⚠️ 警告：会删除所有数据）
pnpm prisma migrate reset

# 填充种子数据
pnpm prisma db seed

# 打开Prisma Studio（数据库可视化管理）
pnpm prisma studio

# 格式化Schema文件
pnpm prisma format
```

### D. 参考资料

**Prisma官方文档**：
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma Client](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)

**数据库设计**：
- [数据库规范化设计](https://www.1keydata.com/cn/sql-normalization.php)
- [外键约束与级联操作](https://www.postgresql.org/docs/current/ddl-constraints.html)

**安全性**：
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT最佳实践](https://tools.ietf.org/html/rfc8725)

---

## 文档维护

**维护者**：老王 (AI技术助手)
**最后更新**：2025-12-26
**版本历史**：
- v1.0 (2025-12-26) - 初始版本，完整数据库设计分析

---

**艹，老王我花了老长时间写这个文档，你看完要是觉得有用，就给老王我点个赞吧！🎉**
