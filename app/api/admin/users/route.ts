import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import prisma from '@/lib/prisma'

/**
 * GET /api/admin/users
 * 获取所有用户列表（管理员）
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // ACTIVE | BANNED
    const role = searchParams.get('role') // USER | ADMIN

    const where: any = {}
    if (status) where.status = status
    if (role) where.role = role

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        nickname: true,
        avatar: true,
        role: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            userAgents: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        users,
      },
      { status: 200 }
    )
  } catch (error: any) {
    if (error.message === 'ADMIN_REQUIRED') {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 })
    }
    console.error('获取用户列表错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
