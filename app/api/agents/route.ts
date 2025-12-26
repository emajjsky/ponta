import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET /api/agents
 * 获取智能体列表（用于商城展示）
 *
 * 查询参数：
 * - rarity: 稀有度过滤 (STANDARD | HIDDEN)
 * - search: 关键词搜索（名称或描述）
 * - sort: 排序方式 (price-asc | price-desc | created)
 * - limit: 返回数量限制（默认20）
 * - offset: 分页偏移量（默认0）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const rarity = searchParams.get('rarity')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'created'
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100) // 最多100个
    const offset = Number(searchParams.get('offset')) || 0

    // 构建查询条件
    const where: any = {
      deletedAt: null, // 只返回未删除的智能体
    }

    // 稀有度过滤
    if (rarity && ['STANDARD', 'HIDDEN'].includes(rarity)) {
      where.rarity = rarity
    }

    // 关键词搜索
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ]
    }

    // 排序方式
    let orderBy: any = {}
    switch (sort) {
      case 'price-asc':
        orderBy = { price: 'asc' }
        break
      case 'price-desc':
        orderBy = { price: 'desc' }
        break
      case 'created':
      default:
        orderBy = { createdAt: 'desc' }
        break
    }

    // 查询智能体列表
    const agents = await prisma.agent.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
      select: {
        id: true,
        name: true,
        slug: true,
        rarity: true,
        avatar: true,
        description: true,
        abilities: true,
        price: true,
        seriesId: true,
        series: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        createdAt: true,
      },
    })

    // 解析 abilities JSON 字符串
    const agentsWithParsedAbilities = agents.map((agent) => ({
      ...agent,
      abilities: JSON.parse(agent.abilities),
    }))

    // 获取总数（用于分页）
    const total = await prisma.agent.count({ where })

    return NextResponse.json(
      {
        success: true,
        agents: agentsWithParsedAbilities,
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
    console.error('获取智能体列表错误:', error)
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    )
  }
}
