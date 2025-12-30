import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixTotalAgents() {
  console.log('开始修复totalAgents数据...\n')

  // 获取所有用户
  const users = await prisma.user.findMany({
    select: {
      id: true,
      uid: true,
      nickname: true,
      totalAgents: true,
    },
  })

  for (const user of users) {
    // 统计实际的UserAgent数量
    const actualCount = await prisma.userAgent.count({
      where: { userId: user.id },
    })

    console.log(`用户 ${user.nickname} (UID: ${user.uid})`)
    console.log(`  当前totalAgents: ${user.totalAgents}`)
    console.log(`  实际UserAgent数量: ${actualCount}`)

    if (user.totalAgents !== actualCount) {
      console.log(`  ⚠️  不一致！更新为 ${actualCount}`)

      await prisma.user.update({
        where: { id: user.id },
        data: { totalAgents: actualCount },
      })

      console.log(`  ✅ 已修复`)
    } else {
      console.log(`  ✅ 一致，无需修复`)
    }

    console.log()
  }

  console.log('修复完成！')
}

fixTotalAgents()
  .then(() => {
    console.log('\n脚本执行成功')
    process.exit(0)
  })
  .catch((error) => {
    console.error('脚本执行失败:', error)
    process.exit(1)
  })
