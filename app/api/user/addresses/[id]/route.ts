import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import prisma from '@/lib/prisma'

/**
 * PUT /api/user/addresses/[id]
 * 更新收货地址
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    const body = await request.json()
    const { name, phone, province, city, district, detail, isDefault } = body

    // 验证地址是否属于当前用户
    const existingAddress = await prisma.address.findUnique({
      where: { id },
    })

    if (!existingAddress) {
      return NextResponse.json({ error: '地址不存在' }, { status: 404 })
    }

    if (existingAddress.userId !== payload.userId) {
      return NextResponse.json({ error: '无权操作此地址' }, { status: 403 })
    }

    // 验证必填字段
    if (!name || !phone || !province || !city || !district || !detail) {
      return NextResponse.json(
        { error: '请填写完整的地址信息' },
        { status: 400 }
      )
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: '手机号格式不正确' },
        { status: 400 }
      )
    }

    // 如果设置为默认地址，需要先将其他地址设为非默认
    if (isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: payload.userId,
          id: { not: id },
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      })
    }

    const address = await prisma.address.update({
      where: { id },
      data: {
        name,
        phone,
        province,
        city,
        district,
        detail,
        isDefault: isDefault || false,
      },
    })

    return NextResponse.json({
      success: true,
      address,
      message: '地址更新成功',
    })
  } catch (error: any) {
    console.error('更新收货地址错误:', error)
    if (error.message === 'Token无效或已过期') {
      return NextResponse.json({ error: 'Token无效或已过期' }, { status: 401 })
    }
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

/**
 * DELETE /api/user/addresses/[id]
 * 删除收货地址
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const payload = await verifyToken(token)

    // 验证地址是否属于当前用户
    const existingAddress = await prisma.address.findUnique({
      where: { id },
    })

    if (!existingAddress) {
      return NextResponse.json({ error: '地址不存在' }, { status: 404 })
    }

    if (existingAddress.userId !== payload.userId) {
      return NextResponse.json({ error: '无权操作此地址' }, { status: 403 })
    }

    await prisma.address.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: '地址删除成功',
    })
  } catch (error: any) {
    console.error('删除收货地址错误:', error)
    if (error.message === 'Token无效或已过期') {
      return NextResponse.json({ error: 'Token无效或已过期' }, { status: 401 })
    }
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

/**
 * PATCH /api/user/addresses/[id]
 * 设置默认地址
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const payload = await verifyToken(token)

    // 验证地址是否属于当前用户
    const existingAddress = await prisma.address.findUnique({
      where: { id },
    })

    if (!existingAddress) {
      return NextResponse.json({ error: '地址不存在' }, { status: 404 })
    }

    if (existingAddress.userId !== payload.userId) {
      return NextResponse.json({ error: '无权操作此地址' }, { status: 403 })
    }

    // 先将其他地址设为非默认
    await prisma.address.updateMany({
      where: {
        userId: payload.userId,
        id: { not: id },
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    })

    // 设置当前地址为默认
    const address = await prisma.address.update({
      where: { id },
      data: {
        isDefault: true,
      },
    })

    return NextResponse.json({
      success: true,
      address,
      message: '已设置为默认地址',
    })
  } catch (error: any) {
    console.error('设置默认地址错误:', error)
    if (error.message === 'Token无效或已过期') {
      return NextResponse.json({ error: 'Token无效或已过期' }, { status: 401 })
    }
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
