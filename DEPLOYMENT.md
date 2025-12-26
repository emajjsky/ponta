# 部署指南

本文档详细说明如何将碰嗒碰嗒平台部署到生产环境。

## Vercel部署（推荐）

### 步骤1: 准备工作

1. **Fork项目到GitHub**
   - 访问项目GitHub仓库
   - 点击Fork按钮将项目复制到你的账户

2. **注册Vercel账号**
   - 访问 [vercel.com](https://vercel.com)
   - 使用GitHub账号登录

### 步骤2: 配置环境变量

在Vercel项目中设置以下环境变量：

#### 必需的环境变量

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `JWT_SECRET` | JWT签名密钥 | 使用强随机字符串（至少32字符） |
| `COZE_API_TOKEN` | Coze API令牌 | `sat_xxxxx...` |
| `COZE_BOT_ID` | Coze Bot ID | `7428933434510770211` |
| `DATABASE_URL` | 数据库连接字符串 | PostgreSQL连接URL |

#### 生成JWT_SECRET

```bash
# 使用Node.js生成随机密钥
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 步骤3: 配置数据库

#### 选项A: Vercel Postgres（推荐）

1. 在Vercel项目中点击 "Storage"
2. 创建新的Postgres数据库
3. Vercel会自动设置 `DATABASE_URL`

#### 选项B: Supabase

1. 访问 [supabase.com](https://supabase.com)
2. 创建新项目
3. 获取数据库连接字符串
4. 在Vercel中设置 `DATABASE_URL`

#### 选项C: 其他PostgreSQL服务

- Railway
- Neon
- PlanetScale
- 自托管PostgreSQL

### 步骤4: 部署到Vercel

#### 通过Vercel CLI部署

```bash
# 安装Vercel CLI
pnpm i -g vercel

# 登录
vercel login

# 部署
vercel

# 生产环境部署
vercel --prod
```

#### 通过GitHub集成部署

1. 在Vercel中点击 "Add New Project"
2. 导入你的GitHub仓库
3. Vercel会自动检测Next.js配置
4. 配置环境变量
5. 点击 "Deploy"

### 步骤5: 运行数据库迁移

部署完成后，需要运行数据库迁移：

```bash
# 拉取环境变量
vercel env pull .env.local

# 运行迁移
pnpm prisma migrate deploy

# 填充种子数据（可选）
pnpm prisma db seed
```

或者使用Vercel CLI在远程运行：

```bash
vercel exec "pnpm prisma migrate deploy"
```

## 其他平台部署

### Netlify

1. **构建配置**

在 `netlify.toml` 中：

```toml
[build]
  command = "pnpm build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

2. **环境变量**

在Netlify控制台设置环境变量（同Vercel）

3. **部署**

```bash
# 安装Netlify CLI
pnpm i -g netlify-cli

# 部署
netlify deploy --prod
```

### Railway

1. 在Railway中创建新项目
2. 连接GitHub仓库
3. Railway会自动检测Next.js
4. 添加PostgreSQL数据库
5. 配置环境变量
6. 部署

### Docker部署

1. **构建Docker镜像**

\`\`\`dockerfile
FROM node:18-alpine AS base

# 安装依赖
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# 构建
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# 运行
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
\`\`\`

2. **运行容器**

\`\`\`bash
docker build -t ponta-ponta .
docker run -p 3000:3000 --env-file .env ponta-ponta
\`\`\`

## 部署后检查清单

- [ ] 环境变量已正确设置
- [ ] 数据库连接成功
- [ ] 数据库迁移已运行
- [ ] 种子数据已加载（可选）
- [ ] 用户注册功能正常
- [ ] 用户登录功能正常
- [ ] AI对话功能正常（检查Coze API）
- [ ] 后台管理页面可访问
- [ ] 支付集成已配置（如需要）

## 监控和日志

### Vercel Analytics

Vercel提供内置的分析和监控：

- 访问量统计
- 性能监控
- 错误追踪

### 日志查看

```bash
# Vercel CLI
vercel logs

# 查看实时日志
vercel logs --follow
```

## 常见问题

### Q: 数据库迁移失败

A: 确保DATABASE_URL正确，并且数据库服务可访问：

```bash
# 测试数据库连接
vercel env pull .env.local
pnpm prisma db push
```

### Q: Coze API无响应

A: 检查COZE_API_TOKEN和COZE_BOT_ID是否正确设置。

### Q: 用户登录后立即退出

A: 检查JWT_SECRET是否设置，并且前端和后端使用相同的密钥。

## 回滚策略

如果新部署出现问题，可以快速回滚：

```bash
# Vercel回滚到上一个版本
vercel rollback

# 或在Vercel控制台选择之前的部署版本
```

## 性能优化建议

1. **启用CDN** - Vercel自动提供全球CDN
2. **图片优化** - 使用Next.js Image组件
3. **数据库索引** - 确保常用查询字段有索引
4. **缓存策略** - 对静态数据和API响应启用缓存
5. **监控** - 设置性能监控和告警

## 安全建议

1. **定期更新依赖** - `pnpm update`
2. **使用强JWT密钥** - 至少32字符随机字符串
3. **启用HTTPS** - Vercel自动提供
4. **设置CORS** - 限制API访问来源
5. **速率限制** - 防止API滥用

## 支持

如有问题，请：
- 查看项目GitHub Issues
- 联系技术支持
- 查看Vercel文档

---

**祝部署顺利！** 🚀
