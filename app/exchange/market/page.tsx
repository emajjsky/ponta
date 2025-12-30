import { Metadata } from 'next'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { ExchangeMarketClient } from './components/ExchangeMarketClient'

export const metadata: Metadata = {
  title: '交易市场 - 碰嗒碰嗒',
  description: '与其他用户交换重复的盲盒激活码',
}

/**
 * 交易市场页面（服务端组件）
 */
export default async function ExchangeMarketPage() {
  // 获取 Cookie
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  // 验证 Token
  let payload
  if (!token) {
    redirect('/login')
  }

  try {
    payload = await verifyToken(token)
  } catch (error) {
    redirect('/login')
  }

  // 获取所有PENDING状态的交换信息
  const exchanges = await prisma.exchange.findMany({
    where: {
      status: 'PENDING',
      userId: {
        not: payload.userId, // 不显示自己发布的
      },
    },
    include: {
      user: {
        select: {
          id: true,
          uid: true,
          nickname: true,
          avatar: true,
        },
      },
      activationCode: {
        select: {
          id: true,
          agent: {
            include: {
              series: true,
            },
          },
        },
      },
      wantedAgent: {
        include: {
          series: true,
        },
      },
      proposals: {
        where: {
          proposerUserId: payload.userId,
        },
        take: 1,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // 获取所有可用的系列和智能体（用于筛选）
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
    orderBy: {
      order: 'asc',
    },
  })

  // 转换数据，隐藏敏感信息
  const marketData = exchanges.map((exchange) => ({
    id: exchange.id,
    user: exchange.user,
    providedAgent: exchange.activationCode.agent, // 提供的智能体
    wantedAgent: exchange.wantedAgent, // 想要的智能体
    status: exchange.status,
    hasProposed: exchange.proposals.length > 0, // 当前用户是否已发起交换
    createdAt: exchange.createdAt,
  }))

  return (
    <ExchangeMarketClient
      initialExchanges={marketData}
      agents={agents}
      series={series}
    />
  )
}
