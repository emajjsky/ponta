import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixAdminUser() {
  console.log('🔧 修复管理员用户UID...\n')

  // 查询管理员用户
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@ponta-ponta.com' },
  })

  if (!admin) {
    console.log('❌ 管理员用户不存在，创建中...')

    // 创建管理员用户
    const bcrypt = require('bcrypt')
    const passwordHash = await bcrypt.hash('password123', 12)

    const newAdmin = await prisma.user.create({
      data: {
        uid: 100001,
        email: 'admin@ponta-ponta.com',
        password: passwordHash,
        nickname: '管理员',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    })

    console.log('✅ 管理员用户创建成功')
    console.log(`   UID: ${newAdmin.uid}`)
    console.log(`   邮箱: ${newAdmin.email}`)
    console.log(`   密码: password123`)
  } else if (!admin.uid) {
    console.log('⚠️  管理员用户缺少UID，修复中...')

    // 获取当前最大UID
    const maxUidUser = await prisma.user.findFirst({
      orderBy: {
        uid: 'desc',
      },
      select: {
        uid: true,
      },
    })

    const newUid = maxUidUser ? maxUidUser.uid + 1 : 100001

    // 更新管理员用户，添加UID
    const updatedAdmin = await prisma.user.update({
      where: { email: 'admin@ponta-ponta.com' },
      data: {
        uid: newUid,
      },
    })

    console.log('✅ 管理员用户UID已修复')
    console.log(`   新UID: ${updatedAdmin.uid}`)
  } else {
    console.log('✅ 管理员用户正常')
    console.log(`   UID: ${admin.uid}`)
    console.log(`   邮箱: ${admin.email}`)
    console.log(`   昵称: ${admin.nickname}`)
    console.log(`   角色: ${admin.role}`)
    console.log(`   状态: ${admin.status}`)
  }

  // 检查测试用户
  console.log('\n🔧 检查测试用户...')

  const testUser = await prisma.user.findUnique({
    where: { email: 'test@example.com' },
  })

  if (testUser && !testUser.uid) {
    console.log('⚠️  测试用户缺少UID，修复中...')

    // 获取当前最大UID
    const maxUidUser = await prisma.user.findFirst({
      orderBy: {
        uid: 'desc',
      },
      select: {
        uid: true,
      },
    })

    const newUid = maxUidUser ? maxUidUser.uid + 1 : 100001

    await prisma.user.update({
      where: { email: 'test@example.com' },
      data: {
        uid: newUid,
      },
    })

    console.log('✅ 测试用户UID已修复')
  } else if (testUser) {
    console.log('✅ 测试用户正常')
  } else {
    console.log('ℹ️  测试用户不存在（可选）')
  }

  console.log('\n✅ 修复完成！')
}

fixAdminUser()
  .then(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
  .catch(async (e) => {
    console.error('❌ 修复失败:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
