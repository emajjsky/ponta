#!/bin/bash
# 彻底清理并重建项目 - 解决Prisma Client缓存问题

echo "=========================================="
echo "  开始彻底清理和重建项目"
echo "=========================================="

# 1. 停止所有Node进程和PM2
echo ""
echo "步骤1: 停止所有服务..."
pkill -9 node
pm2 delete all
sleep 2

# 2. 删除所有缓存和构建产物
echo ""
echo "步骤2: 删除所有缓存..."
rm -rf .next
rm -rf node_modules
rm -rf .prisma/client
rm -rf pnpm-lock.yaml
rm -rf /root/.pm2/logs/*

echo "缓存清理完成！"

# 3. 重新安装依赖
echo ""
echo "步骤3: 重新安装所有依赖..."
pnpm install

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败！"
    exit 1
fi

# 4. 生成Prisma Client（关键步骤）
echo ""
echo "步骤4: 生成Prisma Client..."
pnpm prisma generate

if [ $? -ne 0 ]; then
    echo "❌ Prisma Client生成失败！"
    exit 1
fi

echo "✓ Prisma Client生成成功！"

# 5. 运行数据库迁移（确保迁移已应用）
echo ""
echo "步骤5: 运行数据库迁移..."
pnpm prisma migrate deploy

if [ $? -ne 0 ]; then
    echo "❌ 数据库迁移失败！"
    exit 1
fi

echo "✓ 数据库迁移完成！"

# 6. 构建项目
echo ""
echo "步骤6: 构建Next.js项目..."
pnpm build

if [ $? -ne 0 ]; then
    echo "❌ 项目构建失败！"
    exit 1
fi

echo "✓ 项目构建成功！"

# 7. 启动PM2
echo ""
echo "步骤7: 启动PM2服务..."
pm2 start npm --name "ponta" -- start

if [ $? -ne 0 ]; then
    echo "❌ PM2启动失败！"
    exit 1
fi

echo "✓ PM2启动成功！"

# 8. 保存PM2配置
pm2 save
pm2 list

echo ""
echo "=========================================="
echo "  ✓ 所有步骤完成！"
echo "=========================================="
echo ""
echo "查看日志："
echo "  pm2 logs ponta"
echo ""
echo "如果还有问题，请运行："
echo "  pm2 flush"
echo "  pm2 restart ponta"
echo ""
