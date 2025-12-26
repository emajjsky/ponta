import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET /api/shop/series
 * 获取所有启用的系列（商城）
 *
 * 需要认证：否
 */
export async function GET(request: NextRequest) {
  try {
    const series = await prisma.series.findMany({
      where: {
        isActive: true,
      },
      include: {
        _count: {
          select: {
            agents: true,
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    })

    return NextResponse.json(
      {
        success: true,
        series,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('获取系列列表错误:', error)
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    )
  }
}
