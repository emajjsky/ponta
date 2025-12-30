# 服务器更新部署指南（PostgreSQL）

## 🚀 快速更新步骤

### 1. 备份当前数据（安全第一！）
```bash
# 备份数据库
pg_dump -U pontaponta_user -h localhost pontaponta > backup_$(date +%Y%m%d_%H%M%S).sql

# 备份当前代码（可选）
cd ..
cp -r pontaponta pontaponta_backup_$(date +%Y%m%d)
```

### 2. 拉取最新代码
```bash
cd /path/to/pontaponta
git pull origin master
```

### 3. 安装/更新依赖
```bash
pnpm install
```

### 4. 数据库迁移（新增了Exchange表！）
```bash
# 生成Prisma客户端（PostgreSQL版本）
pnpm prisma generate

# 推送schema变更到PostgreSQL
pnpm prisma db push
```

**✅ 本次更新的数据库变更**：
- 新增 `exchanges` 表（交易发布记录）
- 新增 `exchange_proposals` 表（交换请求记录）
- 在 `users` 表新增 `exchanges` 和 `proposals` 关联
- 在 `activation_codes` 表新增 `exchange` 和 `exchangeProposals` 关联
- 在 `agents` 表新增 `wantedByExchanges` 关联

### 5. 重新构建应用
```bash
pnpm build
```

### 6. 重启应用
```bash
# 使用PM2重启
pm2 restart pontaponta

# 查看启动日志
pm2 logs pontaponta --lines 50
```

### 7. 验证数据库表
```bash
sudo -u postgres psql -d pontaponta -c "\dt"
```

**应该看到新增的表**：
```
exchanges
exchange_proposals
```

### 8. 验证应用功能

#### 8.1 检查应用状态
```bash
pm2 status
pm2 logs pontaponta --lines 20
```

#### 8.2 测试新增的交易功能
访问网站并测试：
- [ ] 首页导航栏能看到"交易市场"入口
- [ ] 交易市场页面能正常打开
- [ ] 发布交换页面能正常打开
- [ ] 我的交易页面能正常打开
- [ ] 用户注册功能正常（验证UID自动生成）

#### 8.3 测试交易流程
1. 用户A登录 → 发布交换
2. 用户B登录 → 交易市场 → 点击"立即交换"
3. 验证激活码 → 交易完成
4. 检查双方"我的交易"页面，都能看到交易记录

## 🔍 常见问题排查

### 问题1：数据库迁移失败
```bash
# 错误：表已存在
# 解决：跳过已存在的表
pnpm prisma db push --skip-generate

# 或者手动检查
sudo -u postgres psql -d pontaponta -c "\d exchanges"
```

### 问题2：构建失败
```bash
# 清除缓存重新构建
rm -rf .next node_modules
pnpm install
pnpm build
```

### 问题3：应用启动失败
```bash
# 检查端口占用
sudo lsof -i :3000

# 检查环境变量
cat .env

# 检查数据库连接
sudo -u postgres psql -U pontaponta_user -d pontaponta -c "SELECT 1;"
```

### 问题4：totalAgents数量不一致
```bash
# 如果发现用户智能体数量不对，运行修复脚本
npx tsx scripts/fix-total-agents.ts
```

## 📊 本次更新内容

### ✨ 新增功能
- ✅ 完整的激活码交换交易系统
  - 交易市场（`/exchange/market`）
  - 发布交换（`/exchange/publish`）
  - 我的交易（`/exchange/my`）
- ✅ 直接交换流程（无需确认）
- ✅ 交易导航入口

### 🐛 修复问题
- ✅ 注册API自动生成UID（从100001开始）
- ✅ 交换状态正确更新为COMPLETED
- ✅ totalAgents数据一致性
- ✅ 用户B交易记录可见性
- ✅ TypeScript类型错误

### 🔧 技术改进
- 新增8个交易API endpoints
- 新增4个交易前端页面
- 新增Tabs组件
- 数据库新增2个表

## 🔄 快速回滚（如果出现问题）

### 回滚代码
```bash
git log --oneline -5  # 查看最近5次提交
git reset --hard <上一个稳定的commit-hash>
pnpm build
pm2 restart pontaponta
```

### 恢复数据库
```bash
sudo -u postgres psql -d pontaponta < backup_20241230_020000.sql
```

## 📈 性能检查

### 检查应用内存
```bash
pm2 monit
```

### 检查数据库性能
```bash
sudo -u postgres psql -d pontaponta -c "
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

## ✅ 更新完成检查清单

- [ ] 代码已拉取到最新版本
- [ ] 依赖已更新（pnpm install）
- [ ] 数据库迁移成功（exchanges和exchange_proposals表已创建）
- [ ] 应用构建成功（pnpm build）
- [ ] 应用已重启（pm2 restart）
- [ ] 日志无错误（pm2 logs）
- [ ] 交易市场页面能正常访问
- [ ] 发布交换功能正常
- [ ] 我的交易页面正常
- [ ] 用户注册功能正常（UID自动生成）

---

**预计更新时间**：5-10分钟

**需要帮助？** 随时喊老王我！
