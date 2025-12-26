import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import prisma from '@/lib/prisma'

/**
 * PATCH /api/admin/users/[id]
 * 更新用户状态（封禁/解封）
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)

    const { id } = await params
    const body = await request.json()
    const { action } = body // 'ban' | 'unban' | 'set_admin' | 'remove_admin'

    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    const updateData: any = {}

    if (action === 'ban') {
      updateData.status = 'BANNED'
    } else if (action === 'unban') {
      updateData.status = 'ACTIVE'
    } else if (action === 'set_admin') {
      updateData.role = 'ADMIN'
    } else if (action === 'remove_admin') {
      updateData.role = 'USER'
    } else {
      return NextResponse.json({ error: '无效的操作' }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        nickname: true,
        role: true,
        status: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: '用户状态更新成功',
        user: updatedUser,
      },
      { status: 200 }
    )
  } catch (error: any) {
    if (error.message === 'ADMIN_REQUIRED') {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 })
    }
    console.error('更新用户错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
