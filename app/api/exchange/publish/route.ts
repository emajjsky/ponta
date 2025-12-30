import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import prisma from '@/lib/prisma'

/**
 * POST /api/exchange/publish
 * 发布交换信息到交易市场
 *
 * 需要认证：是
 * Request Body:
 *   code: string - 激活码
 *   wantedAgentId: string - 想要的智能体ID
 *
 * 逻辑：
 * 1. 验证激活码是否存在且未激活
 * 2. 验证激活码是否已经在交易市场
 * 3. 创建交换记录
 * 4. 返回交换信息
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
    const { code, wantedAgentId } = body

    // 参数验证
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: '激活码不能为空' }, { status: 400 })
    }

    if (!wantedAgentId || typeof wantedAgentId !== 'string') {
      return NextResponse.json({ error: '请选择想要交换的智能体' }, { status: 400 })
    }

    // 查询激活码
    const activationCode = await prisma.activationCode.findUnique({
      where: { code },
      include: {
        agent: true,
      },
    })

    if (!activationCode) {
      return NextResponse.json({ error: '激活码不存在' }, { status: 404 })
    }

    // 验证激活码状态
    if (activationCode.status !== 'UNUSED') {
      return NextResponse.json({
        error: '该激活码已被使用或已失效，无法发布到交易市场'
      }, { status: 400 })
    }

    // 验证用户是否已激活该智能体（必须先拥有该智能体才能发布重复的）
    const userAgent = await prisma.userAgent.findFirst({
      where: {
        userId: payload.userId,
        agentId: activationCode.agentId,
      },
    })

    if (!userAgent) {
      return NextResponse.json({
        error: `您还没有激活过【${activationCode.agent.name}】，请先激活。交易市场只能发布自己已有智能体的重复激活码哦`,
        needActivate: true,
        agentName: activationCode.agent.name,
      }, { status: 400 })
    }

    // 注意：只要用户已激活该智能体，就可以发布该智能体的任何未使用激活码
    // 不需要再验证激活码是否属于该用户，因为用户拥有该智能体就说明拥有激活码的权利

    // 检查激活码是否已经在交易市场
    const existingExchange = await prisma.exchange.findUnique({
      where: { activationCodeId: activationCode.id },
    })

    if (existingExchange) {
      return NextResponse.json({
        error: '该激活码已在交易市场中，不能重复发布'
      }, { status: 400 })
    }

    // 验证想要的智能体是否存在
    const wantedAgent = await prisma.agent.findUnique({
      where: { id: wantedAgentId },
    })

    if (!wantedAgent) {
      return NextResponse.json({ error: '想要交换的智能体不存在' }, { status: 404 })
    }

    // 不能用自己的激活码交换同一个智能体
    if (activationCode.agentId === wantedAgentId) {
      return NextResponse.json({
        error: '不能用自己的激活码交换同一个智能体'
      }, { status: 400 })
    }

    // 创建交换记录
    const exchange = await prisma.exchange.create({
      data: {
        userId: payload.userId,
        activationCodeId: activationCode.id,
        wantedAgentId: wantedAgentId,
        status: 'PENDING',
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
      },
    })

    return NextResponse.json({
      success: true,
      exchange,
      message: '发布成功！您的交换信息已上架到交易市场',
    })
  } catch (error) {
    console.error('发布交换信息错误:', error)
    return NextResponse.json({ error: '服务器错误，请稍后重试' }, { status: 500 })
  }
}
