import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * 修复用户统计数据
 * 根据现有数据重新计算 totalAgents 和 totalChats
 */
async function fixUserStats() {
  console.log('🔄 开始修复用户统计数据...')

  // 获取所有用户
  const users = await prisma.user.findMany()

  for (const user of users) {
    // 统计激活的智能体数量
    const agentCount = await prisma.userAgent.count({
      where: { userId: user.id },
    })

    // 统计对话次数（只统计用户的发言次数）
    const chatCount = await prisma.chatHistory.count({
      where: {
        userId: user.id,
        role: 'user', // 只统计用户消息，不算AI回复
      },
    })

    // 更新用户数据
    await prisma.user.update({
      where: { id: user.id },
      data: {
        totalAgents: agentCount,
        totalChats: chatCount,
      },
    })

    console.log(`  ✅ 用户 ${user.nickname}: ${agentCount} 个智能体, ${chatCount} 次对话`)
  }

  console.log('✅ 用户统计数据修复完成!')
}

// 执行修复
fixUserStats()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
