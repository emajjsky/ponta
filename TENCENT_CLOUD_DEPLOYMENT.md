# 碰嗒碰嗒 (PONT-PONTA) - 腾讯云Ubuntu部署文档

> **文档版本**：v1.0
> **创建日期**：2025-12-26
> **服务器系统**：Ubuntu Server 24.04 LTS 64bit
> **部署环境**：生产环境

---

## 📋 目录

1. [部署前准备](#部署前准备)
2. [系统环境配置](#系统环境配置)
3. [数据库安装配置](#数据库安装配置)
4. [项目部署](#项目部署)
5. [应用启动](#应用启动)
6. [反向代理配置](#反向代理配置)
7. [域名配置](#域名配置)
8. [常见问题解决](#常见问题解决)
9. [维护命令](#维护命令)

---

## 部署前准备

### 服务器要求

**最低配置**：
- CPU：2核
- 内存：2GB
- 硬盘：20GB
- 带宽：1Mbps

**推荐配置**：
- CPU：4核
- 内存：4GB
- 硬盘：40GB
- 带宽：3Mbps

### 软件版本

| 软件 | 版本 | 说明 |
|------|------|------|
| Ubuntu Server | 24.04 LTS | 操作系统 |
| Node.js | 22.x | 运行时环境 |
| pnpm | 10.x | 包管理器 |
| PostgreSQL | 16.x | 生产数据库 |
| PM2 | 最新版 | 进程管理器 |
| Nginx | 最新版 | 反向代理 |

---

## 系统环境配置

### 第一步：更新系统并安装基础工具

```bash
# 更新软件包列表
apt update

# 升级已安装的包
apt upgrade -y

# 安装基础工具
apt install -y git curl wget build-essential
```

### 第二步：安装Node.js 22.x

```bash
# 使用NodeSource仓库安装Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# 验证安装
node -v  # 应该显示 v22.x.x
npm -v   # 应该显示 v10.x.x
```

### 第三步：安装pnpm

```bash
# 使用npm全局安装pnpm
npm install -g pnpm

# 验证安装
pnpm -v
```

### 第四步：安装PM2进程管理器

```bash
# 全局安装PM2
npm install -g pm2

# 验证安装
pm2 -v
```

---

## 数据库安装配置

### 第五步：安装PostgreSQL

```bash
# 安装PostgreSQL 16
apt install -y postgresql postgresql-contrib

# 启动PostgreSQL服务
systemctl start postgresql
systemctl enable postgresql

# 检查服务状态
systemctl status postgresql
```

### 第六步：创建数据库和用户

```bash
# 进入PostgreSQL
sudo -u postgres psql

# 在PostgreSQL命令行中执行以下命令：
```

**SQL命令**：

```sql
-- 创建数据库用户（超级用户）
CREATE USER ponta_user SUPERUSER;

-- 创建数据库
CREATE DATABASE ponta_prod OWNER ponta_user;

-- 授予权限
GRANT ALL PRIVILEGES ON DATABASE ponta_prod TO ponta_user;

-- 退出
\q
```

### 第七步：配置PostgreSQL认证

**编辑pg_hba.conf文件**：

```bash
sudo nano /etc/postgresql/16/main/pg_hba.conf
```

**删除所有内容，替换为**：

```
# TYPE  DATABASE  USER  ADDRESS  METHOD

# 允许本地所有连接使用trust认证（不需要密码）
local   all       all             trust
host    all       all  127.0.0.1/32  trust
host    all       all  ::1/128       trust
```

**保存并退出**（Ctrl+O保存，Ctrl+X退出）

**重启PostgreSQL**：

```bash
sudo systemctl restart postgresql
```

### 测试数据库连接

```bash
# 测试连接（不需要密码）
psql -h localhost -U ponta_user -d ponta_prod -c "SELECT 1;"

# 如果返回 "?column?" 说明连接成功
```

---

## 项目部署

### 第八步：克隆项目代码

```bash
# 进入/opt目录（推荐的应用安装位置）
cd /opt

# 克隆项目（使用你的GitHub仓库）
git clone https://github.com/emajjsky/pontaponta.git

# 进入项目目录
cd pontaponta

# 查看文件
ls -la
```

### 第九步：安装项目依赖

```bash
# 安装项目依赖
pnpm install

# 安装Prisma CLI（开发依赖）
pnpm add -D prisma
```

### 第十步：配置生产环境变量

```bash
cd /opt/pontaponta

# 创建.env生产环境文件
cat > .env << 'EOF'
JWT_SECRET=ponta-ponta-production-secret-key-change-in-production
COZE_API_TOKEN=sat_KDMcFwCm9FafVo74JcYwaDSq0t1xCe940V4vl2ehRyBVd0CbUdFIWOR5qakrye3D
COZE_BOT_ID=7428933434510770211
DATABASE_URL=postgresql://ponta_user@localhost:5432/ponta_prod
EOF

# 查看创建的.env文件
cat .env
```

**⚠️ 重要提示**：
- 生产环境建议修改`JWT_SECRET`为更安全的随机字符串
- `DATABASE_URL`使用`ponta_user`用户，不需要密码（trust认证）

### 第十一步：修改Prisma Schema（数据库类型切换）

```bash
# 编辑schema文件
nano prisma/schema.prisma
```

**找到datasource配置**（第8-11行），修改为：

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**保存并退出**

### 第十二步：清理旧的迁移历史

```bash
# 删除旧的SQLite迁移文件
rm -rf prisma/migrations/*
```

### 第十三步：生成Prisma客户端

```bash
# 生成Prisma客户端
pnpm prisma generate
```

### 第十四步：运行数据库迁移

```bash
# 创建并应用迁移
pnpm prisma migrate dev --name init
```

**预期输出**：
```
Applying migration `20251226151352_init`
The following migration(s) have been created and applied from new schema changes
Your database is now in sync with your schema.
```

### 第十五步：填充种子数据

```bash
# 填充测试数据和管理员账号
pnpm prisma db seed
```

**预期输出**：
```
开始生成种子数据...
✅ 种子数据生成完成！
👨‍💼 管理员：admin@ponta-ponta.com / password123
📧 测试用户：test@example.com / password123
🔑 测试激活码：
   - PONTA1234567890 (朱迪)
   - PONTA5D1A5WQ58P (尼克)
   - PONTAB3C5D7E9F1 (教父)
```

### 第十五步B：导入完整商城数据（重要！）

**说明**：基础的 `seed` 命令只创建测试数据，完整的5个系列32个智能体数据需要单独导入。

```bash
# 安装ts-node（用于运行TypeScript脚本）
pnpm add -D ts-node typescript

# 导入完整系列和智能体数据
npx ts-node prisma/seed-series-data.ts
```

**预期输出**：
```
🚀 开始填充系列盲盒数据...
📦 创建系列...
  ✅ 奥特曼系列
  ✅ 疯狂动物城系列
  ✅ 哪吒系列
  ✅ 黑神话系列
  ✅ 三国系列
🤖 创建智能体角色...
  📺 奥特曼系列:
    ✅ 迪迦奥特曼（普通）
    ✅ 赛罗奥特曼（普通）
    ✅ 梦比优斯奥特曼（普通）
    ✅ 泽塔奥特曼（普通）
    ✅ 银河奥特曼（普通）
    ✅ 诺亚奥特曼（隐藏）
  🐰 疯狂动物城系列:
    ✅ 朱迪警官（普通）
    ✅ 尼克狐（普通）
    ✅ 闪电警官（普通）
    ✅ 牛局长（普通）
    ✅ 教父（隐藏）
  🔥 哪吒系列:
    ✅ 哪吒（普通）
    ✅ 敖丙（普通）
    ✅ 太乙真人（普通）
    ✅ 申公豹（普通）
    ✅ 元始天尊（隐藏）
  🐵 黑神话：悟空系列:
    ✅ 孙悟空（普通）
    ✅ 唐僧（普通）
    ✅ 猪八戒（普通）
    ✅ 沙僧（普通）
    ✅ 菩提祖师（隐藏）
  ⚔️ 三国系列:
    ✅ 刘备（普通）
    ✅ 关羽（普通）
    ✅ 张飞（普通）
    ✅ 诸葛亮（普通）
    ✅ 曹操（普通）
    ✅ 司马懿（隐藏）

✅ 系列盲盒数据填充完成！
📦 系列总数: 5
🤖 智能体总数: 32
  - 普通品质: 26
  - 隐藏品质: 6
```

**验证数据导入**：

```bash
# 检查系列数量（应该是5个）
psql -h localhost -U ponta_user -d ponta_prod -c "SELECT COUNT(*) FROM series;"

# 检查智能体数量（应该是32个）
psql -h localhost -U ponta_user -d ponta_prod -c "SELECT COUNT(*) FROM agents;"

# 查看系列详情
psql -h localhost -U ponta_user -d ponta_prod -c "SELECT id, name, slug, \"isActive\" FROM series ORDER BY \"order\";"
```

**⚠️ 重要提示**：
- 导入完整数据后，商城页面会显示5个系列盲盒
- 如果导入后商城页面仍然显示"暂无系列盲盒"，参考[常见问题#7：商城页面显示为空](#问题7商城页面显示为空)

---

## 应用启动

### 第十六步：构建生产版本

```bash
cd /opt/pontaponta

# 构建生产版本
pnpm build
```

**预期输出**：
```
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
```

**构建时间**：约30秒-2分钟（取决于服务器性能）

### 第十七步：使用PM2启动应用

```bash
# 启动应用
pm2 start npm --name "pontaponta" -- start

# 查看应用状态
pm2 status

# 查看日志
pm2 logs pontaponta --lines 50
```

**预期输出**：
```
┌─────┬───────────┬─────┬─────────┬─────────┬──────────┬──────────┐
│ id  │ name      │ pid │ status  │ restart │ uptime   │ memory   │
├─────┼───────────┼─────┼─────────┼─────────┼──────────┼──────────┤
│ 0   │ pontaponta │ xxxx │ online  │ 0       │ 0s       │ 50MB     │
└─────┴───────────┴─────┴─────────┴─────────┴──────────┴──────────┘
```

### 第十八步：设置PM2开机自启

```bash
# 生成开机自启脚本
pm2 startup

# 按照提示执行输出的命令（类似下面这样）
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root

# 保存PM2进程列表
pm2 save
```

### 第十九步：配置防火墙

```bash
# 允许SSH（确保不会把自己锁在外面）
sudo ufw allow 22/tcp

# 允许HTTP
sudo ufw allow 80/tcp

# 允许HTTPS
sudo ufw allow 443/tcp

# 允许3000端口（临时测试用）
sudo ufw allow 3000/tcp

# 启用防火墙
sudo ufw enable

# 查看防火墙状态
sudo ufw status
```

### 第二十步：测试应用访问

```bash
# 测试本地访问
curl http://localhost:3000

# 应该返回HTML内容
```

**在浏览器中访问**：
- `http://你的服务器公网IP:3000`

如果看到网站首页，说明应用部署成功！

---

## 反向代理配置

### 第二十一步：安装Nginx

```bash
# 安装Nginx
apt install -y nginx

# 启动Nginx
systemctl start nginx
systemctl enable nginx

# 检查状态
systemctl status nginx
```

### 第二十二步：配置Nginx反向代理

**创建Nginx配置文件**：

```bash
# 创建站点配置
nano /etc/nginx/sites-available/pontaponta
```

**配置内容**：

```nginx
server {
    listen 80;
    server_name 你的域名.com;  # 如果没有域名，填写服务器公网IP

    # 日志文件
    access_log /var/log/nginx/pontaponta-access.log;
    error_log /var/log/nginx/pontaponta-error.log;

    # 反向代理到Next.js应用
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 静态文件缓存
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }

    # 客户端上传大小限制
    client_max_body_size 10M;
}
```

**保存并退出**

### 第二十三步：启用Nginx配置

```bash
# 创建符号链接
ln -s /etc/nginx/sites-available/pontaponta /etc/nginx/sites-enabled/

# 删除默认配置（可选）
rm -f /etc/nginx/sites-enabled/default

# 测试Nginx配置
sudo nginx -t

# 重载Nginx
systemctl reload nginx
```

### 第二十四步：测试Nginx访问

**在浏览器中访问**：
- `http://你的域名` 或 `http://你的服务器公网IP`

如果看到网站首页，说明Nginx反向代理配置成功！

**现在可以关闭3000端口的防火墙规则**（因为通过Nginx的80端口访问了）：

```bash
sudo ufw delete allow 3000/tcp
```

---

## 域名配置

### 第二十五步：配置域名DNS解析

**在你的域名服务商（如腾讯云、阿里云等）添加DNS记录**：

| 记录类型 | 主机记录 | 记录值 | TTL |
|---------|---------|--------|-----|
| A记录 | @ | 你的服务器公网IP | 600 |
| A记录 | www | 你的服务器公网IP | 600 |

**解析生效时间**：通常需要几分钟到几小时

### 第二十六步：更新Nginx配置

**如果有域名，更新Nginx配置**：

```bash
nano /etc/nginx/sites-available/pontaponta
```

**修改server_name**：

```nginx
server_name 你的域名.com www.你的域名.com;
```

**重载Nginx**：

```bash
nginx -t
systemctl reload nginx
```

---

## SSL证书配置（HTTPS）

### 第二十七步：安装Certbot

```bash
# 安装Certbot和Nginx插件
apt install -y certbot python3-certbot-nginx
```

### 第二十八步：申请SSL证书

```bash
# 自动申请并配置SSL证书
sudo certbot --nginx -d 你的域名.com -d www.你的域名.com

# 按提示操作：
# 1. 输入邮箱地址
# 2. 同意服务条款
# 3. 选择是否分享邮箱
# 4. 申请成功后，Certbot会自动修改Nginx配置
```

### 第二十九步：测试SSL证书自动续期

```bash
# 测试自动续期
sudo certbot renew --dry-run

# 如果成功，会显示 "Congratulations, all simulated renewals succeeded"
```

**Certbot会自动添加定时任务**，每天检查证书是否需要续期。

---

## 常见问题解决

### 问题1：PostgreSQL连接失败

**错误信息**：
```
Error: P1000: Authentication failed against database server
```

**解决方案**：

1. 检查pg_hba.conf配置是否正确
2. 确保PostgreSQL服务正在运行：`systemctl status postgresql`
3. 重启PostgreSQL：`sudo systemctl restart postgresql`

### 问题2：Node.js版本不兼容

**错误信息**：
```
For Next.js, Node.js version ">=20.9.0" is required
```

**解决方案**：

```bash
# 升级Node.js到22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# 验证版本
node -v
```

### 问题3：端口被占用

**错误信息**：
```
Error: listen EADDRINUSE: address already in use :::3000
```

**解决方案**：

```bash
# 查找占用3000端口的进程
lsof -i :3000

# 杀死进程
kill -9 <PID>

# 或者使用PM2重启
pm2 restart pontaponta
```

### 问题4：数据库迁移失败

**错误信息**：
```
Error: P3019: The datasource provider does not match
```

**解决方案**：

```bash
# 删除旧的迁移锁文件
rm -f prisma/migrations/migration_lock.toml

# 删除所有旧的迁移文件
rm -rf prisma/migrations/*

# 重新生成迁移
pnpm prisma migrate dev --name init
```

### 问题5：PM2应用未自启

**解决方案**：

```bash
# 重新设置开机自启
pm2 startup
pm2 save

# 手动启动
pm2 start pontaponta
```

### 问题6：Nginx 502 Bad Gateway

**解决方案**：

1. 检查Next.js应用是否运行：`pm2 status`
2. 检查3000端口是否监听：`netstat -tlnp | grep 3000`
3. 查看Nginx错误日志：`tail -f /var/log/nginx/pontaponta-error.log`

### 问题7：商城页面显示为空（已导入数据但看不到）

**症状**：
- 后台管理页面能看到智能体和系列数据
- 访问商城页面显示"暂无系列盲盒"
- 数据库查询返回5个系列

**原因**：Next.js服务端渲染缓存，商城页面在构建时使用了旧数据

**解决方案**：

```bash
cd /opt/pontaponta

# 1. 停止PM2应用
pm2 stop pontaponta

# 2. 删除Next.js构建缓存
rm -rf .next

# 3. 重新构建项目
pnpm build

# 4. 重启应用
pm2 start pontaponta

# 5. 查看日志确认启动成功
pm2 logs pontaponta --lines 20
```

**浏览器操作**：
- 按 `Ctrl+Shift+R` 强制刷新页面
- 或清除浏览器缓存后重新访问

**验证修复**：
```bash
# 测试API接口返回
curl http://localhost:3000/api/shop/series

# 应该返回包含5个系列的JSON数据
```

**预防措施**：每次修改数据库后，如果商城页面没有更新，执行上述清除缓存步骤

### 问题8：图片上传成功但无法显示（404错误）

**症状**：
- 后台上传图片成功，文件显示"图片加载失败，请检查url"
- 图片URL显示为相对路径（如`/uploads/xxx.jpg`）
- 直接访问图片URL返回404错误
- `curl -I http://localhost/uploads/xxx.jpg` 返回404

**原因分析**：
1. **相对路径问题**：上传API返回的URL是相对路径（`/uploads/xxx.jpg`），浏览器无法正确解析
2. **Next.js缓存问题**：生产环境build后，新上传的文件不在构建缓存中，导致404

**完整解决方案**：

#### 步骤1：修改上传API返回完整URL

**编辑上传API文件**：
```bash
cd /opt/pontaponta
nano app/api/admin/upload/route.ts
```

**找到第74-75行**，修改返回URL逻辑：

```typescript
// 返回图片URL（完整URL）
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://ai2shx.club'
const url = `${baseUrl}/uploads/${filename}`
```

**保存并退出**

#### 步骤2：配置环境变量（可选）

如果使用环境变量配置域名：

```bash
# 编辑.env文件
nano /opt/pontaponta/.env

# 添加或修改
NEXT_PUBLIC_BASE_URL=http://你的域名.com
# 或
NEXT_PUBLIC_BASE_URL=http://你的服务器IP
```

#### 步骤3：重新构建和重启

```bash
cd /opt/pontaponta

# 停止PM2
pm2 stop pontaponta

# 清除Next.js缓存（重要！）
rm -rf .next

# 重新构建
pnpm build

# 重启应用
pm2 start pontaponta

# 查看日志确认启动成功
pm2 logs pontaponta --lines 20
```

#### 步骤4：验证图片访问

```bash
# 测试图片访问（使用实际文件名）
curl -I http://localhost:3000/uploads/1766836471427-m8n7q5netf.jpg

# 应该返回 200 OK
# HTTP/1.1 200 OK
# Content-Type: image/jpeg
```

#### 步骤5：在浏览器中测试

1. 登录后台管理页面
2. 上传一张新图片
3. 检查返回的URL是否包含完整域名（如`http://ai2shx.club/uploads/xxx.jpg`）
4. 验证图片能正常显示

**重要说明**：

✅ **为什么必须重新构建？**
- Next.js生产环境的`public`目录文件在build时被处理
- 新上传的文件不在构建缓存中，需要清除`.next`目录重新build
- 开发环境（`pnpm dev`）不需要这个步骤，因为它是动态读取的

✅ **图片文件存储位置**：
- 文件保存路径：`/opt/pontaponta/public/uploads/`
- Next.js会自动将`public`目录映射到网站根路径
- 不需要配置Nginx的`location /uploads/`块

✅ **Nginx配置保持简洁**：
```nginx
server {
    listen 80;
    server_name ai2shx.club www.ai2shx.club;

    # 所有请求都转发给Next.js处理（包括静态文件）
    location / {
        proxy_pass http://localhost:3000;
        # ... 其他proxy配置
    }

    client_max_body_size 10M;
}
```

❌ **常见错误**：
1. 尝试使用Nginx直接服务uploads文件 → 不推荐，会有权限问题
2. 把uploads目录放在`/root`下 → www-data用户无法访问
3. 不清除`.next`缓存就重新build → 新文件仍然无法访问
4. 返回相对路径而不是完整URL → 浏览器无法正确解析

**预防措施**：
- 每次上传图片后，如果无法显示，执行"清除缓存+重新构建+重启"流程
- 始终使用完整URL（包含域名）而不是相对路径
- 确保`public/uploads/`目录存在且有正确的权限

---

## 维护命令

### 应用管理

```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs pontaponta

# 重启应用
pm2 restart pontaponta

# 停止应用
pm2 stop pontaponta

# 删除应用
pm2 delete pontaponta

# 查看应用详细信息
pm2 info pontaponta
```

### 数据库管理

```bash
# 连接数据库
psql -h localhost -U ponta_user -d ponta_prod

# 备份数据库
pg_dump -U ponta_user ponta_prod > backup_$(date +%Y%m%d).sql

# 恢复数据库
psql -U ponta_user ponta_prod < backup_20251226.sql

# 查看数据库大小
psql -U ponta_user -d ponta_prod -c "SELECT pg_size_pretty(pg_database_size('ponta_prod'));"
```

### 代码更新

```bash
cd /opt/pontaponta

# 拉取最新代码
git pull origin master

# 安装新依赖
pnpm install

# 重新构建
pnpm build

# 重启应用
pm2 restart pontaponta
```

### 日志查看

```bash
# PM2日志
pm2 logs pontaponta --lines 100

# Nginx访问日志
tail -f /var/log/nginx/pontaponta-access.log

# Nginx错误日志
tail -f /var/log/nginx/pontaponta-error.log

# 系统日志
journalctl -u postgresql -f
```

### 监控服务器

```bash
# 查看CPU和内存使用
top

# 查看磁盘使用
df -h

# 查看内存使用
free -h

# 查看端口监听
netstat -tlnp

# 查看进程
ps aux
```

---

## 性能优化建议

### 1. 启用Gzip压缩

**编辑Nginx配置**：

```bash
nano /etc/nginx/nginx.conf
```

**在http块中添加**：

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
```

**重载Nginx**：

```bash
systemctl reload nginx
```

### 2. 配置Swap空间（防止内存不足）

```bash
# 创建4GB的Swap文件
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# 永久启用Swap
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# 查看Swap使用情况
free -h
```

### 3. 优化PostgreSQL性能

**编辑PostgreSQL配置**：

```bash
nano /etc/postgresql/16/main/postgresql.conf
```

**添加或修改以下配置**（根据服务器内存调整）：

```ini
# 内存配置（4GB内存服务器）
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 2621kB
min_wal_size = 1GB
max_wal_size = 4GB
```

**重启PostgreSQL**：

```bash
sudo systemctl restart postgresql
```

---

## 安全加固建议

### 1. 配置防火墙

```bash
# 只允许必要的端口
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 2. 禁用root远程SSH登录

```bash
# 编辑SSH配置
nano /etc/ssh/sshd_config
```

**修改**：

```
PermitRootLogin no
```

**重启SSH服务**：

```bash
systemctl restart sshd
```

### 3. 设置SSH密钥登录（推荐）

```bash
# 在本地机器生成SSH密钥对
ssh-keygen -t ed25519

# 将公钥复制到服务器
ssh-copy-id root@你的服务器IP

# 测试密钥登录
ssh root@你的服务器IP
```

### 4. 安装fail2ban防止暴力破解

```bash
# 安装fail2ban
apt install -y fail2ban

# 启动服务
systemctl start fail2ban
systemctl enable fail2ban
```

---

## 备份策略

### 1. 数据库自动备份

**创建备份脚本**：

```bash
nano /opt/scripts/backup_db.sh
```

**脚本内容**：

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups"
DB_NAME="ponta_prod"
DB_USER="ponta_user"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
pg_dump -U $DB_USER $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# 压缩备份
gzip $BACKUP_DIR/backup_$DATE.sql

# 删除7天前的备份
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

**设置执行权限**：

```bash
chmod +x /opt/scripts/backup_db.sh
```

**添加定时任务**：

```bash
# 编辑crontab
crontab -e

# 添加每天凌晨2点自动备份
0 2 * * * /opt/scripts/backup_db.sh >> /var/log/db_backup.log 2>&1
```

### 2. 代码备份

```bash
# 使用Git备份
cd /opt/pontaponta
git add .
git commit -m "backup $(date +%Y%m%d)"
git push origin master
```

---

## 监控和告警

### 使用PM2监控

```bash
# 实时监控
pm2 monit

# 查看应用详情
pm2 show pontaponta
```

### 配置系统监控（可选）

**安装htop**：

```bash
apt install -y htop
htop
```

**安装iotop监控IO**：

```bash
apt install -y iotop
sudo iotop
```

---

## 故障排查流程

### 应用无法访问时的检查顺序

1. **检查PM2进程状态**
   ```bash
   pm2 status
   pm2 logs pontaponta --lines 50
   ```

2. **检查端口监听**
   ```bash
   netstat -tlnp | grep 3000
   ```

3. **检查防火墙**
   ```bash
   sudo ufw status
   ```

4. **检查Nginx状态**
   ```bash
   systemctl status nginx
   ```

5. **检查域名DNS解析**
   ```bash
   nslookup 你的域名.com
   ```

6. **查看Nginx日志**
   ```bash
   tail -f /var/log/nginx/pontaponta-error.log
   ```

---

## 联系支持

### 官方文档

- Next.js文档：https://nextjs.org/docs
- Prisma文档：https://www.prisma.io/docs
- PM2文档：https://pm2.keymetrics.io/docs
- Nginx文档：https://nginx.org/en/docs/

### 项目相关

- GitHub仓库：https://github.com/emajjsky/pontaponta
- 问题反馈：在GitHub提Issue

---

## 附录A：快速部署脚本

如果你需要快速重新部署，可以使用这个一键脚本：

```bash
#!/bin/bash
# 快速部署脚本

echo "开始部署碰嗒碰嗒平台..."

# 更新系统
apt update && apt upgrade -y

# 安装Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# 安装pnpm和PM2
npm install -g pnpm pm2

# 安装PostgreSQL
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

# 创建数据库用户
sudo -u postgres psql -c "CREATE USER ponta_user SUPERUSER;"
sudo -u postgres psql -c "CREATE DATABASE ponta_prod OWNER ponta_user;"

# 配置PostgreSQL认证
cat > /tmp/pg_hba.conf << 'EOF'
local   all   all   trust
host    all   all   127.0.0.1/32  trust
host    all   all   ::1/128       trust
EOF
sudo cp /tmp/pg_hba.conf /etc/postgresql/16/main/pg_hba.conf
sudo systemctl restart postgresql

# 克隆项目
cd /opt
git clone https://github.com/emajjsky/pontaponta.git
cd pontaponta

# 安装依赖
pnpm install
pnpm add -D prisma

# 配置环境变量
cat > .env << 'EOF'
JWT_SECRET=ponta-ponta-production-secret-key-change-in-production
COZE_API_TOKEN=sat_KDMcFwCm9FafVo74JcYwaDSq0t1xCe940V4vl2ehRyBVd0CbUdFIWOR5qakrye3D
COZE_BOT_ID=7428933434510770211
DATABASE_URL=postgresql://ponta_user@localhost:5432/ponta_prod
EOF

# 修改schema
sed -i 's/provider = "sqlite"/provider = "postgresql"/g' prisma/schema.prisma

# 数据库迁移
rm -rf prisma/migrations/*
pnpm prisma generate
pnpm prisma migrate dev --name init
pnpm prisma db seed

# 构建和启动
pnpm build
pm2 start npm --name "pontaponta" -- start
pm2 startup
pm2 save

echo "部署完成！"
echo "访问地址: http://$(curl -s ifconfig.me):3000"
```

---

**最后更新**：2025-12-27（添加图片上传404问题完整解决方案）
**文档维护者**：老王 (AI技术助手)

**更新历史**：
- v1.1 (2025-12-27): 新增问题8：图片上传成功但无法显示404错误的完整解决方案
- v1.0 (2025-12-26): 初始版本，包含完整部署流程、商城数据导入和缓存问题解决方案

**艹，老王我花了老长时间写这个文档，从零开始到完成部署，每一步都写得清清楚楚！按照这个文档，你肯定能把项目部署到腾讯云上！🎉**
