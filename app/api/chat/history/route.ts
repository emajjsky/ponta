import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { getChatHistory } from '@/lib/coze'
import prisma from '@/lib/prisma'

/**
 * GET /api/chat/history
 * 获取与智能体的对话历史
 *
 * 需要认证：是
 * Query Parameters:
 *   agentSlug: string - 智能体 slug（必需）
 *   limit: number - 返回数量限制（默认50，最多100）
 */
export async function GET(request: NextRequest) {
  try {
    // 从 Cookie 中获取 Token
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: '未登录，请先登录' },
        { status: 401 }
      )
    }

    // 验证 Token
    let payload
    try {
      payload = await verifyToken(token)
    } catch (error) {
      return NextResponse.json(
        { error: '登录已过期，请重新登录' },
        { status: 401 }
      )
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const agentSlug = searchParams.get('agentSlug')
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100)

    // 参数验证
    if (!agentSlug) {
      return NextResponse.json(
        { error: '智能体 slug 不能为空' },
        { status: 400 }
      )
    }

    // 查询智能体
    const agent = await prisma.agent.findUnique({
      where: { slug: agentSlug },
    })

    if (!agent || agent.deletedAt) {
      return NextResponse.json(
        { error: '智能体不存在' },
        { status: 404 }
      )
    }

    // 检查用户是否已激活该智能体
    const userAgent = await prisma.userAgent.findFirst({
      where: {
        userId: payload.userId,
        agentId: agent.id,
      },
    })

    if (!userAgent) {
      return NextResponse.json(
        { error: '你还没有激活该智能体' },
        { status: 403 }
      )
    }

    // 获取对话历史
    const history = await getChatHistory(payload.userId, agent.id, limit)

    return NextResponse.json(
      {
        success: true,
        history,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('获取对话历史错误:', error)
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/chat/history
 * 清空与智能体的对话历史
 *
 * 需要认证：是
 * Body: { userAgentId: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    // 从 Cookie 中获取 Token
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: '未登录，请先登录' },
        { status: 401 }
      )
    }

    // 验证 Token
    let payload
    try {
      payload = await verifyToken(token)
    } catch (error) {
      return NextResponse.json(
        { error: '登录已过期，请重新登录' },
        { status: 401 }
      )
    }

    // 获取请求体
    const body = await request.json()
    const { userAgentId } = body

    if (!userAgentId) {
      return NextResponse.json(
        { error: '缺少 userAgentId' },
        { status: 400 }
      )
    }

    // 验证 userAgent 是否属于当前用户
    const userAgent = await prisma.userAgent.findUnique({
      where: { id: userAgentId },
    })

    if (!userAgent) {
      return NextResponse.json(
        { error: '智能体实例不存在' },
        { status: 404 }
      )
    }

    if (userAgent.userId !== payload.userId) {
      return NextResponse.json(
        { error: '无权清空该对话历史' },
        { status: 403 }
      )
    }

    // 删除该智能体的所有对话历史
    await prisma.chatHistory.deleteMany({
      where: { userAgentId },
    })

    return NextResponse.json(
      {
        success: true,
        message: '对话历史已清空',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('清空对话历史错误:', error)
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    )
  }
}
