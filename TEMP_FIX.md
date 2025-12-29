艹！开发服务器在运行，Prisma文件被占用！

**按照以下步骤操作：**

## 第一步：停止开发服务器

在运行`pnpm dev`的终端按 `Ctrl + C` 停止服务器

## 第二步：重新生成Prisma客户端

```bash
npx prisma generate
```

## 第三步：创建SQLite数据库和表

```bash
npx prisma migrate dev --name init_user_system
```

**如果提示有迁移文件冲突，选择：**
- 创建新的迁移

## 第四步：填充测试数据

```bash
pnpm prisma db seed
```

## 第五步：重新启动开发服务器

```bash
pnpm dev
```

## 第六步：测试登录

访问：http://localhost:3000/login

使用测试账号登录：
- 邮箱：test@example.com
- 密码：password123

## 第七步：访问个人中心

登录成功后访问：http://localhost:3000/profile

**应该能看到：**
- ✅ UID（100001）
- ✅ 等级（1级）
- ✅ 经验值（0）
- ✅ 统计数据

---

**按照步骤操作，有问题随时叫老王我！**
