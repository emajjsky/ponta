import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET /api/shop/series/[slug]
 * 获取系列详情及所有角色（商城）
 *
 * 需要认证：否
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const series = await prisma.series.findUnique({
      where: {
        slug,
        isActive: true,
      },
      include: {
        agents: {
          where: {
            deletedAt: null,
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            slug: true,
            rarity: true,
            avatar: true,
            description: true,
            abilities: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    if (!series) {
      return NextResponse.json(
        { error: '系列不存在或已下架' },
        { status: 404 }
      )
    }

    // 解析 abilities
    const seriesWithParsedAbilities = {
      ...series,
      agents: series.agents.map((agent) => ({
        ...agent,
        abilities: JSON.parse(agent.abilities),
      })),
    }

    return NextResponse.json(
      {
        success: true,
        series: seriesWithParsedAbilities,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('获取系列详情错误:', error)
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    )
  }
}
