import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import prisma from '@/lib/prisma'

/**
 * GET /api/admin/stats
 * 获取平台统计数据（管理员）
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)

    // 并行获取各种统计数据
    const [
      totalUsers,
      totalAgents,
      totalOrders,
      totalActivationCodes,
      activeUsers,
      usedActivationCodes,
      totalRevenue,
      recentOrders,
      topAgents,
    ] = await Promise.all([
      // 总用户数
      prisma.user.count(),

      // 总智能体数
      prisma.agent.count({ where: { deletedAt: null } }),

      // 总订单数
      prisma.order.count(),

      // 总激活码数
      prisma.activationCode.count(),

      // 活跃用户数（7天内有激活记录）
      prisma.user.count({
        where: {
          userAgents: {
            some: {
              activatedAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              },
            },
          },
        },
      }),

      // 已使用的激活码数
      prisma.activationCode.count({
        where: { status: 'ACTIVATED' },
      }),

      // 总收入
      prisma.order.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }).then((result) => result._sum.amount || 0),

      // 最近7天的订单
      prisma.order.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
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
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      // 热门智能体（拥有用户最多的前5个）
      prisma.agent.findMany({
        where: { deletedAt: null },
        include: {
          _count: {
            select: { userAgents: true },
          },
        },
        orderBy: {
          userAgents: {
            _count: 'desc',
          },
        },
        take: 5,
      }),
    ])

    return NextResponse.json(
      {
        success: true,
        stats: {
          users: {
            total: totalUsers,
            active: activeUsers,
          },
          agents: {
            total: totalAgents,
          },
          orders: {
            total: totalOrders,
            recent: recentOrders,
            totalRevenue,
          },
          activationCodes: {
            total: totalActivationCodes,
            used: usedActivationCodes,
            unused: totalActivationCodes - usedActivationCodes,
          },
          topAgents,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    if (error.message === 'ADMIN_REQUIRED') {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 })
    }
    console.error('获取统计数据错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
