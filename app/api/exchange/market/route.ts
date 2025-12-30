import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import prisma from '@/lib/prisma'

/**
 * GET /api/exchange/market
 * 获取交易市场列表
 *
 * 需要认证：是
 * Query Params:
 *   agentId: string - 筛选想要的智能体（可选）
 *   seriesId: string - 筛选系列（可选）
 *   status: string - 筛选状态（可选，默认PENDING）
 *
 * 返回所有PENDING状态的交换信息（隐藏激活码）
 */
export async function GET(request: NextRequest) {
  try {
    // 从 Cookie 中获取 Token
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: '未登录，请先登录' }, { status: 401 })
    }

    // 验证 Token
    let payload
    try {
      payload = await verifyToken(token)
    } catch (error) {
      return NextResponse.json({ error: '登录已过期，请重新登录' }, { status: 401 })
    }

    // 获取查询参数
    const searchParams = request.nextUrl.searchParams
    const agentId = searchParams.get('agentId')
    const seriesId = searchParams.get('seriesId')
    const status = searchParams.get('status') || 'PENDING'

    // 构建查询条件
    const where: any = {
      status,
      userId: {
        not: payload.userId, // 不显示自己发布的
      },
    }

    if (agentId) {
      where.wantedAgentId = agentId
    }

    if (seriesId) {
      where.wantedAgent = {
        seriesId: seriesId,
      }
    }

    // 查询交换列表
    const exchanges = await prisma.exchange.findMany({
      where,
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
            // 不返回code字段，隐藏激活码
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

    return NextResponse.json({
      success: true,
      exchanges: marketData,
      total: marketData.length,
    })
  } catch (error) {
    console.error('获取交易市场错误:', error)
    return NextResponse.json({ error: '服务器错误，请稍后重试' }, { status: 500 })
  }
}
