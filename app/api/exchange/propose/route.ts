import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import prisma from '@/lib/prisma'

/**
 * POST /api/exchange/propose
 * 发起交换请求
 *
 * 需要认证：是
 * Request Body:
 *   exchangeId: string - 交换信息ID
 *   code: string - 发起者提供的激活码
 *
 * 逻辑：
 * 1. 验证交换信息是否存在且状态为PENDING
 * 2. 验证激活码是否存在且未激活
 * 3. 验证激活码对应的智能体是否是发布者想要的
 * 4. 创建交换请求
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
      return NextResponse.json({ error: '交换信息ID不能为空' }, { status: 400 })
    }

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: '激活码不能为空' }, { status: 400 })
    }

    // 查询交换信息
    const exchange = await prisma.exchange.findUnique({
      where: { id: exchangeId },
      include: {
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

    // 验证状态
    if (exchange.status !== 'PENDING') {
      return NextResponse.json({
        error: '该交换已关闭或已完成'
      }, { status: 400 })
    }

    // 不能向自己发起交换请求
    if (exchange.userId === payload.userId) {
      return NextResponse.json({
        error: '不能向自己发起交换请求'
      }, { status: 400 })
    }

    // 检查是否已发起过请求
    const existingProposal = await prisma.exchangeProposal.findFirst({
      where: {
        exchangeId,
        proposerUserId: payload.userId,
        status: {
          in: ['PENDING', 'ACCEPTED'],
        },
      },
    })

    if (existingProposal) {
      return NextResponse.json({
        error: '您已发起过交换请求，请勿重复提交'
      }, { status: 400 })
    }

    // 查询发起者的激活码
    const proposerCode = await prisma.activationCode.findUnique({
      where: { code },
      include: {
        agent: true,
      },
    })

    if (!proposerCode) {
      return NextResponse.json({ error: '激活码不存在' }, { status: 404 })
    }

    // 验证激活码状态
    if (proposerCode.status !== 'UNUSED') {
      return NextResponse.json({
        error: '该激活码已被使用或已失效，无法用于交换'
      }, { status: 400 })
    }

    // 检查激活码是否已在其他交易中
    const codeInExchange = await prisma.exchange.findFirst({
      where: {
        activationCodeId: proposerCode.id,
        status: {
          in: ['PENDING', 'TRADING'],
        },
      },
    })

    if (codeInExchange) {
      return NextResponse.json({
        error: '该激活码已在交易市场中'
      }, { status: 400 })
    }

    // 验证发起者提供的激活码是否是发布者想要的智能体
    if (proposerCode.agent.id !== exchange.wantedAgentId) {
      return NextResponse.json({
        error: `您提供的激活码是【${proposerCode.agent.name}】，但发布者想要的是【${exchange.wantedAgent.name}】`
      }, { status: 400 })
    }

    // 创建交换请求
    const proposal = await prisma.exchangeProposal.create({
      data: {
        exchangeId,
        proposerUserId: payload.userId,
        proposerCodeId: proposerCode.id,
        status: 'PENDING',
      },
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
        exchange: {
          include: {
            user: {
              select: {
                id: true,
                uid: true,
                nickname: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      proposal,
      message: '交换请求已发送，等待对方确认',
    })
  } catch (error) {
    console.error('发起交换请求错误:', error)
    return NextResponse.json({ error: '服务器错误，请稍后重试' }, { status: 500 })
  }
}
