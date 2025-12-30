import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * 检查用户数据实际情况
 */
async function checkUserData() {
  console.log('🔍 检查用户数据...\n')

  // 获取所有用户
  const users = await prisma.user.findMany({
    select: {
      id: true,
      uid: true,
      email: true,
      nickname: true,
      totalAgents: true,
    },
  })

  console.log(`👥 总共 ${users.length} 个用户\n`)

  for (const user of users) {
    console.log(`\n👤 用户: ${user.nickname} (${user.email})`)
    console.log(`   UID: ${user.uid}`)
    console.log(`   totalAgents字段: ${user.totalAgents}`)

    // 查询实际的userAgent记录数
    const actualUserAgents = await prisma.userAgent.count({
      where: { userId: user.id },
    })

    console.log(`   实际userAgent记录数: ${actualUserAgents}`)

    // 查询所有userAgent记录详情
    const userAgents = await prisma.userAgent.findMany({
      where: { userId: user.id },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            slug: true,
            deletedAt: true,
          },
        },
      },
    })

    console.log(`   智能体详情:`)
    userAgents.forEach((ua, index) => {
      const status = ua.agent.deletedAt ? '❌已删除' : '✅正常'
      console.log(`     ${index + 1}. ${ua.agent.name} (${ua.agent.slug}) - ${status}`)
    })

    // 检查是否不一致
    if (user.totalAgents !== actualUserAgents) {
      console.log(`   ⚠️  数据不一致！字段值${user.totalAgents} ≠ 实际值${actualUserAgents}`)
    } else {
      console.log(`   ✅ 数据一致`)
    }
  }

  console.log('\n\n📊 总结：')
  console.log('如果发现"数据不一致"，需要运行修复脚本更新totalAgents字段')
}

checkUserData()
  .then(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
  .catch(async (e) => {
    console.error('❌ 检查失败:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
