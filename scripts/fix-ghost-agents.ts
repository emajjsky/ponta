import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * 修复幽灵智能体问题
 *
 * 问题：种子数据重新生成后，agent的ID会变化，
 * 但userAgents表还保留着旧的agentId引用，
 * 导致用户显示的智能体数量比实际多。
 *
 * 解决：删除所有指向已删除agent的userAgent记录
 */
async function fixGhostAgents() {
  console.log('🔧 开始修复幽灵智能体...\n')

  try {
    // 1. 查找所有userAgent记录
    console.log('📊 检查用户智能体数据...')
    const allUserAgents = await prisma.userAgent.findMany({
      include: {
        agent: true,
      },
    })

    console.log(`  总共找到 ${allUserAgents.length} 条userAgent记录`)

    // 2. 找出指向已删除agent的记录
    const ghostUserAgents = allUserAgents.filter((ua) => ua.agent.deletedAt !== null)

    if (ghostUserAgents.length === 0) {
      console.log('  ✅ 没有发现幽灵智能体，数据正常！')
      return
    }

    console.log(`  ⚠️  发现 ${ghostUserAgents.length} 条幽灵记录（指向已删除的智能体）`)

    // 3. 按用户分组显示
    const byUser: Record<string, typeof ghostUserAgents> = {}
    ghostUserAgents.forEach((ua) => {
      if (!byUser[ua.userId]) {
        byUser[ua.userId] = []
      }
      byUser[ua.userId].push(ua)
    })

    console.log('\n👻 幽灵记录详情：')
    for (const [userId, userAgents] of Object.entries(byUser)) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, nickname: true },
      })

      console.log(`\n  用户: ${user?.nickname} (${user?.email})`)
      console.log(`  幻灵智能体:`)
      userAgents.forEach((ua) => {
        console.log(`    - ${ua.agent.name} (ID: ${ua.agentId})`)
      })
    }

    // 4. 删除幽灵记录
    console.log('\n🗑️  开始删除幽灵记录...')

    for (const ua of ghostUserAgents) {
      await prisma.userAgent.delete({
        where: { id: ua.id },
      })
      console.log(`  ✅ 已删除: ${ua.agent.name}`)
    }

    // 5. 重新统计所有用户的totalAgents
    console.log('\n📊 重新统计用户智能体数量...')

    const users = await prisma.user.findMany({
      select: { id: true },
    })

    for (const user of users) {
      const actualCount = await prisma.userAgent.count({
        where: { userId: user.id },
      })

      await prisma.user.update({
        where: { id: user.id },
        data: { totalAgents: actualCount },
      })

      console.log(`  用户 ${user.id}: ${actualCount} 个智能体`)
    }

    console.log('\n✅ 修复完成！')
    console.log('\n📋 修复总结：')
    console.log(`  - 删除了 ${ghostUserAgents.length} 条幽灵记录`)
    console.log(`  - 更新了 ${users.length} 个用户的统计数据`)
  } catch (error: any) {
    console.error('\n❌ 修复失败:', error.message)
    throw error
  }
}

fixGhostAgents()
  .then(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
  .catch(async (e) => {
    console.error('❌ 脚本执行错误:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
