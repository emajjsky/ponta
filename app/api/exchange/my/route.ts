import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import prisma from '@/lib/prisma'

/**
 * GET /api/exchange/my
 * 获取我的发布和请求
 *
 * 需要认证：是
 * Query Params:
 *   type: 'publish' | 'propose' | 'all' - 类型（默认all）
 *
 * 返回：
 * - publish: 我发布的交换信息
 * - propose: 我发起的交换请求
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
    const type = searchParams.get('type') || 'all'

    const result: any = {}

    // 获取我发布的交换信息
    if (type === 'all' || type === 'publish') {
      const myExchanges = await prisma.exchange.findMany({
        where: {
          userId: payload.userId,
        },
        include: {
          activationCode: {
            include: {
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
            include: {
              proposer: {
                select: {
                  id: true,
                  uid: true,
                  nickname: true,
                  avatar: true,
                },
              },
              proposerCode: {
                include: {
                  agent: {
                    include: {
                      series: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      result.myExchanges = myExchanges.map((exchange) => ({
        id: exchange.id,
        providedAgent: exchange.activationCode.agent,
        wantedAgent: exchange.wantedAgent,
        status: exchange.status,
        proposalCount: exchange.proposals.length,
        pendingProposals: exchange.proposals.filter((p) => p.status === 'PENDING'),
        createdAt: exchange.createdAt,
      }))
    }

    // 获取我发起的交换请求
    if (type === 'all' || type === 'propose') {
      const myProposals = await prisma.exchangeProposal.findMany({
        where: {
          proposerUserId: payload.userId,
        },
        include: {
          exchange: {
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
                include: {
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
            },
          },
          proposerCode: {
            include: {
              agent: {
                include: {
                  series: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      result.myProposals = myProposals.map((proposal) => ({
        id: proposal.id,
        status: proposal.status,
        myAgent: proposal.proposerCode.agent,
        wantedAgent: proposal.exchange.wantedAgent,
        publisher: proposal.exchange.user,
        providedAgent: proposal.exchange.activationCode.agent,
        exchangeStatus: proposal.exchange.status,
        createdAt: proposal.createdAt,
      }))
    }

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('获取我的交易信息错误:', error)
    return NextResponse.json({ error: '服务器错误，请稍后重试' }, { status: 500 })
  }
}
