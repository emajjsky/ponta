# 用户系统本地测试指南

> 测试环境：本地SQLite数据库
> 测试时间：2025-12-29

---

## 📋 测试前准备

### 1. 环境检查

确保你的本地`.env`配置正确：

```env
# SQLite本地数据库
DATABASE_URL="file:./dev.db"

# JWT密钥
JWT_SECRET="local-test-secret"

# Coze配置
COZE_API_TOKEN="your-token"
COZE_BOT_ID="7428933434510770211"
```

### 2. 安装依赖（如果还没安装）

```bash
pnpm install
```

### 3. 生成Prisma客户端

```bash
npx prisma generate
```

### 4. 运行数据库迁移（SQLite）

**重要：** 因为SQLite不支持PostgreSQL语法，需要手动执行以下命令创建表：

```bash
# 启动开发服务器（Next.js会自动创建SQLite表）
pnpm dev
```

Next.js会自动根据Prisma schema创建SQLite表。

或者手动迁移（推荐）：

```bash
# 使用prisma migrate（本地开发）
npx prisma migrate dev --name add_user_system_sqlite
```

### 5. 填充测试数据

```bash
pnpm prisma db seed
```

---

## 🚀 启动本地开发服务器

```bash
pnpm dev
```

访问：http://localhost:3000

---

## ✅ 功能测试清单

### 1. 注册和登录

**测试步骤：**
1. 访问 http://localhost:3000/register
2. 注册新用户（测试@test.com / password123）
3. 注册成功后自动登录

**预期结果：**
- ✅ 注册成功，自动创建UID（100001）
- ✅ 用户初始等级为1，经验值为0
- ✅ 自动跳转到首页

---

### 2. 访问个人中心

**测试步骤：**
1. 登录后访问 http://localhost:3000/profile
2. 查看用户资料展示

**预期结果：**
- ✅ 显示UID（100001）
- ✅ 显示昵称、头像
- ✅ 显示等级（1级）、经验值（0）
- ✅ 显示统计数据（智能体数、对话数、成就数）
- ✅ 等级进度条显示0%

---

### 3. 编辑用户资料

**测试步骤：**
1. 在个人中心点击"编辑资料"按钮
2. 修改昵称为"测试用户A"
3. 输入个人简介："这是我的测试账号"
4. 点击"保存修改"

**预期结果：**
- ✅ 修改成功，跳转回个人中心
- ✅ 显示新的昵称和个人简介
- ✅ Toast提示"资料更新成功"

---

### 4. 增加经验值（手动测试API）

**测试步骤：**
1. 打开浏览器开发者工具（F12）
2. 切换到Console标签
3. 执行以下代码：

```javascript
// 增加对话经验值
fetch('/api/user/experience', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    type: 'CHAT',
  }),
}).then(r => r.json()).then(console.log)

// 增加激活智能体经验值
fetch('/api/user/experience', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    type: 'ACTIVATE_AGENT',
  }),
}).then(r => r.json()).then(console.log)
```

**预期结果：**
- ✅ 第一次返回：经验值+10，等级不变
- ✅ 第二次返回：经验值+100，如果达到100经验，升级到10级
- ✅ Toast提示升级（如果升级了）

---

### 5. 查看等级变化

**测试步骤：**
1. 多次执行上面的增加经验值代码
2. 刷新个人中心页面

**预期结果：**
- ✅ 等级显示更新（1级 → 10级 → 20级...）
- ✅ 经验值显示更新
- ✅ 等级进度条更新
- ✅ 头衔变化（新手冒险家 → 探索者 → 收藏家...）

---

### 6. 测试经验值规则

在Console中测试不同的经验值类型：

```javascript
// 每日登录（+20经验）
fetch('/api/user/experience', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ type: 'DAILY_LOGIN' }),
}).then(r => r.json()).then(console.log)

// 邀请用户（+500经验）
fetch('/api/user/experience', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ type: 'INVITE_USER' }),
}).then(r => r.json()).then(console.log)

// 激活隐藏款（+500经验）
fetch('/api/user/experience', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ type: 'ACTIVATE_HIDDEN_AGENT' }),
}).then(r => r.json()).then(console.log)
```

**预期结果：**
- ✅ 每种类型增加对应的经验值
- ✅ 达到阈值时自动升级
- ✅ 返回升级奖励信息

---

## 🐛 常见问题排查

### 问题1：注册后没有UID

**原因：** SQLite不支持PostgreSQL的`WITH`子句

**解决方案：**
手动更新UID：

```sql
-- 使用Prisma Studio或直接操作数据库
UPDATE users SET uid = 100001 WHERE email = 'test@test.com';
```

### 问题2：个人中心页面空白

**原因：** Prisma客户端未生成或schema未同步

**解决方案：**
```bash
npx prisma generate
npx prisma migrate dev
```

### 问题3：API返回500错误

**原因：** 数据库字段不存在

**解决方案：**
检查Prisma schema，确保所有字段都已迁移到数据库：

```bash
npx prisma studio
```

在Prisma Studio中查看表结构。

### 问题4：增加经验值后等级不变

**原因：** 等级计算逻辑可能有bug

**解决方案：**
在Console中调试：

```javascript
import { calculateLevel } from '@/lib/user-level'

console.log(calculateLevel(0))    // 应该返回1
console.log(calculateLevel(100))  // 应该返回10
console.log(calculateLevel(500))  // 应该返回20
```

---

## 📊 测试数据参考

### 等级与经验值对照表

| 等级 | 头称 | 所需经验值 | 智能体上限 |
|------|------|-----------|----------|
| 1    | 新手冒险家 | 0      | 3       |
| 10   | 探索者    | 100    | 5       |
| 20   | 收藏家    | 500    | 10      |
| 30   | 资深收藏家 | 1500   | 15      |
| 40   | 大师      | 3500   | 20      |
| 50   | 传奇大师  | 7000   | 30      |
| 60   | 至尊传奇  | 12000  | 50      |
| 100  | 不朽传说  | 50000  | 999     |

### 经验值获取规则

| 行为             | 经验值 |
|----------------|-------|
| 对话            | 10    |
| 每天第一次对话    | 50    |
| 激活智能体       | 100   |
| 激活稀有款       | 200   |
| 激活隐藏款       | 500   |
| 邀请用户         | 500   |
| 交换智能体       | 50    |
| 通过关卡         | 200   |
| 通过困难关卡     | 500   |
| 解锁成就         | 50    |
| 每日登录         | 20    |

---

## 🎯 测试完成标准

所有以下项目都通过，本地测试即完成：

- [x] 注册后自动创建UID
- [x] 个人中心正确显示用户数据
- [x] 编辑资料功能正常
- [x] 增加经验值后等级正确更新
- [x] 升级时显示正确的头衔
- [x] 等级进度条正确显示
- [x] Toast提示正常显示

---

## 🚀 下一步：服务器部署

本地测试通过后，按照以下步骤部署到腾讯云：

1. **拉取最新代码**
```bash
cd /root/pontaponta
git pull
```

2. **运行数据库迁移（PostgreSQL）**
```bash
npx prisma migrate deploy
```

3. **为现有用户生成UID**
```bash
psql -U ponta_user -d porta_prod -c "WITH numbered_users AS (SELECT id, ROW_NUMBER() OVER (ORDER BY \"createdAt\") + 100000 as row_num FROM users) UPDATE users SET uid = numbered_users.row_num FROM numbered_users WHERE users.id = numbered_users.id;"
```

4. **重新构建项目**
```bash
pm2 stop all
rm -rf .next
pnpm build
pm2 start all
```

5. **测试线上功能**
访问：http://www.ai2shx.club/profile

---

**测试完成后，把结果告诉老王我，有问题老王我立马修复！**
