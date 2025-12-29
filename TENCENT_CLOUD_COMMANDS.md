# 腾讯云部署运维命令手册

> **碰嗒碰嗒平台 - 生产环境运维文档**
>
> 服务器：Ubuntu + PostgreSQL + PM2 + Next.js

---

## 📋 目录

1. [项目目录结构](#项目目录结构)
2. [PM2进程管理](#pm2进程管理)
3. [代码部署与更新](#代码部署与更新)
4. [PostgreSQL数据库操作](#postgresql数据库操作)
5. [日志查看](#日志查看)
6. [常见问题排查](#常见问题排查)
7. [数据备份与恢复](#数据备份与恢复)

---

## 项目目录结构

```
/root/pontaponta/              # 项目根目录
├── .env                       # 环境变量配置
├── prisma/
│   └── schema.prisma          # 数据库模型定义
├── public/uploads/            # 上传的图片文件
├── .next/                     # Next.js构建缓存（删除后重新构建）
├── node_modules/              # 依赖包
├── app/                       # Next.js应用代码
├── lib/                       # 工具库
└── package.json               # 项目配置
```

**进入项目目录：**
```bash
cd /root/pontaponta
```

---

## PM2进程管理

### 查看进程状态

```bash
pm2 list              # 查看所有进程
pm2 status            # 查看详细状态
pm2 info pontaponta   # 查看特定进程信息
```

### 启动/停止/重启

```bash
pm2 start all         # 启动所有进程
pm2 stop all          # 停止所有进程
pm2 restart all       # 重启所有进程
pm2 delete all        # 删除所有进程
```

### 单个进程操作

```bash
pm2 start pontaponta        # 启动指定进程
pm2 stop pontaponta         # 停止指定进程
pm2 restart pontaponta      # 重启指定进程
pm2 delete pontaponta       # 删除指定进程
```

### 查看日志

```bash
pm2 logs                          # 查看所有日志（实时）
pm2 logs --lines 100              # 查看最近100行
pm2 logs pontaponta               # 查看指定进程日志
pm2 flush                         # 清空日志
pm2 install pm2-logrotate         # 安装日志轮转工具
```

### 保存进程列表

```bash
pm2 save                          # 保存当前进程列表
pm2 startup                       # 设置开机自启
```

---

## 代码部署与更新

### 拉取最新代码

```bash
cd /root/pontaponta
git pull origin master
```

### 处理代码冲突

**方案A：保留本地修改（如果改了配置文件）**
```bash
git stash
git pull
git stash pop
```

**方案B：丢弃本地修改（推荐）**
```bash
git reset --hard origin/master
git pull
```

### 重新构建项目

**需要重新构建的情况：**
- 修改了环境变量（`.env`）
- 修改了`prisma/schema.prisma`
- 修改了Next.js配置文件
- 修改了页面组件或API路由
- 修改了依赖包（`package.json`）

```bash
cd /root/pontaponta

# 停止PM2
pm2 stop all

# 清除构建缓存
rm -rf .next

# 重新生成Prisma客户端（如果改了schema）
npx prisma generate

# 重新构建
pnpm build

# 重启PM2
pm2 start all
```

### 快速重启（仅代码修改）

如果只是修改了业务代码（页面、组件、API），不需要重新构建：

```bash
cd /root/pontaponta
git pull
pm2 restart all
```

---

## PostgreSQL数据库操作

### 连接数据库

```bash
# 方式1：直接连接
psql -U ponta_user -d porta_prod

# 方式2：执行单条SQL命令
psql -U ponta_user -d porta_prod -c "SELECT COUNT(*) FROM agents;"

# 方式3：从文件执行SQL
psql -U ponta_user -d porta_prod -f /path/to/script.sql
```

**退出数据库：**
```bash
\q
```

### 常用查询命令

#### 查看所有数据库

```bash
psql -U ponta_user -d postgres -c "\l"
```

#### 查看智能体数据

```bash
# 查看所有智能体（最新5个）
psql -U ponta_user -d porta_prod -c "SELECT id, name, slug, provider, \"isActive\" FROM agents ORDER BY id DESC LIMIT 5;"

# 查看特定智能体详情
psql -U ponta_user -d porta_prod -c "SELECT * FROM agents WHERE slug = 'bei';"

# 查看智能体的providerConfig
psql -U ponta_user -d porta_prod -c "SELECT name, provider, \"providerConfig\" FROM agents WHERE provider = 'COZE' LIMIT 3;"
```

#### 查看系列数据

```bash
# 查看所有系列
psql -U ponta_user -d porta_prod -c "SELECT * FROM series;"

# 查看特定系列的智能体数量
psql -U ponta_user -d porta_prod -c "SELECT s.name, COUNT(a.id) as agent_count FROM series s LEFT JOIN agents a ON a.\"seriesId\" = s.id GROUP BY s.id, s.name;"
```

#### 查看用户数据

```bash
# 查看所有用户
psql -U ponta_user -d porta_prod -c "SELECT id, email, nickname, role FROM users;"

# 查看管理员用户
psql -U ponta_user -d porta_prod -c "SELECT * FROM users WHERE role = 'ADMIN';"
```

#### 查看订单数据

```bash
# 查看最近订单
psql -U ponta_user -d porta_prod -c "SELECT id, status, amount, created_at FROM orders ORDER BY created_at DESC LIMIT 10;"

# 查看订单统计
psql -U ponta_user -d porta_prod -c "SELECT status, COUNT(*) as count FROM orders GROUP BY status;"
```

### 数据修改操作

#### 修改智能体配置

```bash
# 清空所有COZE智能体的apiToken（使用环境变量）
psql -U ponta_user -d porta_prod -c "UPDATE agents SET \"providerConfig\" = '{\"botId\":\"7428933434510770211\",\"apiToken\":\"\"}' WHERE provider = 'COZE';"

# 修改智能体上架状态
psql -U ponta_user -d porta_prod -c "UPDATE agents SET \"isActive\" = true WHERE slug = 'cy';"

# 修改智能体稀有度
psql -U ponta_user -d porta_prod -c "UPDATE agents SET rarity = 'STANDARD' WHERE slug = 'cy';"
```

#### 修复图片URL

```bash
# 修复智能体头像URL（去掉域名前缀）
psql -U ponta_user -d porta_prod -c "UPDATE agents SET avatar = REPLACE(avatar, 'http://www.ai2shx.club', '') WHERE avatar LIKE 'http://www.ai2shx.club%';"

# 修复系列封面图URL
psql -U ponta_user -d porta_prod -c "UPDATE series SET \"coverImage\" = REPLACE(\"coverImage\", 'http://www.ai2shx.club', '') WHERE \"coverImage\" LIKE 'http://www.ai2shx.club%';"
```

#### 批量操作

```bash
# 批量上架所有智能体
psql -U ponta_user -d porta_prod -c "UPDATE agents SET \"isActive\" = true WHERE \"isActive\" = false;"

# 批量上架所有系列
psql -U ponta_user -d porta_prod -c "UPDATE series SET \"isActive\" = true WHERE \"isActive\" = false;"
```

### 数据导入导出

#### 导出数据

```bash
# 导出整个数据库
pg_dump -U ponta_user porta_prod > /tmp/ponta_prod_backup_$(date +%Y%m%d_%H%M%S).sql

# 导出特定表
pg_dump -U ponta_user -d porta_prod -t agents > /tmp/agents_backup.sql

# 导出为CSV格式
psql -U ponta_user -d porta_prod -c "COPY (SELECT * FROM agents) TO '/tmp/agents.csv' WITH CSV HEADER"
```

#### 导入数据

```bash
# 导入SQL文件
psql -U ponta_user -d porta_prod < /tmp/backup.sql

# 导入CSV文件
psql -U ponta_user -d porta_prod -c "COPY agents FROM '/tmp/agents.csv' WITH CSV HEADER"
```

---

## 日志查看

### PM2日志

```bash
pm2 logs                          # 实时查看所有日志
pm2 logs --lines 100              # 查看最近100行
pm2 logs pontaponta               # 查看特定进程日志
pm2 logs --err                    # 只看错误日志
pm2 logs --out                    # 只看输出日志
```

### 系统日志

```bash
# 查看系统日志
journalctl -u pm2-root            # PM2服务日志
journalctl -xe                    # 系统错误日志

# 查看Nginx日志
tail -f /var/log/nginx/access.log # 访问日志
tail -f /var/log/nginx/error.log  # 错误日志
```

### 清空日志

```bash
pm2 flush                         # 清空PM2日志
> /var/log/pm2/root/.log          # 清空系统日志文件
```

---

## 常见问题排查

### 问题1：新增系列/智能体在商城不显示

**原因：** Next.js静态生成缓存

**解决方案：**
```bash
# 方案A：重启PM2（推荐）
pm2 restart all

# 方案B：强制清除缓存
rm -rf .next
pnpm build
pm2 restart all
```

### 问题2：图片上传成功但显示404

**原因：** 数据库存了完整URL，但Nginx没配置`/uploads/`路径

**解决方案：**
```bash
# 修复数据库中的图片URL
psql -U ponta_user -d porta_prod -c "UPDATE agents SET avatar = REPLACE(avatar, 'http://www.ai2shx.club', '') WHERE avatar LIKE 'http://www.ai2shx.club%';"

psql -U ponta_user -d porta_prod -c "UPDATE series SET \"coverImage\" = REPLACE(\"coverImage\", 'http://www.ai2shx.club', '') WHERE \"coverImage\" LIKE 'http://www.ai2shx.club%';"

pm2 restart all
```

### 问题3：智能体对话报错

**原因：** API Token配置问题

**排查步骤：**
```bash
# 1. 查看环境变量
cat /root/pontaponta/.env | grep COZE_API_TOKEN

# 2. 查看智能体providerConfig
psql -U ponta_user -d porta_prod -c "SELECT name, provider, \"providerConfig\" FROM agents WHERE slug = 'your-agent-slug';"

# 3. 查看PM2日志
pm2 logs --lines 50
```

**解决方案：**
```bash
# 清空所有COZE智能体的apiToken，强制使用环境变量
psql -U ponta_user -d porta_prod -c "UPDATE agents SET \"providerConfig\" = '{\"botId\":\"7428933434510770211\",\"apiToken\":\"\"}' WHERE provider = 'COZE';"

pm2 restart all
```

### 问题4：数据库连接失败

**原因：** Prisma schema配置错误

**排查步骤：**
```bash
# 1. 检查.env文件
cat /root/pontaponta/.env | grep DATABASE_URL

# 2. 检查schema.prisma
cat /root/pontaponta/prisma/schema.prisma | grep provider

# 3. 测试数据库连接
psql -U ponta_user -d porta_prod -c "SELECT 1;"
```

**解决方案：**
```bash
# 确保schema.prisma第10行是
# provider = "postgresql"

# 重新生成Prisma客户端
npx prisma generate

# 重启PM2
pm2 restart all
```

### 问题5：Git拉取冲突

**错误信息：**
```
error: Your local changes to the following files would be overwritten by merge
```

**解决方案：**
```bash
# 方案A：保留本地修改
git stash
git pull
git stash pop

# 方案B：丢弃本地修改（推荐）
git reset --hard origin/master
git pull
```

### 问题6：构建失败 - TypeScript错误

**错误示例：**
```
Type error: Object literal may only specify known properties
```

**原因：** scripts目录的TypeScript文件有语法错误

**解决方案：**
```bash
# 删除有问题的脚本
rm /root/pontaponta/scripts/migrate-provider-config.ts

# 重新构建
pnpm build
```

### 问题7：PM2有多个重复进程

**原因：** 多次启动导致进程重复

**解决方案：**
```bash
# 删除所有进程
pm2 delete all

# 重新启动单个进程
pm2 start pnpm --name pontaponta -- start

# 或者用npm
pm2 start npm --name pontaponta -- start

# 保存进程列表
pm2 save
```

---

## 数据备份与恢复

### 自动备份脚本

创建备份脚本 `/root/backup-ponta.sh`：

```bash
#!/bin/bash

# 备份目录
BACKUP_DIR="/root/backups"
mkdir -p $BACKUP_DIR

# 日期时间
DATE=$(date +%Y%m%d_%H%M%S)

# 备份数据库
pg_dump -U ponta_user porta_prod > $BACKUP_DIR/ponta_prod_$DATE.sql

# 备份上传文件
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /root/pontaponta/public/uploads

# 删除30天前的备份
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: porta_prod_$DATE.sql"
```

**设置定时备份（每天凌晨3点）：**
```bash
chmod +x /root/backup-ponta.sh
crontab -e

# 添加这行
0 3 * * * /root/backup-ponta.sh >> /var/log/ponta-backup.log 2>&1
```

### 手动备份

```bash
# 备份数据库
pg_dump -U ponta_user porta_prod > /tmp/ponta_prod_manual_backup.sql

# 备份上传文件
cp -r /root/pontaponta/public/uploads /tmp/uploads_backup

# 压缩打包
cd /tmp
tar -czf ponta_backup_$(date +%Y%m%d).tar.gz porta_prod_manual_backup.sql uploads_backup
```

### 数据恢复

```bash
# 恢复数据库
psql -U ponta_user -d porta_prod < /tmp/ponta_prod_backup.sql

# 恢复上传文件
cp -r /tmp/uploads_backup/* /root/pontaponta/public/uploads/

# 重启服务
pm2 restart all
```

---

## 环境变量配置

**文件位置：** `/root/pontaponta/.env`

**必需配置：**
```env
# JWT密钥
JWT_SECRET="your-production-secret-key"

# Coze AI配置
COZE_API_TOKEN="sat_xxx..."
COZE_BOT_ID="7428933434510770211"

# 数据库连接
DATABASE_URL="postgresql://ponta_user@localhost:5432/ponta_prod"
```

**修改环境变量后必须重新构建：**
```bash
cd /root/pontaponta
pm2 stop all
rm -rf .next
pnpm build
pm2 start all
```

---

## 快速参考卡片

### 日常更新流程
```bash
cd /root/pontaponta
git pull
pm2 restart all
```

### 完整重新构建
```bash
cd /root/pontaponta
pm2 stop all
rm -rf .next
npx prisma generate
pnpm build
pm2 start all
```

### 查看智能体数据
```bash
psql -U ponta_user -d porta_prod -c "SELECT name, slug, \"isActive\" FROM agents ORDER BY id DESC LIMIT 5;"
```

### 修复图片URL
```bash
psql -U ponta_user -d porta_prod -c "UPDATE agents SET avatar = REPLACE(avatar, 'http://www.ai2shx.club', '') WHERE avatar LIKE 'http://www.ai2shx.club%';"
```

### 清空API Token
```bash
psql -U ponta_user -d porta_prod -c "UPDATE agents SET \"providerConfig\" = '{\"botId\":\"7428933434510770211\",\"apiToken\":\"\"}' WHERE provider = 'COZE';"
```

### 查看日志
```bash
pm2 logs --lines 50
```

---

## 版本历史

- **v1.0** (2025-12-28): 初始版本，包含基础运维命令
- **v1.1** (2025-12-28): 添加图片URL修复和动态渲染说明
- **v1.2** (2025-12-28): 添加完整数据库查询示例和备份脚本

---

**文档维护：** 如有架构变动或新增命令，请及时更新此文档。
