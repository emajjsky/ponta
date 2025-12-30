import { Metadata } from 'next'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { PublishExchangeClient } from './components/PublishExchangeClient'

export const metadata: Metadata = {
  title: '发布交换 - 碰嗒碰嗒',
  description: '将重复的盲盒激活码发布到交易市场',
}

/**
 * 发布交换页面（服务端组件）
 */
export default async function PublishExchangePage() {
  // 获取 Cookie
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  // 验证 Token
  if (!token) {
    redirect('/login')
  }

  try {
    await verifyToken(token)
  } catch (error) {
    redirect('/login')
  }

  // 获取所有可用的智能体（用于选择想要的）
  const agents = await prisma.agent.findMany({
    where: {
      isActive: true,
      deletedAt: null,
    },
    include: {
      series: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  const series = await prisma.series.findMany({
    where: {
      isActive: true,
    },
    include: {
      agents: {
        where: {
          isActive: true,
          deletedAt: null,
        },
      },
    },
    orderBy: {
      order: 'asc',
    },
  })

  return <PublishExchangeClient agents={agents} series={series} />
}
