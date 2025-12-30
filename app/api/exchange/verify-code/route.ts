import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import prisma from '@/lib/prisma'

/**
 * POST /api/exchange/verify-code
 * 验证激活码并返回智能体信息
 *
 * 需要认证：是
 * Request Body:
 *   code: string - 激活码
 *
 * 返回激活码对应的智能体信息（用于发布交换页面）
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
    const { code } = body

    // 参数验证
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: '激活码不能为空' }, { status: 400 })
    }

    // 查询激活码
    const activationCode = await prisma.activationCode.findUnique({
      where: { code },
      include: {
        agent: {
          include: {
            series: true,
          },
        },
      },
    })

    if (!activationCode) {
      return NextResponse.json({
        success: false,
        error: '激活码不存在'
      }, { status: 404 })
    }

    // 检查激活码状态
    let canPublish = true
    let statusMessage = '可以发布到交易市场'

    if (activationCode.status !== 'UNUSED') {
      canPublish = false
      if (activationCode.status === 'ACTIVATED') {
        statusMessage = '该激活码已被激活，无法发布'
      } else if (activationCode.status === 'VOID') {
        statusMessage = '该激活码已失效，无法发布'
      }
    }

    // 检查用户是否已激活该智能体（关键验证！）
    const userAgent = await prisma.userAgent.findFirst({
      where: {
        userId: payload.userId,
        agentId: activationCode.agentId,
      },
    })

    if (!userAgent) {
      canPublish = false
      statusMessage = `您还没有激活过【${activationCode.agent.name}】，请先激活。交易市场只能发布自己已有智能体的重复激活码哦`
    }

    // 注意：只要用户已激活该智能体，就可以发布该智能体的任何未使用激活码
    // 不需要再验证激活码是否属于该用户，因为用户拥有该智能体就说明拥有激活码的权利

    // 检查是否已在交易市场
    const existingExchange = await prisma.exchange.findFirst({
      where: {
        activationCodeId: activationCode.id,
        status: {
          in: ['PENDING', 'TRADING'],
        },
      },
    })

    if (existingExchange) {
      canPublish = false
      statusMessage = '该激活码已在交易市场中'
    }

    return NextResponse.json({
      success: true,
      agent: activationCode.agent,
      status: activationCode.status,
      canPublish,
      statusMessage,
    })
  } catch (error) {
    console.error('验证激活码错误:', error)
    return NextResponse.json({ error: '服务器错误，请稍后重试' }, { status: 500 })
  }
}
