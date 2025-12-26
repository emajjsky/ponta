import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import prisma from '@/lib/prisma'

/**
 * GET /api/user-agents
 * 获取当前用户已激活的智能体列表
 *
 * 需要认证：是
 * Query Parameters:
 *   - limit: 返回数量（默认20，最多100）
 *   - offset: 分页偏移量（默认0）
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
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100)
    const offset = Number(searchParams.get('offset')) || 0

    // 查询用户的智能体（包含分页）
    const [userAgents, total] = await Promise.all([
      prisma.userAgent.findMany({
        where: {
          userId: payload.userId,
          agent: {
            deletedAt: null,
          },
        },
        include: {
          agent: true,
        },
        orderBy: {
          activatedAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.userAgent.count({
        where: {
          userId: payload.userId,
          agent: {
            deletedAt: null,
          },
        },
      }),
    ])

    // 过滤掉已删除的智能体
    const validUserAgents = userAgents.filter((ua) => ua.agent !== null)

    // 解析 abilities 并格式化数据
    const formattedUserAgents = validUserAgents.map((ua) => ({
      id: ua.id,
      activatedAt: ua.activatedAt,
      agent: {
        id: ua.agent!.id,
        name: ua.agent!.name,
        slug: ua.agent!.slug,
        rarity: ua.agent!.rarity,
        avatar: ua.agent!.avatar,
        description: ua.agent!.description,
        abilities: JSON.parse(ua.agent!.abilities),
        price: ua.agent!.price,
      },
    }))

    return NextResponse.json(
      {
        success: true,
        userAgents: formattedUserAgents,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('获取用户智能体列表错误:', error)
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    )
  }
}
