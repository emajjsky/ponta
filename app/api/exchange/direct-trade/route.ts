import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import prisma from '@/lib/prisma'

/**
 * POST /api/exchange/direct-trade
 * 直接完成交换（无需对方确认）
 *
 * 需要认证：是
 * Request Body:
 *   exchangeId: string - 交换ID
 *   code: string - 用户提供的激活码
 *
 * 逻辑：
 * 1. 验证交换存在且状态为PENDING
 * 2. 验证激活码存在且可用
 * 3. 验证用户已拥有对应的智能体
 * 4. 直接完成交换（更新激活码、创建UserAgent、更新totalAgents等）
 * 5. 更新交换状态为COMPLETED
 */
export async function POST(request: NextRequest) {
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

    // 获取请求体
    const body = await request.json()
    const { exchangeId, code } = body

    // 参数验证
    if (!exchangeId || typeof exchangeId !== 'string') {
      return NextResponse.json({ error: '交换ID不能为空' }, { status: 400 })
    }

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: '激活码不能为空' }, { status: 400 })
    }

    // 查询交换信息
    const exchange = await prisma.exchange.findUnique({
      where: { id: exchangeId },
      include: {
        user: true,
        activationCode: {
          include: {
            agent: true,
          },
        },
        wantedAgent: true,
      },
    })

    if (!exchange) {
      return NextResponse.json({ error: '交换信息不存在' }, { status: 404 })
    }

    // 验证交换状态
    if (exchange.status !== 'PENDING') {
      return NextResponse.json({
        error: '该交换已完成或已取消',
      }, { status: 400 })
    }

    // 不能和自己的交换交易
    if (exchange.userId === payload.userId) {
      return NextResponse.json({
        error: '不能和自己的交换进行交易'
      }, { status: 400 })
    }

    // 查询用户提供的激活码
    const userCode = await prisma.activationCode.findUnique({
      where: { code },
      include: {
        agent: true,
      },
    })

    if (!userCode) {
      return NextResponse.json({ error: '激活码不存在' }, { status: 404 })
    }

    // 验证激活码状态
    if (userCode.status !== 'UNUSED') {
      return NextResponse.json({
        error: '该激活码已被使用或已失效'
      }, { status: 400 })
    }

    // 验证智能体是否匹配
    if (userCode.agentId !== exchange.wantedAgentId) {
      return NextResponse.json({
        error: `您提供的激活码是【${userCode.agent.name}】，但对方想要的是【${exchange.wantedAgent.name}】`,
      }, { status: 400 })
    }

    // 验证用户是否已拥有该智能体
    const userAgent = await prisma.userAgent.findFirst({
      where: {
        userId: payload.userId,
        agentId: userCode.agentId,
      },
    })

    if (!userAgent) {
      return NextResponse.json({
        error: `您还没有激活过【${userCode.agent.name}】，请先激活。交易市场只能发布自己已有智能体的重复激活码哦`,
      }, { status: 400 })
    }

    // 执行交换（在事务中）
    const result = await prisma.$transaction(async (tx) => {
      // 1. 交换两个激活码的拥有者
      // 交换发布者的激活码给当前用户
      await tx.activationCode.update({
        where: { id: exchange.activationCodeId },
        data: {
          userId: payload.userId,
          status: 'ACTIVATED',
          activatedAt: new Date(),
        },
      })

      // 当前用户的激活码给交换发布者
      await tx.activationCode.update({
        where: { id: userCode.id },
        data: {
          userId: exchange.userId,
          status: 'ACTIVATED',
          activatedAt: new Date(),
        },
      })

      // 2. 检查用户是否已拥有智能体（用于后续更新totalAgents）
      const existingCurrentUserAgent = await tx.userAgent.findFirst({
        where: {
          userId: payload.userId,
          agentId: exchange.activationCode.agentId,
        },
      })

      const existingExchangeUserAgent = await tx.userAgent.findFirst({
        where: {
          userId: exchange.userId,
          agentId: userCode.agentId,
        },
      })

      // 3. 为当前用户创建或更新智能体实例
      const currentUserAgent = await tx.userAgent.upsert({
        where: {
          userId_agentId: {
            userId: payload.userId,
            agentId: exchange.activationCode.agentId,
          },
        },
        create: {
          userId: payload.userId,
          agentId: exchange.activationCode.agentId,
          activationCodeId: exchange.activationCodeId,
          activatedAt: new Date(),
        },
        update: {
          activationCodeId: exchange.activationCodeId,
          activatedAt: new Date(),
        },
      })

      // 4. 为交换发布者创建或更新智能体实例
      const exchangeUserAgent = await tx.userAgent.upsert({
        where: {
          userId_agentId: {
            userId: exchange.userId,
            agentId: userCode.agentId,
          },
        },
        create: {
          userId: exchange.userId,
          agentId: userCode.agentId,
          activationCodeId: userCode.id,
          activatedAt: new Date(),
        },
        update: {
          activationCodeId: userCode.id,
          activatedAt: new Date(),
        },
      })

      // 5. 更新用户统计数据（只在创建新UserAgent时更新）
      // 更新当前用户的智能体数量（仅当新获得时）
      if (!existingCurrentUserAgent) {
        const currentUser = await tx.user.findUnique({
          where: { id: payload.userId },
          select: { totalAgents: true },
        })

        if (currentUser) {
          await tx.user.update({
            where: { id: payload.userId },
            data: {
              totalAgents: currentUser.totalAgents + 1,
            },
          })
        }
      }

      // 更新交换发布者的智能体数量（仅当新获得时）
      if (!existingExchangeUserAgent) {
        const exchangeUser = await tx.user.findUnique({
          where: { id: exchange.userId },
          select: { totalAgents: true },
        })

        if (exchangeUser) {
          await tx.user.update({
            where: { id: exchange.userId },
            data: {
              totalAgents: exchangeUser.totalAgents + 1,
            },
          })
        }
      }

      // 6. 更新交换状态为COMPLETED（交易完成）
      await tx.exchange.update({
        where: { id: exchangeId },
        data: { status: 'COMPLETED' },
      })

      // 7. 创建ExchangeProposal记录（用于记录用户B参与的交易）
      // 这样用户B在"我的交易"页面能看到自己参与的交易
      await tx.exchangeProposal.create({
        data: {
          exchangeId: exchangeId,
          proposerUserId: payload.userId,
          proposerCodeId: userCode.id,
          status: 'COMPLETED', // 直接标记为已完成
        },
      })

      return {
        currentUserAgent,
        exchangeUserAgent,
      }
    })

    return NextResponse.json({
      success: true,
      message: '交换成功！双方都已获得新的智能体',
      data: {
        receivedAgent: exchange.activationCode.agent,
        givenAgent: userCode.agent,
      },
    })
  } catch (error) {
    console.error('直接交换错误:', error)
    return NextResponse.json({ error: '服务器错误，请稍后重试' }, { status: 500 })
  }
}
