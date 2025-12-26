import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import prisma from '@/lib/prisma'

/**
 * GET /api/admin/orders
 * 获取所有订单（管理员）
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100)

    const where: any = {}
    if (status) where.status = status

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              nickname: true,
            },
          },
          agent: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
            },
          },
          activationCode: {
            select: {
              id: true,
              code: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json(
      {
        success: true,
        orders,
        pagination: {
          total,
          limit,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    if (error.message === 'ADMIN_REQUIRED') {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 })
    }
    console.error('获取订单列表错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
