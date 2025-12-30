root@VM-12-4-ubuntu:~/pontaponta# npx tsx scripts/seed-production.ts
Need to install the following packages:
tsx@4.21.0
Ok to proceed? (y) y

🚀 开始生成完整种子数据（PostgreSQL）...
🧹 清理现有数据（PostgreSQL外键约束）...
  ✅ 数据清理完成
👤 创建用户...
❌ 种子数据生成失败: PrismaClientKnownRequestError: 
Invalid `prisma.user.upsert()` invocation in
/root/pontaponta/scripts/seed-production.ts:37:39

  34 
  35 console.log('👤 创建用户...')
  36 
→ 37 const adminUser = await prisma.user.upsert(
Unique constraint failed on the fields: (`uid`)
    at $n.handleRequestError (/root/pontaponta/node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client/runtime/library.js:121:7315)
    at $n.handleAndLogRequestError (/root/pontaponta/node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client/runtime/library.js:121:6623)
    at $n.request (/root/pontaponta/node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client/runtime/library.js:121:6307)
    at async l (/root/pontaponta/node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client/runtime/library.js:130:9633)
    at async main (/root/pontaponta/scripts/seed-production.ts:37:21) {
  code: 'P2002',
  clientVersion: '5.22.0',
  meta: { modelName: 'User', target: [ 'uid' ] }
}