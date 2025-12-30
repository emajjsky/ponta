import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import prisma from '@/lib/prisma'

/**
 * PUT /api/exchange/handle
 * 接受或拒绝交换请求
 *
 * 需要认证：是
 * Request Body:
 *   proposalId: string - 交换请求ID
 *   action: 'accept' | 'reject' - 接受或拒绝
 *
 * 逻辑：
 * 1. 验证请求是否属于当前用户的交换
 * 2. 接受：执行交换（更新两个激活码的状态）
 * 3. 拒绝：更新请求状态为REJECTED
 */
export async function PUT(request: NextRequest) {
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
    const { proposalId, action } = body

    // 参数验证
    if (!proposalId || typeof proposalId !== 'string') {
      return NextResponse.json({ error: '交换请求ID不能为空' }, { status: 400 })
    }

    if (!action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: '操作类型必须是accept或reject' }, { status: 400 })
    }

    // 查询交换请求
    const proposal = await prisma.exchangeProposal.findUnique({
      where: { id: proposalId },
      include: {
        exchange: {
          include: {
            user: true,
            activationCode: {
              include: {
                agent: true,
              },
            },
            wantedAgent: true,
          },
        },
        proposer: true,
        proposerCode: {
          include: {
            agent: true,
          },
        },
      },
    })

    if (!proposal) {
      return NextResponse.json({ error: '交换请求不存在' }, { status: 404 })
    }

    // 验证是否是交换发布者
    if (proposal.exchange.userId !== payload.userId) {
      return NextResponse.json({
        error: '只有交换发布者才能处理请求'
      }, { status: 403 })
    }

    // 验证请求状态
    if (proposal.status !== 'PENDING') {
      return NextResponse.json({
        error: '该请求已处理'
      }, { status: 400 })
    }

    if (action === 'reject') {
      // 拒绝请求
      await prisma.exchangeProposal.update({
        where: { id: proposalId },
        data: { status: 'REJECTED' },
      })

      return NextResponse.json({
        success: true,
        message: '已拒绝该交换请求',
      })
    }

    // 接受请求 - 需要在事务中执行
    const result = await prisma.$transaction(async (tx) => {
      // 1. 更新交换请求状态
      await tx.exchangeProposal.update({
        where: { id: proposalId },
        data: { status: 'ACCEPTED' },
      })

      // 2. 更新交换信息状态为TRADING
      await tx.exchange.update({
        where: { id: proposal.exchangeId },
        data: { status: 'TRADING' },
      })

      // 3. 交换两个激活码的拥有者
      // 原发布者的激活码给发起者
      await tx.activationCode.update({
        where: { id: proposal.exchange.activationCodeId },
        data: {
          userId: proposal.proposerUserId,
          status: 'ACTIVATED',
          activatedAt: new Date(),
        },
      })

      // 发起者的激活码给原发布者
      await tx.activationCode.update({
        where: { id: proposal.proposerCodeId },
        data: {
          userId: proposal.exchange.userId,
          status: 'ACTIVATED',
          activatedAt: new Date(),
        },
      })

      // 3.5. 检查用户是否已拥有智能体（用于后续更新totalAgents）
      const existingPublisherUserAgent = await tx.userAgent.findFirst({
        where: {
          userId: proposal.exchange.userId,
          agentId: proposal.proposerCode.agentId,
        },
      })

      const existingProposerUserAgent = await tx.userAgent.findFirst({
        where: {
          userId: proposal.proposerUserId,
          agentId: proposal.exchange.activationCode.agentId,
        },
      })

      // 4. 为原发布者创建或更新智能体实例
      const publisherUserAgent = await tx.userAgent.upsert({
        where: {
          userId_agentId: {
            userId: proposal.exchange.userId,
            agentId: proposal.proposerCode.agentId,
          },
        },
        create: {
          userId: proposal.exchange.userId,
          agentId: proposal.proposerCode.agentId,
          activationCodeId: proposal.proposerCodeId,
          activatedAt: new Date(),
        },
        update: {
          // 更新激活码ID和激活时间
          activationCodeId: proposal.proposerCodeId,
          activatedAt: new Date(),
        },
      })

      // 5. 为发起者创建或更新智能体实例
      const proposerUserAgent = await tx.userAgent.upsert({
        where: {
          userId_agentId: {
            userId: proposal.proposerUserId,
            agentId: proposal.exchange.activationCode.agentId,
          },
        },
        create: {
          userId: proposal.proposerUserId,
          agentId: proposal.exchange.activationCode.agentId,
          activationCodeId: proposal.exchange.activationCodeId,
          activatedAt: new Date(),
        },
        update: {
          // 更新激活码ID和激活时间
          activationCodeId: proposal.exchange.activationCodeId,
          activatedAt: new Date(),
        },
      })

      // 6. 更新用户统计数据（只在创建新UserAgent时更新）
      // 通过existing变量判断是否是新获得的智能体

      // 更新原发布者的智能体数量（仅当新获得时）
      if (!existingPublisherUserAgent) {
        const publisherUser = await tx.user.findUnique({
          where: { id: proposal.exchange.userId },
          select: { totalAgents: true },
        })

        if (publisherUser) {
          await tx.user.update({
            where: { id: proposal.exchange.userId },
            data: {
              totalAgents: publisherUser.totalAgents + 1,
            },
          })
        }
      }

      // 更新发起者的智能体数量（仅当新获得时）
      if (!existingProposerUserAgent) {
        const proposerUser = await tx.user.findUnique({
          where: { id: proposal.proposerUserId },
          select: { totalAgents: true },
        })

        if (proposerUser) {
          await tx.user.update({
            where: { id: proposal.proposerUserId },
            data: {
              totalAgents: proposerUser.totalAgents + 1,
            },
          })
        }
      }

      // 7. 更新交换状态为COMPLETED（交易完成）
      await tx.exchange.update({
        where: { id: proposal.exchangeId },
        data: { status: 'COMPLETED' },
      })

      return {
        publisherUserAgent,
        proposerUserAgent,
      }
    })

    return NextResponse.json({
      success: true,
      message: '交换成功！双方都已获得新的智能体',
      data: {
        receivedAgent: proposal.proposerCode.agent,
        givenAgent: proposal.exchange.activationCode.agent,
      },
    })
  } catch (error) {
    console.error('处理交换请求错误:', error)
    return NextResponse.json({ error: '服务器错误，请稍后重试' }, { status: 500 })
  }
}
