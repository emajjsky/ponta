# 服务器部署指南（PostgreSQL）

## 📋 部署前检查清单

### 1. 数据库准备

#### 安装PostgreSQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### 创建数据库和用户
```bash
# 切换到postgres用户
sudo -u postgres psql

# 在PostgreSQL shell中执行：
CREATE DATABASE pontaponta;
CREATE USER pontaponta_user WITH PASSWORD 'your_strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE pontaponta TO pontaponta_user;
\q
```

#### 配置远程连接（可选）
```bash
# 编辑配置文件
sudo nano /etc/postgresql/*/main/postgresql.conf
# 修改：listen_addresses = '*'

sudo nano /etc/postgresql/*/main/pg_hba.conf
# 添加：host    all    all    0.0.0.0/0    md5

# 重启服务
sudo systemctl restart postgresql
```

### 2. 环境变量配置

在服务器上创建 `.env` 文件：
```bash
# 在项目根目录
cd /path/to/pontaponta
nano .env
```

添加以下环境变量：
```env
# 数据库连接（PostgreSQL）
DATABASE_URL="postgresql://pontaponta_user:your_strong_password_here@localhost:5432/pontaponta?schema=public"

# JWT密钥（生产环境必须更改）
JWT_SECRET="your-production-jwt-secret-key-min-32-chars"

# Coze AI配置
COZE_API_TOKEN="sat_xxx..."
COZE_BOT_ID="7428933434510770211"

# Node环境
NODE_ENV="production"
```

**⚠️ 安全提示**：
- JWT_SECRET必须使用强随机字符串（至少32个字符）
- 数据库密码要足够复杂
- 不要把.env文件提交到Git

### 3. Prisma配置

#### 生成Prisma客户端
```bash
# 安装依赖
pnpm install

# 生成Prisma客户端（基于PostgreSQL）
pnpm prisma generate
```

#### 运行数据库迁移
```bash
# 推送schema到PostgreSQL（生产环境）
pnpm prisma db push

# 或者使用migration（推荐）
pnpm prisma migrate deploy
```

#### 填充种子数据（可选）
```bash
# 如果需要测试数据
pnpm prisma db seed
```

### 4. 构建生产版本

```bash
# 构建Next.js应用
pnpm build

# 或者使用turbo（更快）
pnpm build --turbo
```

### 5. 启动应用

#### 开发测试
```bash
# 先测试是否能正常运行
pnpm start
```

#### 生产环境运行（使用PM2）

```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start npm --name "pontaponta" -- start

# 或者使用ecosystem.config.js
pm2 start ecosystem.config.js

# 查看日志
pm2 logs pontaponta

# 设置开机自启
pm2 startup
pm2 save
```

#### 创建PM2配置文件 `ecosystem.config.js`
```javascript
module.exports = {
  apps: [{
    name: 'pontaponta',
    script: 'npm',
    args: 'start',
    cwd: '/path/to/pontaponta',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
}
```

### 6. 配置Nginx反向代理（推荐）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 可选：配置Let's Encrypt SSL
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

重启Nginx：
```bash
sudo nginx -t  # 测试配置
sudo systemctl restart nginx
```

## 🔍 部署后验证

### 1. 检查数据库连接
```bash
# 在项目目录
pnpm prisma studio
# 访问 http://localhost:5555 查看数据库
```

### 2. 检查应用状态
```bash
# PM2状态
pm2 status
pm2 logs pontaponta --lines 50
```

### 3. 测试关键功能
- [ ] 访问首页正常
- [ ] 用户注册/登录功能
- [ ] 商城页面加载
- [ ] 交易市场页面
- [ ] AI对话功能

## ⚠️ 常见问题排查

### 问题1：Prisma迁移失败
```bash
# 错误：P3001
# 解决：强制重置数据库（慎用！）
pnpm prisma migrate reset

# 或手动推送schema
pnpm prisma db push --skip-generate
```

### 问题2：端口被占用
```bash
# 查看占用3000端口的进程
sudo lsof -i :3000

# 杀死进程
sudo kill -9 <PID>
```

### 问题3：数据库连接超时
```bash
# 检查PostgreSQL状态
sudo systemctl status postgresql

# 检查连接
sudo -u postgres psql -c "SELECT version();"
```

### 问题4：权限问题
```bash
# 确保文件权限正确
sudo chown -R $USER:$USER /path/to/pontaponta
chmod -R 755 /path/to/pontaponta
```

## 📊 数据库schema差异（SQLite → PostgreSQL）

**好消息**：Prisma已经处理了大部分差异，但需要注意：

1. **自增字段**：SQLite用`AUTOINCREMENT`，PostgreSQL用`SERIAL`或`BIGSERIAL`
2. **日期时间**：PostgreSQL对时区更严格
3. **JSON类型**：PostgreSQL有原生JSONB类型

当前schema已兼容PostgreSQL，无需修改。

## 🔄 更新部署流程

### 当代码更新后
```bash
# 1. 拉取最新代码
git pull origin master

# 2. 安装依赖
pnpm install

# 3. 如果有数据库schema变更
pnpm prisma migrate deploy

# 4. 重新构建
pnpm build

# 5. 重启应用
pm2 restart pontaponta
```

## 📝 备份策略

### 数据库备份
```bash
# 手动备份
pg_dump -U pontaponta_user -h localhost pontaponta > backup_$(date +%Y%m%d_%H%M%S).sql

# 自动备份脚本（crontab）
0 2 * * * pg_dump -U pontaponta_user pontaponta > /backups/pontaponta_$(date +\%Y\%m\%d).sql
```

### 恢复备份
```bash
psql -U pontaponta_user -h localhost pontaponta < backup_20241230_020000.sql
```

## 🚀 性能优化建议

### 1. 数据库连接池
在 `prisma/schema.prisma` 中：
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // 添加连接池配置
  directUrl = "postgresql://pontaponta_user:password@localhost:5432/pontaponta?pgbouncer=true"
}
```

### 2. PostgreSQL配置优化
编辑 `postgresql.conf`：
```ini
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

### 3. 应用层优化
- 启用Next.js图片优化（已配置）
- 使用CDN加速静态资源
- 配置Redis缓存（可选）

---

**部署后记得测试所有功能！特别是新增的交易系统！**
