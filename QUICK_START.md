# 快速部署指南

本指南将帮助你在5分钟内将碰嗒碰嗒平台部署到Vercel。

## 📋 前置要求

- [ ] GitHub账号（需要将代码推送到GitHub）
- [ ] Vercel账号（可用GitHub登录）
- [ ] Coze API Token和Bot ID（已配置）

## 🚀 部署步骤

### 步骤1: 准备GitHub仓库

```bash
# 初始化Git仓库（如果还没有）
cd D:\AI\newtest\ponta-ponta
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: PONT-PONTA AI Agent Platform"

# 创建GitHub仓库后，推送代码
git remote add origin https://github.com/YOUR_USERNAME/ponta-ponta.git
git branch -M main
git push -u origin main
```

### 步骤2: 部署到Vercel

#### 方法A: 通过Vercel网站部署（推荐新手）

1. **访问Vercel**
   - 打开 https://vercel.com
   - 点击 "Sign Up" 或 "Login"
   - 使用GitHub账号登录

2. **创建新项目**
   - 点击 "Add New Project"
   - 选择刚才推送的GitHub仓库 `ponta-ponta`
   - 点击 "Import"

3. **配置环境变量**
   
   在环境变量设置页面添加以下变量：
   
   ```
   JWT_SECRET
   e79039222fc51095c60281f4f9a8de03cae275cb4ea09e94e60c0461ed0318f3
   ```
   
   ```
   COZE_API_TOKEN
   sat_KDMcFwCm9FafVo74JcYwaDSq0t1xCe940V4vl2ehRyBVd0CbUdFIWOR5qakrye3D
   ```
   
   ```
   COZE_BOT_ID
   7428933434510770211
   ```

4. **配置数据库（可选）**
   
   选项1: **使用Vercel Postgres**
   - 点击 "Storage" → "Create Database"
   - 选择 "Postgres"
   - 创建后自动设置 `DATABASE_URL`
   
   选项2: **暂时使用SQLite（不推荐生产环境）**
   - 跳过数据库配置
   - 部署后手动运行迁移

5. **部署**
   - 点击 "Deploy" 按钮
   - 等待3-5分钟
   - 部署完成后会获得一个 `.vercel.app` 域名

#### 方法B: 通过Vercel CLI部署（推荐进阶用户）

```bash
# 1. 安装Vercel CLI
pnpm i -g vercel

# 2. 登录Vercel
vercel login

# 3. 部署（会自动引导配置）
vercel

# 4. 设置环境变量
vercel env add JWT_SECRET
# 粘贴: e79039222fc51095c60281f4f9a8de03cae275cb4ea09e94e60c0461ed0318f3

vercel env add COZE_API_TOKEN
# 粘贴: sat_KDMcFwCm9FafVo74JcYwaDSq0t1xCe940V4vl2ehRyBVd0CbUdFIWOR5qakrye3D

vercel env add COZE_BOT_ID
# 粘贴: 7428933434510770211

# 5. 生产环境部署
vercel --prod
```

### 步骤3: 运行数据库迁移

部署完成后，需要设置数据库：

#### 如果使用Vercel Postgres:

```bash
# 拉取环境变量
vercel env pull .env.local

# 运行迁移
pnpm prisma migrate deploy

# 填充种子数据（可选）
pnpm prisma db seed
```

#### 如果使用其他PostgreSQL:

1. 在数据库服务创建数据库
2. 获取连接字符串
3. 在Vercel设置环境变量 `DATABASE_URL`
4. 运行迁移命令

### 步骤4: 验证部署

1. **访问网站**
   - 打开部署的域名
   - 尝试注册新用户
   - 测试登录功能

2. **测试AI对话**
   - 激活测试激活码
   - 与AI智能体对话

3. **测试后台管理**
   - 使用管理员账号登录
   - 访问 `/admin`
   - 测试管理功能

## 🔧 环境变量清单

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `JWT_SECRET` | `e79039222fc51095c60281f4f9a8de03cae275cb4ea09e94e60c0461ed0318f3` | JWT签名密钥 |
| `COZE_API_TOKEN` | `sat_KDMcFwCm9FafVo74JcYwaDSq0t1xCe940V4vl2ehRyBVd0CbUdFIWOR5qakrye3D` | Coze API令牌 |
| `COZE_BOT_ID` | `7428933434510770211` | Coze Bot ID |
| `DATABASE_URL` | PostgreSQL连接字符串 | 数据库连接 |

## 📱 部署后配置

### 自定义域名

1. 在Vercel项目设置中点击 "Domains"
2. 添加自定义域名
3. 按照提示配置DNS

### 数据库重置

如果需要重置数据库：

```bash
# 警告：会删除所有数据！
vercel exec "pnpm prisma migrate reset"
```

## ⚠️ 常见问题

### Q: 部署后页面404
A: 检查 `next.config.js` 配置，确保没有错误的路由重写

### Q: 数据库连接失败
A: 确保 `DATABASE_URL` 正确，数据库服务可访问

### Q: AI对话无响应
A: 检查 `COZE_API_TOKEN` 和 `COZE_BOT_ID` 是否正确设置

### Q: 登录后立即退出
A: 确保 `JWT_SECRET` 已设置，并且前后端使用相同值

## 📞 获取帮助

- 查看 `DEPLOYMENT.md` 获取详细部署指南
- 查看 `README.md` 了解项目结构
- 查看 `PROJECT_SUMMARY.md` 了解完整功能

## ✅ 部署检查清单

- [ ] 代码已推送到GitHub
- [ ] Vercel账号已创建
- [ ] 环境变量已配置
- [ ] 数据库已创建
- [ ] 数据库迁移已运行
- [ ] 种子数据已加载（可选）
- [ ] 网站可访问
- [ ] 用户注册功能正常
- [ ] AI对话功能正常
- [ ] 后台管理可访问

---

**预计部署时间**: 5-10分钟

**祝部署顺利！** 🚀
