import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * 迁移脚本：将旧数据的botId转换成新的provider和providerConfig
 *
 * 旧数据结构：
 * - botId: string
 *
 * 新数据结构：
 * - provider: 'COZE' | 'OPENAI'
 * - providerConfig: JSON字符串 { botId, apiToken? }
 */

async function migrateAgents() {
  console.log('🔄 开始迁移智能体数据...')

  // 获取所有需要迁移的智能体（provider或providerConfig为空）
  const agents = await prisma.agent.findMany({
    where: {
      OR: [
        { provider: { equals: '', mode: 'insensitive' } },
        { providerConfig: { equals: '', mode: 'insensitive' } },
      ],
    },
  })

  console.log(`📊 找到 ${agents.length} 个需要迁移的智能体`)

  for (const agent of agents) {
    // 如果有旧的botId字段，转换成新格式
    if (agent.botId) {
      const providerConfig = {
        botId: agent.botId,
        apiToken: '', // 留空，使用环境变量
      }

      await prisma.agent.update({
        where: { id: agent.id },
        data: {
          provider: 'COZE',
          providerConfig: JSON.stringify(providerConfig),
        },
      })

      console.log(`  ✅ 迁移: ${agent.name} (${agent.slug})`)
    }
  }

  console.log('✅ 迁移完成！')
}

// 执行迁移
migrateAgents()
  .then(() => {
    console.log('🎉 迁移成功！')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 迁移失败:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
