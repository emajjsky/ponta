import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * 简单修复：重新统计所有用户的totalAgents字段
 */
async function fixTotalAgents() {
  console.log('🔧 开始修复totalAgents字段...\n')

  try {
    // 获取所有用户
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        nickname: true,
        totalAgents: true,
      },
    })

    console.log(`📊 找到 ${users.length} 个用户\n`)

    let updatedCount = 0

    for (const user of users) {
      // 统计实际的userAgent记录数
      const actualCount = await prisma.userAgent.count({
        where: { userId: user.id },
      })

      console.log(`👤 ${user.nickname} (${user.email})`)
      console.log(`   当前totalAgents: ${user.totalAgents}`)
      console.log(`   实际记录数: ${actualCount}`)

      // 如果不一致，更新
      if (user.totalAgents !== actualCount) {
        await prisma.user.update({
          where: { id: user.id },
          data: { totalAgents: actualCount },
        })

        console.log(`   ✅ 已更新: ${user.totalAgents} → ${actualCount}`)
        updatedCount++
      } else {
        console.log(`   ✅ 无需更新`)
      }

      console.log()
    }

    console.log(`\n✅ 修复完成！共更新了 ${updatedCount} 个用户的数据`)
  } catch (error: any) {
    console.error('\n❌ 修复失败:', error.message)
    throw error
  }
}

fixTotalAgents()
  .then(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
  .catch(async (e) => {
    console.error('❌ 脚本执行错误:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
